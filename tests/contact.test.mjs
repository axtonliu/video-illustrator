import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleTimes, dhashBits, bitsToHex, hamming, distinctScenes, bestMatch, motionStats, motionWarnings, MOTION_DEFAULTS } from '../scripts/contact.mjs';

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
  // Two scenes against a four-scene list is a warning, not a failure. The two 4 s held pictures
  // and the pan that runs to the last frame add the two motion warnings.
  assert.equal(result.warnings.length, 3);
  assert.match(result.warnings[0], /below 70% of the scene list \(4\)/);
  assert.match(stderr, /warning: distinct_scenes 2/);
  assert.ok(Math.abs(result.motion.longest_still_s - 4) <= 0.25, `longest still ${result.motion.longest_still_s}`);
  assert.equal(result.motion.end_hold_s, 0);
  assert.match(result.warnings[1], /longest_still_s .* is over 3 s/);
  assert.match(result.warnings[2], /end_hold_s 0 is under 1 s/);
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

// 10 s at 10 fps, grey stripes whose phase drives motion:
//   0-2 s moving (bright) | 2-6 s frozen (bright) | 6-9.5 s moving (dark, mean grey about 20) | 9.5-10 s frozen (bright)
// Expected at 4 samples/s: longest still 4.0 s, end hold 0.5 s, dark 14 of 40 samples = 0.35.
async function motionClip(directory) {
  const clip = path.join(directory, 'motion.mp4');
  const phase = "if(lt(T\\,2)\\,T\\,if(lt(T\\,6)\\,2\\,if(lt(T\\,9.5)\\,T-4\\,5.5)))";
  const dark = "(gte(T\\,6)*lt(T\\,9.5))";
  const lum = `if(${dark}\\,20+12*sin(X/12+4*${phase})\\,128+70*sin(X/12+4*${phase}))`;
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', `nullsrc=s=320x180:r=10:d=10,format=yuv420p,geq=lum='${lum}':cb=128:cr=128`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', clip]);
  return clip;
}

test('contact motion: still stretch, end hold and dark share measured on a generated clip; warnings only', async t => {
  const directory = await tempdir(t);
  const clip = await motionClip(directory);
  const out = path.join(directory, 'qa');
  const { stdout, stderr } = await exec(process.execPath, [script, '--input', clip, '--output-dir', out]);
  const { motion, warnings } = JSON.parse(await readFile(path.join(out, 'contact.json'), 'utf8'));
  assert.equal(motion.samples, 40);
  assert.ok(Math.abs(motion.longest_still_s - 4) <= 0.25, `longest still ${motion.longest_still_s}`);
  assert.ok(Math.abs(motion.longest_still_range_s[0] - 2) <= 0.25 && Math.abs(motion.longest_still_range_s[1] - 6) <= 0.25, `range ${motion.longest_still_range_s}`);
  assert.ok(Math.abs(motion.end_hold_s - 0.5) <= 0.25, `end hold ${motion.end_hold_s}`);
  assert.ok(Math.abs(motion.dark_ratio - 0.35) <= 0.03, `dark ratio ${motion.dark_ratio}`);
  assert.equal(motion.still_threshold, MOTION_DEFAULTS.stillThreshold);
  assert.deepEqual(JSON.parse(stdout).motion, { longest_still_s: motion.longest_still_s, end_hold_s: motion.end_hold_s, dark_ratio: motion.dark_ratio });
  // Defaults: still > 3 s and end hold < 1 s warn; 0.35 dark does not. Exit code stays 0.
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /longest_still_s .* is over 3 s/);
  assert.match(warnings[1], /end_hold_s .* is under 1 s/);
  assert.match(stderr, /warning: end_hold_s/);
  // Thresholds are parameters: a stricter dark limit adds the dark warning; looser limits clear the others.
  const strict = JSON.parse((await exec(process.execPath, [script, '--input', clip, '--output-dir', path.join(directory, 'qa2'), '--dark-max', '0.3', '--still-max', '5', '--end-hold-min', '0.25'])).stdout);
  assert.equal(strict.warnings.length, 1);
  assert.match(strict.warnings[0], /dark_ratio 0\.3\d* is over 0\.3/);
  const help = (await exec(process.execPath, [script, '--help'])).stdout;
  for (const flag of ['--still-threshold 1.0', '--dark-threshold 40', '--still-max 3', '--end-hold-min 1.0', '--dark-max 0.5']) assert.ok(help.includes(flag), flag);
});

test('contact motion helpers: run lengths, a fade to black counts as holding, a clip that never moves', () => {
  const frame = (v, len = 16) => new Uint8Array(len).fill(v);
  const ramp = k => Uint8Array.from({ length: 16 }, (_, i) => (i * 13 + k * 40) % 200 + 30);
  // moving, moving, still x5 (1.25 s), moving, held x4 (1.0 s at the end)
  const frames = [ramp(0), ramp(1), ramp(2), ramp(2), ramp(2), ramp(2), ramp(2), ramp(3), ramp(4), ramp(4), ramp(4), ramp(4)];
  const m = motionStats(frames);
  assert.equal(m.longest_still_s, 1.25);
  assert.deepEqual(m.longest_still_range_s, [0.5, 1.75]);
  assert.equal(m.end_hold_s, 1);
  assert.equal(m.end_hold_from_s, 2);
  // Held picture, then a fade to black over the last three samples: the fade does not end the hold.
  const held = ramp(5), faded = [0.6, 0.3, 0.02].map(g => held.map(v => Math.round(v * g)));
  const fade = motionStats([ramp(0), ramp(1), held, held, held, held, ...faded]);
  assert.equal(fade.end_hold_s, 1.75);
  assert.equal(fade.longest_still_s, 0);
  assert.equal(motionStats([frame(90), frame(90), frame(90), frame(90)]).longest_still_s, 1);   // never moves
  assert.equal(motionStats([frame(10), frame(10), frame(200)]).dark_ratio, 0.667);
  assert.deepEqual(motionWarnings({ longest_still_s: 3.25, longest_still_range_s: [1, 4.25], end_hold_s: 1, dark_ratio: 0.5, dark_threshold: 40 }).length, 1);
  assert.deepEqual(motionWarnings({ longest_still_s: 3, longest_still_range_s: [1, 4], end_hold_s: 0.75, dark_ratio: 0.51, dark_threshold: 40 }).map(w => w.split(' ')[0]), ['end_hold_s', 'dark_ratio']);
});
