import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTime, parseSrt, windowCues } from '../scripts/excerpt.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/excerpt.mjs', import.meta.url));

async function tempdir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator excerpt '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

const SRT = `1
00:00:01,000 --> 00:00:03,500
before the window, crossing in

2
00:00:04,000 --> 00:00:05,250
fully inside

3
00:00:05,500 --> 00:00:07,000
second line
on two lines

4
00:00:07,500 --> 00:00:09,000
crossing out

5
00:00:09,500 --> 00:00:10,000
after the window
`;

test('excerpt: times parse in seconds, SRT and clock form', () => {
  assert.equal(parseTime('43.13'), 43.13);
  assert.equal(parseTime('00:00:43,130'), 43.13);
  assert.equal(parseTime('0:43.13'), 43.13);
  assert.equal(parseTime('1:00:00'), 3600);
  assert.throws(() => parseTime('soon'), /Bad time/);
});

test('excerpt: cues crossing an edge are kept, cut and marked; outside cues are dropped', () => {
  const cues = parseSrt('﻿' + SRT.replace(/\n/g, '\r\n'));
  assert.equal(cues.length, 5);
  assert.equal(cues[2].text, 'second line\non two lines');
  const out = windowCues(cues, 3, 8);
  assert.deepEqual(out.map(c => c.text), ['before the window, crossing in', 'fully inside', 'second line\non two lines', 'crossing out']);
  assert.deepEqual(out.map(c => [c.start, c.end]), [[0, 0.5], [1, 2.25], [2.5, 4], [4.5, 5]]);
  assert.deepEqual(out.map(c => c.clipped), ['start', undefined, undefined, 'end']);
  assert.equal(out[3].source_end, 9);
  assert.equal(windowCues(cues, 4.5, 4.8)[0].clipped, 'both');
  assert.throws(() => windowCues(cues, 5, 5), /later/);
});

test('excerpt CLI cuts the audio to the window, writes words.json for onsets.mjs and protects existing files', async t => {
  const directory = await tempdir(t);
  const srt = path.join(directory, 'final.srt');
  const media = path.join(directory, 'master.mp4');
  const out = path.join(directory, 'excerpt');
  await writeFile(srt, SRT);
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=gray:size=64x36:rate=10:duration=12', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=12',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', media]);
  const run = args => exec(process.execPath, [script, '--srt', srt, '--from', '3', '--to', '00:00:08,000', '--out', out, '--media', media, ...args]);
  const { stdout, stderr } = await run([]);
  const report = JSON.parse(stdout);
  assert.equal(report.duration, 5);
  assert.equal(report.cues, 4);
  assert.deepEqual(report.clipped.map(c => c.clipped), ['start', 'end']);
  assert.match(report.source.media_sha256, /^[0-9a-f]{64}$/);
  assert.match(stderr, /crosses the window at its start/);
  const words = JSON.parse(await readFile(path.join(out, 'words.json'), 'utf8'));
  assert.equal(words.duration, 5);
  assert.equal(words.cues.length, 4);
  assert.ok(words.cues.every(c => c.start >= 0 && c.end <= 5));
  const probe = (await exec('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration', '-of', 'json', path.join(out, 'narration.wav')])).stdout;
  const info = JSON.parse(probe);
  assert.equal(info.streams[0].codec_name, 'pcm_s16le');
  assert.equal(info.streams[0].sample_rate, '48000');
  assert.equal(info.streams[0].channels, 2);
  assert.ok(Math.abs(Number(info.format.duration) - 5) < 0.03, info.format.duration);
  await assert.rejects(run([]), /exists; pass --overwrite/);
  await run(['--overwrite']);
  await assert.rejects(exec(process.execPath, [script, '--srt', srt, '--from', '20', '--to', '30', '--out', path.join(directory, 'empty')]), /No cue overlaps/);
});
