import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardAssets, cardBox, clipRate, footageWindows, karaokeAss, overlayArgs, segmentHash, units } from '../scripts/episode.mjs';
import { alignLines, scriptSegments, splitPoints } from '../scripts/align.mjs';
import { findFont } from '../scripts/footage.mjs';
import { frameCount } from '../scripts/render.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/episode.mjs', import.meta.url));

test('units keep Latin words and numbers whole and split Chinese by character', () => {
  assert.deepEqual(units('用了 0.81 秒到 60 mph。'), ['用', '了', '0.81', '秒', '到', '60', 'mph', '。']);
});

test('captions light only the unit being said', () => {
  const ass = karaokeAss({ width: 1280, height: 720, lines: [{ text: '轮胎 grip', start: 1, end: 2, chars: [1, 1.3, 1.6] }], highlight: '#112233', ink: '#445566' });
  const events = ass.split('\n').filter(l => l.startsWith('Dialogue'));
  assert.equal(events.length, 5); // lead-in, three units, tail
  assert.match(events[1], /^Dialogue: 0,0:00:01\.00,0:00:01\.30,.*\{\\c&H00332211\}轮\{\\c&H00665544\}胎 grip$/);
  assert.match(events[3], /轮胎 \{\\c&H00332211\}grip\{\\c&H00665544\}$/);
});

test('align: the script wording wins, the speech gives the timing, and misses are interpolated', () => {
  const segs = scriptSegments('## s1 hook\n一辆车 {f:f-a}\n> picture note\n停在坡顶\n## s2 next\n它没掉\n');
  assert.deepEqual(segs, { s1: ['一辆车', '停在坡顶'], s2: ['它没掉'] });
  // The recognizer heard 一 辆 车 then 停 在 (wrong char) 顶; 坡 was misheard as 破.
  const words = [{ word: '一辆', start: 0.5, end: 0.9 }, { word: '车', start: 0.9, end: 1.1 }, { word: '停在', start: 1.6, end: 2.0 }, { word: '破顶', start: 2.0, end: 2.6 }];
  const [a, b] = alignLines(segs.s1, words, 3);
  assert.equal(a.text, '一辆车');
  assert.deepEqual(a.chars, [0.5, 0.7, 0.9]);
  assert.equal(a.match, 1);
  assert.equal(b.chars[0], 1.6);
  assert.ok(b.chars[2] > b.chars[1] && b.chars[2] < b.chars[3], 'the misheard character is placed between its neighbours');
  assert.equal(b.match, 0.75);
  assert.equal(b.end, 2.6);
});

test('episode renders segments once, reuses unchanged ones, lays narration under them and burns captions', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'video illustrator episode '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'scene'));
  await mkdir(path.join(dir, 'audio'));
  await writeFile(path.join(dir, 'scene', 'scene.html'), `<body style="margin:0"><canvas width="160" height="90"></canvas><script src="timing.js"></script><script>
    const seg = new URLSearchParams(location.search).get('seg');
    window.renderFrame = t => { const c = document.querySelector('canvas').getContext('2d'); c.fillStyle = seg === 'a' ? '#c33' : '#33c'; c.fillRect(0, 0, 160, 90); c.fillStyle = '#fff'; c.fillRect(t * 40 % 160, 30, 20, 20); };
  </script>`);
  const timing = { a: { dur: 1, lines: [{ text: '第一句', start: 0.1, end: 0.8 }] }, b: { dur: 1.2, lines: [{ text: 'second line', start: 0.2, end: 1.0 }] } };
  await writeFile(path.join(dir, 'scene', 'timing.js'), `window.TIMING = ${JSON.stringify(timing)};`);
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1.5', path.join(dir, 'audio', 'b.wav')]);
  const config = { width: 160, height: 90, fps: 10, scene: 'scene/scene.html', inputs: ['scene/timing.js'], timing: 'scene/timing.js',
    segments: [{ id: 'a', query: 'seg=a', audio: 'audio/a.wav' }, { id: 'b', query: 'seg=b', audio: 'audio/b.wav' }], out: 'out', captions: { size: 14 } };
  await writeFile(path.join(dir, 'episode.json'), JSON.stringify(config));
  const run = async () => { const r = await exec(process.execPath, [script, '--config', path.join(dir, 'episode.json')], { maxBuffer: 1 << 24 }); return { out: JSON.parse(r.stdout), log: r.stderr }; };
  const first = await run();
  assert.equal(first.out.duration, 2.5); // a: 1.0 from timing; b: audio 1.5 is longer than its timing
  const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type:format=duration', '-of', 'json', first.out.captioned])).stdout);
  assert.deepEqual(probe.streams.map(s => s.codec_type).sort(), ['audio', 'video']);
  assert.ok(Math.abs(Number(probe.format.duration) - 2.5) < 0.1);
  const record = JSON.parse(await readFile(path.join(dir, 'out', 'episode.json'), 'utf8'));
  assert.deepEqual(record.segments.map(s => [s.id, s.offset, s.reuse]), [['a', 0, false], ['b', 1, false]]);
  assert.match(await readFile(path.join(dir, 'out', 'captions.ass'), 'utf8'), /second line/);
  // Change only the b audio: a is reused, b re-renders because its duration changed.
  await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', path.join(dir, 'audio', 'b.wav')]);
  const second = await run();
  assert.match(second.log, /^a .*reuse/m);
  assert.match(second.log, /^b .*render/m);
  assert.equal(second.out.duration, 3);
});

test('footage covers its lines and holds its last frame until the next line starts', async () => {
  const lines = [{ start: 0.2 }, { start: 0.5 }, { start: 1.5 }];
  assert.deepEqual(footageWindows([{ clip: 'c.mp4', lines: [1] }], lines, 2), [{ clip: 'c.mp4', start: 0.5, end: 1.5 }]);
  assert.deepEqual(footageWindows([{ clip: 'c.mp4', lines: [1, 2] }], lines, 2), [{ clip: 'c.mp4', start: 0.5, end: 2 }]);
  assert.throws(() => footageWindows([{ clip: 'c.mp4', lines: [3] }], lines, 2), /outside/);

  const dir = await mkdtemp(path.join(tmpdir(), 'vi-footage-'));
  try {
    const scene = path.join(dir, 'scene.mp4'), clip = path.join(dir, 'clip.mp4'), out = path.join(dir, 'out.mp4');
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x36:r=30:d=2', '-pix_fmt', 'yuv420p', scene]);
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=64x36:r=30:d=0.5', '-pix_fmt', 'yuv420p', clip]);
    await exec('ffmpeg', overlayArgs({ scene, windows: [{ file: clip, start: 0.5, end: 1.5 }], out }));
    const pixel = async t => {
      const { stdout } = await exec('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', out, '-frames:v', '1', '-vf', 'scale=2:2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer' });
      return stdout[0] > stdout[2] ? 'red' : 'blue';
    };
    assert.equal(await pixel(0.2), 'red');
    assert.equal(await pixel(0.7), 'blue');
    assert.equal(await pixel(1.3), 'blue');   // clip ended at 1.0; its last frame holds
    assert.equal(await pixel(1.8), 'red');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a millisecond-rounded duration keeps its whole frame count', () => {
  assert.equal(frameCount(32.067, 30), 962);   // 962 / 30 = 32.0667; a bare ceil gave 963 and the last frame lost its footage
  assert.equal(frameCount(41.067, 30), 1232);
  assert.equal(frameCount(13.633, 30), 409);
  assert.equal(frameCount(1.01, 30), 31);      // a real part frame still rounds up
  assert.equal(frameCount(0.001, 30), 1);
});

test('two footage windows that meet between frames leave no scene frame between them', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vi-footage-seam-'));
  try {
    const scene = path.join(dir, 'scene.mp4'), a = path.join(dir, 'a.mp4'), b = path.join(dir, 'b.mp4'), out = path.join(dir, 'out.mp4');
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x36:r=30:d=3', '-pix_fmt', 'yuv420p', scene]);
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=64x36:r=30:d=0.8', '-pix_fmt', 'yuv420p', a]);
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=green:s=64x36:r=30:d=2', '-pix_fmt', 'yuv420p', b]);
    // 1.417 s and 1.383 s both fall between frames; before the fix each left one red frame at the seam.
    for (const seam of [1.417, 1.383]) {
      await exec('ffmpeg', overlayArgs({ scene, windows: [{ file: a, start: 0.52, end: seam }, { file: b, start: seam, end: 2.5 }], out, width: 64, height: 36, duration: 3 }));
      const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', out, '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1 << 20 });
      const colors = [];
      for (let i = 0; i < stdout.length; i += 3) colors.push(stdout[i] > 150 ? 'R' : stdout[i + 2] > 150 ? 'B' : 'G');
      const run = colors.join('');
      assert.match(run, /^R+B+G+R+$/, `seam ${seam}: ${run}`);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a clip cut at another frame rate keeps its speed in the episode', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vi-footage-rate-'));
  try {
    const scene = path.join(dir, 'scene.mp4'), clip = path.join(dir, 'clip.mp4'), out = path.join(dir, 'out.mp4');
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x36:r=24:d=2', '-pix_fmt', 'yuv420p', scene]);
    // 30 fps clip: blue for 0.5 s, then green for 0.5 s.
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=64x36:r=30:d=0.5', '-f', 'lavfi', '-i', 'color=c=green:s=64x36:r=30:d=0.5',
      '-filter_complex', '[0:v][1:v]concat=n=2:v=1[v]', '-map', '[v]', '-pix_fmt', 'yuv420p', clip]);
    assert.equal(await clipRate(clip), '30');
    await exec('ffmpeg', overlayArgs({ scene, windows: [{ file: clip, start: 0, end: 1.5 }], out, width: 64, height: 36, duration: 2, fps: 24 }));
    const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', out, '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1 << 20 });
    const colors = [];
    for (let i = 0; i < stdout.length; i += 3) colors.push(stdout[i] > 150 ? 'R' : stdout[i + 2] > 150 ? 'B' : 'G');
    // Real speed at 24 fps: 12 blue frames (0.5 s). Counting the clip's own frames as 1/24 s gave 15 (0.8x speed).
    assert.equal(colors.filter(c => c === 'B').length, 12, colors.join(''));
    assert.match(colors.join(''), /^B{12}G{24}R{12}$/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('only a clip at another frame rate changes the segment hash', () => {
  const base = { sceneBytes: Buffer.from('s'), inputBytes: [], query: '', width: 64, height: 36, fps: 30, duration: 2 };
  const win = { sha: 'abc', start: 0, end: 1 };
  const plain = segmentHash({ ...base, footage: [win] });
  assert.equal(segmentHash({ ...base, footage: [{ ...win, rate: '30' }] }), plain);
  assert.notEqual(segmentHash({ ...base, footage: [{ ...win, rate: '60' }] }), plain);
  assert.notEqual(segmentHash({ ...base, footage: [{ ...win, rate: '30000/1001' }] }), plain);
});

test('lines said over footage switch to light captions', () => {
  const ass = karaokeAss({ width: 1280, height: 720, lines: [{ text: '倒挂', start: 0, end: 1, footage: true }, { text: '起飞', start: 1, end: 2 }] });
  assert.match(ass, /Dialogue: 0,[^,]+,[^,]+,CapFootage,,0,0,0,,\{\\c&H00FDC593\}倒/);
  assert.match(ass, /Dialogue: 0,[^,]+,[^,]+,Cap,,0,0,0,,\{\\c&H002A96E0\}起/);
});

test('footage with a rect is a rounded card beside the scene', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vi-card-'));
  try {
    const scene = path.join(dir, 'scene.mp4'), clip = path.join(dir, 'clip.mp4'), out = path.join(dir, 'out.mp4');
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=320x180:r=30:d=1', '-pix_fmt', 'yuv420p', scene]);
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=640x360:r=30:d=1', '-pix_fmt', 'yuv420p', clip]);
    const rect = [0.1, 0.2, 0.5, 0.5], box = cardBox(rect, 320, 180);
    const assets = await cardAssets(dir, box);
    await exec('ffmpeg', overlayArgs({ scene, windows: [{ file: clip, start: 0, end: 1, rect, ...assets }], out, width: 320, height: 180, duration: 1 }));
    const { stdout } = await exec('ffmpeg', ['-v', 'error', '-ss', '0.5', '-i', out, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1 << 24 });
    const px = (x, y) => { const i = (y * 320 + x) * 3; return stdout[i + 2] > stdout[i] ? 'blue' : 'red'; };
    assert.equal(px(box.x + box.w / 2, box.y + box.h / 2), 'blue');
    assert.equal(px(box.x + box.w + 20, box.y + box.h / 2), 'red');
    assert.equal(px(box.x, box.y), 'red');   // the rounded corner leaves the scene showing
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a tag on full-frame footage marks the step in the lower left', async () => {
  assert.deepEqual(footageWindows([{ clip: 'c.mp4', lines: [0], tag: '① 倒挂坡道' }], [{ start: 0 }], 1), [{ clip: 'c.mp4', start: 0, end: 1, tag: '① 倒挂坡道' }]);
  const font = await findFont();
  if (!font) return;   // no CJK font on this machine; the window test above still covers the plumbing
  const dir = await mkdtemp(path.join(tmpdir(), 'vi-tag-'));
  try {
    const scene = path.join(dir, 'scene.mp4'), clip = path.join(dir, 'clip.mp4'), out = path.join(dir, 'out.mp4');
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=640x360:r=30:d=1', '-pix_fmt', 'yuv420p', scene]);
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=640x360:r=30:d=1', '-pix_fmt', 'yuv420p', clip]);
    await exec('ffmpeg', overlayArgs({ scene, windows: [{ file: clip, start: 0, end: 1, tag: '倒挂' }], out, width: 640, height: 360, font, duration: 1 }));
    const { stdout } = await exec('ffmpeg', ['-v', 'error', '-ss', '0.5', '-i', out, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1 << 24 });
    const px = (x, y) => { const i = (y * 640 + x) * 3; return [stdout[i], stdout[i + 1], stdout[i + 2]]; };
    const [r, g, b] = px(Math.round(640 * 0.045) + 1, Math.round(360 * 0.6) + 8);
    // The tag's own dark box starts there, and no accent stripe stands beside it (aesthetic-rules.md AR-17).
    assert.ok(r < 60 && b < 200, `the tag box expected, not an accent stripe, got ${[r, g, b]}`);
    assert.ok(px(600, 60)[2] > 150);   // the rest of the frame is still the footage
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('one take is cut halfway through the pause between segments', () => {
  const l = (start, end) => ({ start, end, match: 1 });
  const cuts = splitPoints([2, 1], [l(0.2, 1), l(1.2, 3), l(4, 5)], 5.6);
  assert.deepEqual(cuts.map(c => [c.from, c.to]), [[0, 3.5], [3.5, 5.6]]);
});
