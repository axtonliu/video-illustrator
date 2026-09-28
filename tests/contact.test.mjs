import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleTimes, dhashBits, bitsToHex, hamming, distinctScenes, bestMatch } from '../scripts/contact.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/contact.mjs', import.meta.url));

async function tempdir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator contact '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

// 12 s at 10 fps: 0-4 s picture P, 4-8 s a different picture Q with a textured "asset" on it,
// 8-12 s a slow pan (20 px/s) across P. Expected: two distinct scenes, asset in 2 of 6 samples.
async function syntheticClip(directory) {
  const asset = path.join(directory, 'cover asset.png'), clip = path.join(directory, 'clip.mp4');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=96x136', '-frames:v', '1', asset]);
  await exec('ffmpeg', ['-loglevel', 'error',
    '-f', 'lavfi', '-i', "nullsrc=s=1280x360:r=10:d=12,format=yuv420p,geq=lum='128+70*sin(X/90)+45*cos(Y/50+X/200)':cb=128:cr=128",
    '-f', 'lavfi', '-i', "nullsrc=s=640x360:r=10:d=12,format=yuv420p,geq=lum='128+90*sin(Y/23+X*X/40000)':cb=128:cr=128",
    '-i', asset,
    '-filter_complex', "[0]crop=640:360:x='if(lt(t,8),0,(t-8)*20)':y=0[p];[1][2]overlay=x=420:y=110[q];[p][q]overlay=enable='between(t,4,8)',format=yuv420p[v]",
    '-map', '[v]', '-t', '12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', clip]);
  return { asset, clip };
}

test('contact: two different pictures plus a pan count as two scenes; asset estimate finds it only where it is', async t => {
  const directory = await tempdir(t);
  const { asset, clip } = await syntheticClip(directory);
  const out = path.join(directory, 'qa out');
  const { stdout, stderr } = await exec(process.execPath, [script, '--input', clip, '--output-dir', out, '--asset', asset, '--scenes', '4']);
  assert.equal(stdout.trim().split('\n').length, 1);
  const summary = JSON.parse(stdout);
  assert.equal(summary.distinct_scenes, 2);
  const result = JSON.parse(await readFile(path.join(out, 'contact.json'), 'utf8'));
  assert.equal(result.sampling.mode, 'interval');
  assert.deepEqual(result.frames.map(f => f.time), [1, 3, 5, 7, 9, 11]);
  assert.deepEqual(result.frames.map(f => f.new_scene), [true, false, true, false, false, false]);
  assert.equal(result.frames[0].min_distance, null);
  assert.ok(result.frames[2].min_distance >= 64, `Q vs P ${result.frames[2].min_distance}`);
  for (const f of result.frames.slice(4)) assert.ok(f.min_distance < 64, `pan frame ${f.index}: ${f.min_distance} to #${f.nearest}`);
  assert.ok(result.frames[4].nearest <= 1, 'the pan starts on picture P');
  for (const f of result.frames) assert.match(f.dhash, /^[0-9a-f]{64}$/);
  const [a] = result.assets;
  assert.equal(a.estimate, true);
  assert.equal(a.frames_present, 2);
  assert.equal(a.fraction, 0.333);
  assert.deepEqual(result.frames.map(f => f.assets['cover asset.png'].present), [false, false, true, true, false, false]);
  const box = result.frames[2].assets['cover asset.png'].box;             // true box: 420/640, 110/360, 96/640, 136/360
  assert.ok(Math.abs(box[0] - 420 / 640) < 0.03 && Math.abs(box[1] - 110 / 360) < 0.03, `box ${box}`);
  // Two scenes against a four-scene list is a warning, not a failure.
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /below 70% of the scene list \(4\)/);
  assert.match(stderr, /warning: distinct_scenes 2/);
  assert.ok((await stat(path.join(out, 'contact.png'))).size > 1000);
  const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(out, 'contact.png')])).stdout);
  assert.deepEqual([probe.streams[0].width, probe.streams[0].height], [5 * 320 + 6 * 4, 2 * 180 + 3 * 4]);
  await assert.rejects(exec(process.execPath, [script, '--input', clip, '--output-dir', out]), /already exists/);
});

test('contact: bar sampling from beats.json, dHash and matching helpers', () => {
  const s = sampleTimes(9, { beats: { downbeats: [1.5, 3.5, 5.5] } });
  assert.equal(s.mode, 'bars');
  assert.equal(s.bar_seconds, 2);
  assert.deepEqual(s.times, [0.5, 2.5, 4.5, 6.5, 8.5]);   // bars extended before and after the measured downbeats
  assert.deepEqual(sampleTimes(9, { beats: { downbeats: [0.5, 2.5, 4.5, 6.5] } }).times, [1.5, 3.5, 5.5, 7.5]);
  assert.deepEqual(sampleTimes(5, {}).times, [1, 3]);
  assert.deepEqual(sampleTimes(5, { interval: 1 }).times, [0.5, 1.5, 2.5, 3.5, 4.5]);

  const ramp = Uint8Array.from({ length: 17 * 16 }, (_, i) => 255 - (i % 17) * 10);
  const bits = dhashBits(ramp);
  assert.equal(bits.length, 256);
  assert.equal(bitsToHex(bits), 'f'.repeat(64));
  assert.equal(hamming(bits, new Uint8Array(256)), 256);
  const scenes = distinctScenes([bits, new Uint8Array(256), bits.map((b, i) => (i < 10 ? 1 - b : b))], 64);
  assert.equal(scenes.distinct, 2);
  assert.deepEqual(scenes.frames.map(f => [f.min_distance, f.nearest]), [[null, null], [256, 0], [10, 0]]);

  const frame = new Uint8Array(40 * 30).fill(100);
  const tpl = Uint8Array.from({ length: 8 * 6 }, (_, i) => (i * 37) % 251);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) frame[(12 + y) * 40 + 20 + x] = tpl[y * 8 + x];
  const m = bestMatch(frame, 40, 30, tpl, 8, 6);
  assert.deepEqual([m.x, m.y], [20, 12]);
  assert.ok(m.score > 0.999);
  assert.equal(bestMatch(frame, 40, 30, new Uint8Array(48).fill(9), 8, 6), null);
});
