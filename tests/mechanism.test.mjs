import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const renderer = fileURLToPath(new URL('../scripts/render.mjs', import.meta.url));
const template = fileURLToPath(new URL('../references/mechanism-template.html', import.meta.url));
const cli = args => exec(process.execPath, [renderer, ...args], { maxBuffer: 1 << 24 });

async function tempDir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator mechanism '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

const frameHashes = async file => (await exec('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'])).stdout
  .split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').at(-1).trim());
const size = async file => (await exec('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file])).stdout.trim();
const rgb = async (file, crop) => (await exec('ffmpeg', ['-v', 'error', '-i', file, '-vf', `crop=${crop},format=rgb24`, '-f', 'rawvideo', '-'], { encoding: 'buffer', maxBuffer: 1 << 24 })).stdout;

test('mechanism template renders the whole example with frames that keep changing', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  await copyFile(template, scene);
  const output = path.join(directory, 'landscape.mp4');
  const receipt = JSON.parse((await cli(['--input', scene, '--output', output, '--duration', '12', '--width', '320', '--height', '180', '--fps', '2'])).stdout);
  assert.equal(receipt.frames, 24);
  assert.equal(receipt.served, 'http');
  assert.equal(await size(output), '320,180');
  const hashes = await frameHashes(output);
  assert.ok(new Set(hashes).size >= 16, 'spins, packets and step changes should change most frames');
  // Landscape keeps its bottom 18% plain for the editor's subtitles.
  const still = path.join(directory, 'landscape.png');
  await cli(['--input', scene, '--output', still, '--still', '5', '--duration', '12', '--width', '640', '--height', '360']);
  const band = await rgb(still, '640:64:0:296');
  const spread = band.reduce((m, v) => Math.max(m, v), 0) - band.reduce((m, v) => Math.min(m, v), 255);
  assert.ok(spread < 24, 'the bottom 18% of the landscape picture should stay plain paper');
});

test('the same scene recomposes for portrait, and captions appear only in a preview', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  const source = await readFile(template, 'utf8');
  assert.ok(source.includes('const CUES = [];'));
  await writeFile(scene, source.replace('const CUES = [];', "const CUES = [{ text: 'a preview caption', start: 0, end: 12 }];"));
  const clean = path.join(directory, 'portrait.png');
  const preview = path.join(directory, 'portrait-captions.png');
  await cli(['--input', scene, '--output', clean, '--still', '5', '--duration', '12', '--width', '360', '--height', '640']);
  await cli(['--input', scene, '--output', preview, '--still', '5', '--duration', '12', '--width', '360', '--height', '640', '--query', 'captions=1']);
  assert.equal(await size(clean), '360,640');
  // The caption band sits in the portrait lower quarter, which the clean picture leaves empty.
  const band = '360:120:0:470';
  const a = await rgb(clean, band), b = await rgb(preview, band);
  const spread = a.reduce((m, v) => Math.max(m, v), 0) - a.reduce((m, v) => Math.min(m, v), 255);
  assert.ok(spread < 24, 'the lower quarter of the delivered picture should stay plain paper');
  assert.notDeepEqual(a, b);
  const top = '360:300:0:60';
  assert.deepEqual(await rgb(clean, top), await rgb(preview, top), 'captions must not change the picture above them');
});

const template2d = fileURLToPath(new URL('../references/mechanism-template-2d.html', import.meta.url));
const block = (source, name) => source.match(new RegExp(`const ${name} = \\[[\\s\\S]*?\\n\\];`))?.[0];
// Largest spread of any one colour channel: a tinted paper (kraft, slate) is still plain.
const channelSpread = buffer => Math.max(...[0, 1, 2].map(c => {
  let lo = 255, hi = 0;
  for (let i = c; i < buffer.length; i += 3) { lo = Math.min(lo, buffer[i]); hi = Math.max(hi, buffer[i]); }
  return hi - lo;
}));

test('the 2D starter reads exactly the content lists the 3D template ships with', async () => {
  const [a, b] = await Promise.all([readFile(template, 'utf8'), readFile(template2d, 'utf8')]);
  for (const name of ['SUBJECTS', 'LINKS', 'STEPS']) {
    assert.ok(block(a, name), `3D template has no ${name}`);
    assert.equal(block(b, name), block(a, name), `${name} differs between the starters`);
  }
  assert.ok(b.includes('const CUES = [];') && b.includes('window.renderFrame = async'));
});

test('2D starter: both shapes, frames that change, plain caption bands, same pixels for the same t', async t => {
  const directory = await tempDir(t);
  const scene = path.join(directory, 'scene.html');
  const source = await readFile(template2d, 'utf8');
  await writeFile(scene, source.replace('const CUES = [];', "const CUES = [{ text: 'a preview caption', start: 0, end: 12 }];"));
  const output = path.join(directory, 'landscape.mp4');
  const receipt = JSON.parse((await cli(['--input', scene, '--output', output, '--duration', '12', '--width', '320', '--height', '180', '--fps', '2'])).stdout);
  assert.equal(receipt.frames, 24);
  assert.ok(new Set(await frameHashes(output)).size >= 10, 'focus, packets and step changes should change frames');
  const stills = [];
  for (const name of ['a', 'b']) {
    const still = path.join(directory, `landscape-${name}.png`);
    await cli(['--input', scene, '--output', still, '--still', '7.2', '--duration', '12', '--width', '640', '--height', '360']);
    stills.push(still);
  }
  assert.deepEqual(await rgb(stills[0], '640:360:0:0'), await rgb(stills[1], '640:360:0:0'), 'the same t must give the same pixels');
  assert.ok(channelSpread(await rgb(stills[0], '640:64:0:296')) < 24, 'the bottom 18% of the landscape picture should stay plain paper');
  const clean = path.join(directory, 'portrait.png'), preview = path.join(directory, 'portrait-captions.png');
  await cli(['--input', scene, '--output', clean, '--still', '5', '--duration', '12', '--width', '360', '--height', '640']);
  await cli(['--input', scene, '--output', preview, '--still', '5', '--duration', '12', '--width', '360', '--height', '640', '--query', 'captions=1']);
  assert.equal(await size(clean), '360,640');
  const band = '360:120:0:470';
  assert.ok(channelSpread(await rgb(clean, band)) < 24, 'the lower quarter of the delivered portrait picture should stay plain paper');
  assert.notDeepEqual(await rgb(clean, band), await rgb(preview, band));
  assert.deepEqual(await rgb(clean, '360:300:0:60'), await rgb(preview, '360:300:0:60'), 'captions must not change the picture above them');
});
