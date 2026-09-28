import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../scripts/render.mjs';

const exec = promisify(execFile);
const renderer = fileURLToPath(new URL('../scripts/render.mjs', import.meta.url));
const template = fileURLToPath(new URL('../references/three-template.html', import.meta.url));
const cli = args => exec(process.execPath, [renderer, ...args], { maxBuffer: 1 << 24 });

async function tempDir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator 3d '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

const frameHashes = async file => (await exec('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'])).stdout
  .split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').at(-1).trim());

test('three.js template renders a 1 second MP4 through the local server with changing frames', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  await copyFile(template, scene);
  await mkdir(path.join(directory, 'assets'));
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=400x600:rate=1', '-frames:v', '1', path.join(directory, 'assets', 'cover.png')]);
  const output = path.join(directory, 'three.mp4');
  const result = await cli(['--input', scene, '--output', output, '--duration', '1', '--width', '320', '--height', '180', '--fps', '10', '--query', 'subframes=2']);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.frames, 10);
  assert.equal(receipt.served, 'http');
  assert.equal(typeof receipt.gl_renderer, 'string');
  assert.ok(receipt.gl_renderer.length > 0);
  assert.equal(receipt.gpu_requested, false);
  assert.ok(receipt.timing.frame_ms > 0);
  const hashes = await frameHashes(output);
  assert.equal(hashes.length, 10);
  assert.ok(new Set(hashes).size >= 8, 'camera motion should change nearly every frame');
  assert.ok(!(await readdir(directory)).some(name => name.startsWith('.video-illustrator-')));
});

test('--root serves images outside the scene folder same-origin, so getImageData works', async t => {
  const directory = await tempDir(t);
  const project = path.join(directory, 'project');
  await mkdir(path.join(project, 'scene'), { recursive: true });
  await mkdir(path.join(project, 'inputs', 'assets'), { recursive: true });
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x00ff00:size=8x8,format=rgb24', '-frames:v', '1', path.join(project, 'inputs', 'assets', 'green.png')]);
  const scene = path.join(project, 'scene', 'scene.html');
  await writeFile(scene, `<body style="margin:0"><canvas width="8" height="8"></canvas><script>
    const image = new Image();
    image.src = '../inputs/assets/green.png';
    const loaded = image.decode();
    window.renderFrame = async () => {
      await loaded;
      const ctx = document.querySelector('canvas').getContext('2d');
      ctx.drawImage(image, 0, 0);
      const [r, g, b] = ctx.getImageData(4, 4, 1, 1).data;
      document.body.style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
    };
  </script>`);
  const still = path.join(directory, 'sample.png');
  const result = await cli(['--input', scene, '--output', still, '--still', '0', '--width', '64', '--height', '64', '--root', project]);
  assert.equal(JSON.parse(result.stdout).served, 'http');
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', still, '-vf', 'crop=1:1:63:63,format=rgb24', '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  assert.deepEqual([...stdout], [0, 255, 0]);
  // The legacy file:// mode taints the canvas, which is the failure --root fixes.
  await assert.rejects(cli(['--input', scene, '--output', path.join(directory, 'legacy.png'), '--still', '0', '--file-url']), /getImageData|SecurityError|tainted/i);
  await assert.rejects(cli(['--input', scene, '--output', path.join(directory, 'outside.png'), '--still', '0', '--root', path.join(project, 'inputs')]), /inside --root/);
});

test('static server binds 127.0.0.1, maps /__vi/three/ and refuses paths outside the root', async t => {
  const directory = await tempDir(t);
  const root = path.join(directory, 'root');
  await mkdir(root);
  await writeFile(path.join(root, 'a b.txt'), 'inside');
  await writeFile(path.join(directory, 'secret.txt'), 'outside');
  const server = await startStaticServer(root, { '/__vi/three/': path.dirname(path.dirname(fileURLToPath(import.meta.resolve('three')))), '/__vi/missing/': null });
  t.after(() => server.close());
  assert.match(server.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const get = async pathname => { const response = await fetch(server.origin + pathname); return { status: response.status, text: await response.text(), type: response.headers.get('content-type') }; };
  assert.deepEqual(await get('/a%20b.txt'), { status: 200, text: 'inside', type: 'text/plain; charset=utf-8' });
  assert.notEqual((await get('/%2e%2e/secret.txt')).status, 200);
  assert.notEqual((await get('/..%2fsecret.txt')).status, 200);
  const three = await get('/__vi/three/build/three.module.js');
  assert.equal(three.status, 200);
  assert.match(three.type, /javascript/);
  assert.match((await get('/__vi/missing/x.js')).text, /npm ci/);
});

test('--gpu reports the WebGL renderer and warns instead of silently using software GL', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  await writeFile(scene, '<body><script>window.renderFrame = async () => {};</script>');
  const result = await cli(['--input', scene, '--output', path.join(directory, 'gpu.png'), '--still', '0', '--width', '64', '--height', '64', '--gpu']);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.gpu_requested, true);
  assert.equal(typeof receipt.gl_renderer, 'string');
  if (receipt.software_gl) {
    assert.match(receipt.warnings.join(' '), /GPU requested/);
    assert.match(result.stderr, /Warning: GPU requested/);
  } else {
    assert.doesNotMatch(receipt.gl_renderer, /SwiftShader/i);
    assert.deepEqual(receipt.warnings, []);
  }
  t.diagnostic(`gl_renderer with --gpu: ${receipt.gl_renderer}`);
});

test('sub-frame motion blur keeps exposure: 8 accumulated sub-frames match 1 in mean brightness', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  await copyFile(template, scene);
  await mkdir(path.join(directory, 'assets'));
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=400x600:rate=1', '-frames:v', '1', path.join(directory, 'assets', 'cover.png')]);
  const mean = async subframes => {
    const still = path.join(directory, `blur-${subframes}.png`);
    await cli(['--input', scene, '--output', still, '--still', '5.4', '--width', '160', '--height', '90', '--query', `subframes=${subframes}&adaptive=0`]);
    const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', still, '-vf', 'format=rgb24', '-f', 'rawvideo', '-'], { encoding: 'buffer', maxBuffer: 1 << 24 });
    return stdout.reduce((sum, value) => sum + value, 0) / stdout.length;
  };
  const [one, eight] = [await mean(1), await mean(8)];
  assert.ok(one > 5, `frame should not be black (mean ${one})`);
  assert.ok(Math.abs(eight - one) / one < 0.05, `mean brightness 1 sub-frame ${one.toFixed(2)} vs 8 sub-frames ${eight.toFixed(2)}`);
});
