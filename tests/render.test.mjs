import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile, symlink } from 'node:fs/promises';
import { resolveRoot } from '../scripts/render.mjs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const exec = promisify(execFile);
const renderer = fileURLToPath(new URL('../scripts/render.mjs', import.meta.url));
const cli = args => exec(process.execPath, [renderer, ...args]);

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator test '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const html = path.join(directory, 'scene with spaces.html');
  await writeFile(path.join(directory, 'dot.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="10" fill="white"/></svg>');
  await writeFile(html, `<body style="margin:0"><img src="dot.svg"><script>
    window.renderFrame = async t => {
      document.body.style.background = t < 0.5 ? 'rgb(255,0,0)' : 'rgb(0,0,255)';
      document.querySelector('img').style.transform = 'translateX(' + t * 100 + 'px)';
    };
  </script>`);
  return { directory, html };
}

test('real 1 second MP4 has expected frames, changing pixels, adjacent asset and padded audio', async t => {
  const { directory, html } = await fixture(t);
  const output = path.join(directory, 'video output.mp4');
  const audio = path.join(directory, 'short tone.wav');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.2', audio]);
  const result = await cli(['--input', html, '--output', output, '--duration', '1', '--width', '160', '--height', '90', '--fps', '10', '--audio', audio]);
  assert.equal(JSON.parse(result.stdout).frames, 10);
  assert.deepEqual(JSON.parse(result.stdout).warnings, []);
  assert.doesNotMatch(result.stderr, /truncated/);
  const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', output])).stdout);
  const video = probe.streams.find(s => s.codec_type === 'video');
  assert.equal(video.width, 160);
  assert.equal(video.height, 90);
  assert.equal(Number(video.nb_frames), 10);
  assert.equal(Number(video.duration), 1);
  assert.equal(probe.streams.find(s => s.codec_type === 'audio').codec_name, 'aac');
  const hashes = (await exec('ffmpeg', ['-v', 'error', '-i', output, '-map', '0:v:0', '-f', 'framemd5', '-'])).stdout
    .split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').at(-1).trim());
  assert.notEqual(hashes[0], hashes.at(-1));
  assert.ok(!(await readdir(directory)).some(name => name.startsWith('.video-illustrator-')));
});

test('existing output survives refusal and an explicitly allowed replacement that fails', async t => {
  const { directory, html } = await fixture(t);
  const output = path.join(directory, 'keep.mp4');
  await writeFile(output, 'prior result');
  const args = ['--input', html, '--output', output, '--duration', '1'];
  await assert.rejects(cli(args), /Output already exists/);
  await writeFile(html, '<body>Missing renderer</body>');
  await assert.rejects(cli([...args, '--overwrite']), /window.renderFrame/);
  assert.equal(await readFile(output, 'utf8'), 'prior result');
  assert.ok(!(await readdir(directory)).some(name => name.startsWith('.video-illustrator-')));
});

test('still capture uses requested absolute time and creates a PNG', async t => {
  const { directory, html } = await fixture(t);
  const output = path.join(directory, 'still.png');
  const result = await cli(['--input', html, '--output', output, '--still', '0.75', '--width', '160', '--height', '90']);
  assert.equal(JSON.parse(result.stdout).time, 0.75);
  assert.equal((await readFile(output)).subarray(1, 4).toString(), 'PNG');
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', output, '-vf', 'crop=1:1:0:89,format=rgb24', '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  assert.deepEqual([...stdout], [0, 0, 255]);
});


test('absolute symlink CLI prints help while importing the module stays inert', async t => {
  const { directory } = await fixture(t);
  const alias = path.join(directory, 'runtime renderer.mjs');
  await symlink(renderer, alias);
  const help = await exec(process.execPath, [alias, '--help']);
  assert.match(help.stdout, /Render local HTML/);
  const imported = await exec(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(alias).href)}); console.log('imported');`]);
  assert.equal(imported.stdout.trim(), 'imported');
  assert.equal(imported.stderr, '');
});

test('absolute symlink CLI exports a real MP4 and warns before trimming long source audio', async t => {
  const { directory, html } = await fixture(t);
  const alias = path.join(directory, 'runtime renderer.mjs');
  await symlink(renderer, alias);
  const audio = path.join(directory, 'long tone.wav');
  const output = path.join(directory, 'symlink result.mp4');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', audio]);
  const result = await exec(process.execPath, [alias, '--input', html, '--output', output, '--duration', '1', '--audio', audio]);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.frames, 30);
  assert.equal(receipt.warnings.length, 1);
  assert.match(receipt.warnings[0], /2\.000s.*1\.000s.*truncated/);
  assert.match(result.stderr, /Warning: Source audio/);
  const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', output])).stdout);
  const video = probe.streams.find(stream => stream.codec_type === 'video');
  assert.equal(Number(video.nb_frames), 30);
  assert.equal(Number(video.duration), 1);
  assert.equal(video.width, 1280);
  assert.equal(video.height, 720);
  assert.equal(video.r_frame_rate, '30/1');
  assert.ok(probe.streams.some(stream => stream.codec_type === 'audio'));
});

test('SIGINT and SIGTERM mid-render remove the staging folder and exit with the signal code', async t => {
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    const { directory, html } = await fixture(t);
    await writeFile(html, `<body style="margin:0"><script>
      window.renderFrame = async t => {
        await new Promise(resolve => setTimeout(resolve, 150));
        document.body.style.background = 'rgb(' + Math.round(t * 20) % 255 + ',0,0)';
      };
    </script>`);
    const child = spawn(process.execPath, [renderer, '--input', html, '--output', path.join(directory, 'long.mp4'),
      '--duration', '60', '--width', '160', '--height', '90', '--fps', '10'], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', data => { stderr += data; });
    const closed = new Promise(resolve => child.on('close', (exitCode, exitSignal) => resolve({ exitCode, exitSignal })));
    const staging = async () => (await readdir(directory)).filter(name => name.startsWith('.video-illustrator-'));
    let found = [];
    for (let i = 0; i < 200 && !found.length; i++) {
      found = await staging();
      if (found.length && (await readdir(path.join(directory, found[0]))).length < 2) found = [];
      if (!found.length) await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(found.length, 1, `staging folder with frames should appear before ${signal}`);
    child.kill(signal);
    const { exitCode } = await closed;
    assert.equal(exitCode, code);
    assert.match(stderr, new RegExp(`interrupted by ${signal}`));
    assert.deepEqual(await staging(), []);
    assert.ok(!(await readdir(directory)).includes('long.mp4'));
  }
});

test('default root is the working directory when the scene is inside it, so ../assets loads without --root', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator cwd root '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const project = path.join(directory, 'project');
  await mkdir(path.join(project, 'scene'), { recursive: true });
  await mkdir(path.join(project, 'inputs', 'assets'), { recursive: true });
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x00ff00:s=16x16', '-frames:v', '1', path.join(project, 'inputs', 'assets', 'green.png')]);
  const html = path.join(project, 'scene', 'scene.html');
  await writeFile(html, `<body style="margin:0;background:#000"><img src="../inputs/assets/green.png" style="display:block;width:160px;height:90px"><script>
    window.renderFrame = async () => {};
  </script>`);
  const output = path.join(project, 'still.png');
  const args = [renderer, '--input', 'scene/scene.html', '--output', output, '--still', '0', '--width', '160', '--height', '90'];
  const result = JSON.parse((await exec(process.execPath, args, { cwd: project })).stdout);
  assert.equal(result.root_source, 'cwd');
  assert.equal(result.root, await realpath(project));
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', output, '-vf', 'crop=1:1:80:45,format=rgb24', '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  const [r, g, b] = [...stdout];
  assert.ok(r < 8 && g > 245 && b < 8, `expected the green asset, got ${[r, g, b]}`);
  // Run from a folder that does not contain the scene: the root falls back to the scene's
  // folder, ../inputs is outside it and the image cannot load.
  const elsewhere = await mkdtemp(path.join(tmpdir(), 'video illustrator elsewhere '));
  t.after(() => rm(elsewhere, { recursive: true, force: true }));
  await assert.rejects(exec(process.execPath, [renderer, '--input', html, '--output', path.join(project, 'fallback.png'), '--still', '0', '--width', '160', '--height', '90'], { cwd: elsewhere }), /cannot be decoded/);
  const fallback = await resolveRoot(await realpath(html), undefined, elsewhere);
  assert.deepEqual(fallback, { root: await realpath(path.join(project, 'scene')), rootSource: 'scene' });
  // The filesystem root is never an implicit served root.
  assert.equal((await resolveRoot(await realpath(html), undefined, '/')).rootSource, 'scene');
});

// AAC starts with 1024 priming samples; the MP4 edit list hides them. Measured once to decide
// whether render.mjs needs to compensate (0.5 design: only if the offset reaches one frame).
test('AAC output keeps a click within one frame of the matching flash, with and without the edit list', async t => {
  const { directory, html } = await fixture(t);
  await writeFile(html, `<body style="margin:0;background:#000"><script>
    window.renderFrame = async t => { document.body.style.background = t >= 0.9999 && t < 1.2 ? '#fff' : '#000'; };
  </script>`);
  const click = path.join(directory, 'click.wav'), output = path.join(directory, 'sync.mp4');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', "aevalsrc='0.9*between(t\\,1.0\\,1.0005)':s=48000:d=2", click]);
  await cli(['--input', html, '--output', output, '--duration', '2', '--width', '160', '--height', '90', '--audio', click]);
  const onset = async (extra = []) => {
    const { stdout } = await exec('ffmpeg', ['-v', 'error', ...extra, '-i', output, '-map', '0:a', '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], { encoding: 'buffer', maxBuffer: 16 << 20 });
    const pcm = new Float32Array(stdout.buffer, stdout.byteOffset, stdout.length / 4);
    return pcm.findIndex(v => Math.abs(v) > 0.1) / 48000;
  };
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', output, '-vf', 'scale=1:1,format=gray', '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  const flash = [...stdout].findIndex(v => v > 128) / 30;
  assert.equal(flash, 1);
  const honored = await onset(), raw = await onset(['-ignore_editlist', '1']);
  assert.ok(Math.abs(honored - flash) < 0.002, `edit list honored: click at ${honored}`);
  assert.ok(raw - flash > 0.015 && raw - flash < 1 / 30, `edit list ignored: click at ${raw} (priming delay under one frame)`);
});
