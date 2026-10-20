#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createReadStream, rmSync } from 'node:fs';
import { access, link, mkdir, mkdtemp, realpath, rename, rm, stat } from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Render local HTML exposing async window.renderFrame(timeSeconds).

Video: node scripts/render.mjs --input scene.html --output clip.mp4 --duration 8
Still: node scripts/render.mjs --input scene.html --output preview.png --still 2.5

Options: --width 1280 --height 720 --fps 30 --audio existing.wav --overwrite
         --root <dir>    folder served to the page (default: the current working directory
                         when the scene is inside it, otherwise the scene's folder)
         --query <q>     query string appended to the scene URL (e.g. subframes=8)
         --gpu           ask Chromium for the hardware GPU (macOS: ANGLE Metal)
         --file-url      legacy: open the scene as file:// instead of the local server
Requires Node 20+, npm install, npx playwright install chromium, and ffmpeg on PATH.
Frames use absolute t = frame / fps; duration rounds up to the next whole frame.
HTML must set all animation state from t (no running CSS animations or timers).
The scene is served from a private http://127.0.0.1 server bound to a random port and
closed after the render; files outside --root are refused. /__vi/three/ serves this
skill's pinned three.js (importmap: "three": "/__vi/three/build/three.module.js").
Same-origin serving keeps canvas getImageData working on images from --root.
Before scripts run the page gets window.videoIllustrator = {fps, width, height}.
The result JSON reports gl_renderer (WebGL UNMASKED_RENDERER); without --gpu, or when
the GPU is unavailable, it is SwiftShader software rendering and a warning says so.
--still exports PNG at the requested time and does not require ffmpeg.
Run it in the foreground and wait: a host that ends a non-interactive session kills background renders.
On SIGINT/SIGTERM or a crash the CLI removes its .video-illustrator-* staging folder (SIGKILL cannot be handled).`;

// Staging folders and child processes that must not outlive an interrupted run.
const liveTemporaries = new Set();
const liveChildren = new Set();

// Frames for a duration. Durations usually arrive rounded to the millisecond (32.067 s for 962 frames at 30 fps),
// which a bare ceil turns into one frame too many; a hair of tolerance keeps whole-frame durations whole.
export function frameCount(duration, fps) {
  return Math.max(1, Math.ceil(duration * fps - 0.02));
}

export function cleanupSync() {
  for (const child of liveChildren) { try { child.kill('SIGKILL'); } catch {} }
  liveChildren.clear();
  for (const directory of liveTemporaries) { try { rmSync(directory, { recursive: true, force: true }); } catch {} }
  liveTemporaries.clear();
}

function installExitCleanup() {
  process.on('exit', cleanupSync);
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
    process.on(signal, () => {
      console.error(`Render interrupted by ${signal}; removed staging files.`);
      cleanupSync();
      process.exit(code);
    });
  }
}

function parse(argv) {
  const values = new Set(['input', 'output', 'duration', 'width', 'height', 'fps', 'audio', 'still', 'root', 'query']);
  const flags = { '--overwrite': 'overwrite', '--gpu': 'gpu', '--file-url': 'fileUrl' };
  const opts = { width: 1280, height: 720, fps: 30, overwrite: false, gpu: false, fileUrl: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (argv[i] === '--help') return null;
    if (flags[argv[i]]) { opts[flags[argv[i]]] = true; continue; }
    if (!argv[i].startsWith('--') || !values.has(key)) throw Error(`Unknown option: ${argv[i]}`);
    if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) throw Error(`Missing value for --${key}`);
    opts[key] = argv[++i];
  }
  if (!opts.input || !opts.output) throw Error('--input and --output are required. Use --help.');
  if (opts.fileUrl && opts.root) throw Error('--root applies to the local server; it cannot be combined with --file-url.');
  if (opts.query !== undefined) opts.query = opts.query.replace(/^\?/, '');
  for (const key of ['width', 'height', 'fps']) {
    opts[key] = Number(opts[key]);
    if (!Number.isFinite(opts[key]) || opts[key] <= 0) throw Error(`--${key} must be positive.`);
  }
  for (const key of ['width', 'height']) {
    if (!Number.isInteger(opts[key])) throw Error(`--${key} must be an integer.`);
  }
  if (opts.still !== undefined) {
    opts.still = Number(opts.still);
    if (!Number.isFinite(opts.still) || opts.still < 0) throw Error('--still must be a nonnegative time in seconds.');
    if (opts.audio) throw Error('--audio applies only to MP4 rendering.');
    if (path.extname(opts.output).toLowerCase() !== '.png') throw Error('--still requires a .png output.');
  } else {
    opts.duration = Number(opts.duration);
    if (!Number.isFinite(opts.duration) || opts.duration <= 0) throw Error('--duration must be positive.');
    if (opts.width % 2 || opts.height % 2) throw Error('MP4 width and height must be even (H.264 yuv420p).');
    if (path.extname(opts.output).toLowerCase() !== '.mp4') throw Error('Video output must use .mp4.');
  }
  return opts;
}

async function exists(filename) {
  try { await access(filename); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm', '.ktx2': 'image/ktx2', '.hdr': 'application/octet-stream', '.exr': 'application/octet-stream'
};

// The skill's pinned three.js, or null when npm install has not been run.
export function threeDirectory() {
  try { return path.dirname(path.dirname(createRequire(import.meta.url).resolve('three'))); } catch { return null; }
}

// Serve root (and mounted prefixes) on 127.0.0.1 at a random port. Paths escaping a base are refused.
export async function startStaticServer(root, mounts = {}) {
  const server = http.createServer(async (request, response) => {
    const send = (code, text) => { response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(text); };
    if (request.method !== 'GET' && request.method !== 'HEAD') return send(405, 'Method not allowed');
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); } catch { return send(400, 'Bad path'); }
    let base = root;
    let relative = pathname;
    for (const [prefix, directory] of Object.entries(mounts)) {
      if (pathname.startsWith(prefix)) {
        if (!directory) return send(404, `${prefix} is unavailable: run npm ci in the video-illustrator skill directory.`);
        base = directory;
        relative = pathname.slice(prefix.length);
        break;
      }
    }
    const file = path.resolve(base, '.' + path.posix.normalize('/' + relative));
    if (file !== base && !file.startsWith(base + path.sep)) return send(403, 'Outside the served root');
    try {
      const info = await stat(file);
      if (!info.isFile()) return send(404, 'Not a file');
      response.writeHead(200, {
        'Content-Type': CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size, 'Cache-Control': 'no-store'
      });
      if (request.method === 'HEAD') return response.end();
      createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch { send(404, 'Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(resolve => { server.closeAllConnections(); server.close(() => resolve()); })
  };
}

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function gpuArgs() {
  // --enable-gpu turns on hardware GL in headless Chromium; ANGLE's Metal backend is the macOS path.
  return process.platform === 'darwin' ? ['--enable-gpu', '--use-angle=metal'] : ['--enable-gpu'];
}

function run(command, args, captureOutput = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', captureOutput ? 'pipe' : 'ignore', 'pipe'] });
    liveChildren.add(child);
    let stderr = '';
    let stdout = '';
    if (captureOutput) child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-12000); });
    child.on('error', error => {
      liveChildren.delete(child);
      reject(Error(error.code === 'ENOENT'
        ? `${command} is not installed or is not on PATH. Install it before rendering.` : error.message));
    });
    child.on('close', code => {
      liveChildren.delete(child);
      if (code === 0) resolve(stdout);
      else reject(Error(`${command} exited with ${code}: ${stderr}`));
    });
  });
}

// Default served root: the working directory when the scene lies inside it (so a scene in a
// subfolder can reach sibling folders such as ../inputs/assets), otherwise the scene's folder.
// The filesystem root is never chosen implicitly.
export async function resolveRoot(input, explicitRoot, cwd = process.cwd()) {
  if (explicitRoot !== undefined) return { root: await realpath(path.resolve(explicitRoot)), rootSource: 'flag' };
  const workingDirectory = await realpath(cwd).catch(() => null);
  if (workingDirectory && workingDirectory !== path.parse(workingDirectory).root && input.startsWith(workingDirectory + path.sep)) {
    return { root: workingDirectory, rootSource: 'cwd' };
  }
  return { root: path.dirname(input), rootSource: 'scene' };
}

export async function render(opts) {
  const input = await realpath(path.resolve(opts.input));
  const output = path.resolve(opts.output);
  if (!(await stat(input)).isFile()) throw Error('--input must be an HTML file.');
  const { root, rootSource } = opts.fileUrl ? {} : await resolveRoot(input, opts.root);
  if (root) {
    if (!(await stat(root)).isDirectory()) throw Error('--root must be a folder.');
    if (!input.startsWith(root + path.sep)) throw Error(`--input must be inside --root (${root}).`);
  }
  if (await exists(output)) {
    if ((await realpath(output)) === input) throw Error('Output cannot replace the input HTML.');
    if (!opts.overwrite) throw Error(`Output already exists: ${output}. Use --overwrite to replace it.`);
  }
  if (opts.audio) {
    opts.audio = await realpath(path.resolve(opts.audio));
    if (!(await stat(opts.audio)).isFile()) throw Error('--audio must be a local audio file.');
    if (await exists(output) && (await realpath(output)) === opts.audio) throw Error('Output cannot replace the input audio.');
  }
  const still = opts.still !== undefined;
  const warnings = [];
  const warn = warning => { warnings.push(warning); console.error(`Warning: ${warning}`); };
  if (opts.audio && !still) {
    const probe = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', opts.audio], true));
    const audioSeconds = Number(probe.format?.duration);
    if (!Number.isFinite(audioSeconds) || audioSeconds <= 0) throw Error('Could not determine the source audio duration with ffprobe.');
    const videoSeconds = frameCount(opts.duration, opts.fps) / opts.fps;
    if (audioSeconds > videoSeconds + 0.001) {
      const warning = `Source audio is ${audioSeconds.toFixed(3)}s but video is ${videoSeconds.toFixed(3)}s; its tail will be truncated. Match --duration to the source unless this trim is intentional.`;
      warnings.push(warning);
      console.error(`Warning: ${warning}`);
    }
  }
  if (!still) await run('ffmpeg', ['-version']);
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { throw Error('Playwright is missing. Run npm install in this skill directory, then npx playwright install chromium.'); }
  await mkdir(path.dirname(output), { recursive: true });
  const temporary = await mkdtemp(path.join(path.dirname(output), '.video-illustrator-'));
  liveTemporaries.add(temporary);
  const staged = path.join(temporary, still ? 'result.png' : 'result.mp4');
  let browser;
  let server;
  try {
    const launchError = error => Error(`Chromium could not start. If the browser is missing, run npx playwright install chromium. Otherwise inspect the launch error and host permissions below.\n${error.message}`);
    try { browser = await chromium.launch({ headless: true, args: opts.gpu ? gpuArgs() : [] }); }
    catch (error) {
      if (!opts.gpu) throw launchError(error);
      warn(`Chromium failed to start with GPU flags; retried with software rendering. ${error.message.split('\n')[0]}`);
      try { browser = await chromium.launch({ headless: true }); } catch (retry) { throw launchError(retry); }
    }
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: 1 });
    const glRenderer = await page.evaluate(() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return null;
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return name;
      } catch { return null; }
    });
    const softwareGl = !glRenderer || SOFTWARE_GL.test(glRenderer);
    if (opts.gpu && softwareGl) warn(`GPU requested but WebGL is ${glRenderer ? `software rendering (${glRenderer})` : 'unavailable'}; frames render on the CPU and will be much slower.`);
    await page.addInitScript(info => { window.videoIllustrator = Object.freeze(info); }, { fps: opts.fps, width: opts.width, height: opts.height });
    const pageErrors = [];
    const loadProblems = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') loadProblems.push(message.text()); });
    page.on('requestfailed', request => loadProblems.push(`${request.url()} failed: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) loadProblems.push(`${response.url()} returned ${response.status()}`); });
    let url;
    if (root) {
      server = await startStaticServer(root, { '/__vi/three/': threeDirectory() });
      url = server.origin + '/' + path.relative(root, input).split(path.sep).map(encodeURIComponent).join('/');
    } else url = pathToFileURL(input).href;
    if (opts.query) url += '?' + opts.query;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    if (!await page.evaluate(() => typeof window.renderFrame === 'function')) {
      const detail = [...pageErrors, ...new Set(loadProblems)].slice(0, 8).join('; ');
      throw Error(`HTML must expose window.renderFrame(timeSeconds).${detail ? ` Page reported: ${detail}` : ''}`);
    }
    const count = still ? 1 : frameCount(opts.duration, opts.fps);
    // The first frame pays for shader compilation and texture upload, so it is timed apart.
    const timed = { first: 0, frames: 0, draw: 0, capture: 0 };
    for (let frame = 0; frame < count; frame++) {
      const t = still ? opts.still : frame / opts.fps;
      const frameStart = performance.now();
      await page.evaluate(async time => {
        let timer;
        try {
          await Promise.race([
            (async () => {
              await window.renderFrame(time);
              await document.fonts.ready;
              await Promise.all([...document.images].map(img => img.decode()));
            })(),
            new Promise((_, reject) => { timer = setTimeout(() => reject(Error('renderFrame/assets exceeded 30 seconds')), 30000); })
          ]);
        } finally { clearTimeout(timer); }
      }, t);
      if (pageErrors.length) throw Error(`HTML script error: ${pageErrors.join('; ')}`);
      const captureStart = performance.now();
      await page.screenshot({ path: still ? staged : path.join(temporary, `${String(frame).padStart(8, '0')}.png`), type: 'png' });
      const frameEnd = performance.now();
      if (frame === 0) timed.first = frameEnd - frameStart;
      if (frame > 0 || count === 1) {
        timed.frames++;
        timed.draw += captureStart - frameStart;
        timed.capture += frameEnd - captureStart;
      }
    }
    // GPU work can finish inside the screenshot, so frame_ms (draw + capture) is the honest cost.
    const ms = value => +(value / timed.frames).toFixed(1);
    const timing = { first_frame_ms: +timed.first.toFixed(1), frame_ms: ms(timed.draw + timed.capture), draw_ms: ms(timed.draw), capture_ms: ms(timed.capture) };
    await browser.close();
    browser = undefined;
    if (server) { await server.close(); server = undefined; }
    if (!still) {
      const seconds = count / opts.fps;
      const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-framerate', String(opts.fps), '-start_number', '0', '-i', path.join(temporary, '%08d.png')];
      if (opts.audio) args.push('-i', opts.audio);
      args.push('-map', '0:v:0');
      if (opts.audio) args.push('-map', '1:a:0', '-af', 'apad', '-c:a', 'aac');
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-t', String(seconds), '-movflags', '+faststart', staged);
      await run('ffmpeg', args);
    }
    if ((await stat(staged)).size === 0) throw Error('Renderer produced an empty output.');
    // Publish only a complete result. link() atomically refuses a concurrently-created output.
    if (opts.overwrite) await rename(staged, output);
    else await link(staged, output);
    const renderer = { gl_renderer: glRenderer, gpu_requested: Boolean(opts.gpu), software_gl: softwareGl, served: root ? 'http' : 'file', ...(root ? { root, root_source: rootSource } : {}), timing };
    return { output, width: opts.width, height: opts.height, ...(still ? { time: opts.still } : { fps: opts.fps, frames: count, duration: count / opts.fps, audio: Boolean(opts.audio) }), ...renderer, warnings };
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await server.close().catch(() => {});
    await rm(temporary, { recursive: true, force: true });
    liveTemporaries.delete(temporary);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  installExitCleanup();
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else console.log(JSON.stringify(await render(opts), null, 2));
  } catch (error) {
    console.error(`Render failed: ${error.message}`);
    process.exitCode = 1;
  }
}
