import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapWords, snapCues } from '../scripts/onsets.mjs';
import { wavBytes, SAMPLE_RATE } from '../scripts/sfx.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/onsets.mjs', import.meta.url));

async function tempdir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator onsets '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

// Seeded low noise floor (about -60 dBFS) with voiced bursts: 3 ms attack, harmonics, decay.
const ONSETS = [0.8, 2.0, 3.3, 5.7];
function narration(seconds = 7) {
  const n = Math.round(seconds * SAMPLE_RATE), s = new Float64Array(n);
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32) * 2 - 1;
  for (let i = 0; i < n; i++) s[i] = 0.001 * rand();
  for (const t0 of ONSETS) {
    const start = Math.round(t0 * SAMPLE_RATE), len = Math.round(0.5 * SAMPLE_RATE);
    for (let i = 0; i < len && start + i < n; i++) {
      const t = i / SAMPLE_RATE, env = Math.min(1, t / 0.003) * Math.exp(-t * 2);
      s[start + i] += 0.3 * env * (Math.sin(2 * Math.PI * 180 * t) + 0.5 * Math.sin(2 * Math.PI * 360 * t) + 0.25 * Math.sin(2 * Math.PI * 540 * t));
    }
  }
  return Array.from(s);
}

const WORDS = {
  text: 'synthetic',
  duration: 7,
  cues: [
    { text: 'early by 200 ms', start: 0.6, end: 1.3 },
    { text: 'late by 250 ms', start: 2.25, end: 2.5 },
    { text: 'early by 300 ms', start: 3.0, end: 3.8 },
    { text: 'onset 700 ms away', start: 5.0, end: 6.2 }
  ],
  chars: [{ ch: 'x', start: 0.6, end: 0.7 }]
};

test('onsets: synthetic bursts snap within 10 ms in both directions; an onset outside the window is not taken', async t => {
  const directory = await tempdir(t);
  const audio = path.join(directory, 'narration.wav');
  await writeFile(audio, wavBytes(narration()));
  const result = await snapWords(audio, structuredClone(WORDS));
  const [a, b, c, d] = result.cues;
  for (const [cue, truth] of [[a, 0.8], [b, 2.0], [c, 3.3]]) {
    assert.ok(Math.abs(cue.start - truth) <= 0.01, `${cue.text}: ${cue.start} vs ${truth}`);
    assert.equal(cue.snap_ms, Math.round((cue.start - cue.start_raw) * 1000));
  }
  assert.ok(a.snap_ms > 0 && b.snap_ms < 0 && c.snap_ms > 0);
  assert.deepEqual([d.start, d.start_raw, d.snap_ms], [5.0, 5.0, 0]);
  assert.deepEqual(result.onset_analysis.unsnapped, [3]);
  for (const cue of result.cues) assert.equal(cue.end, WORDS.cues[result.cues.indexOf(cue)].end);
  assert.deepEqual(result.chars, WORDS.chars);
  assert.equal(result.text, WORDS.text);
  // A wider window reaches the fourth onset.
  const wide = await snapWords(audio, structuredClone(WORDS), { window: 0.8 });
  assert.ok(Math.abs(wide.cues[3].start - 5.7) <= 0.01);
});

test('onsets: search never reaches back past the previous cue end or forward past the cue end', () => {
  const cues = [{ text: 'a', start: 1.0, end: 1.9 }, { text: 'b', start: 2.0, end: 2.2 }];
  // 1.7 is within 0.45 s of b.start but before a.end - 0.05; 2.3 is within 0.45 s but after b.end.
  const blocked = snapCues(cues, [1.7, 2.3]);
  assert.deepEqual(blocked.unsnapped, [0, 1]);
  assert.deepEqual(blocked.cues.map(c => c.start), [1.0, 2.0]);
  const allowed = snapCues(cues, [1.7, 1.95, 2.3]);
  assert.deepEqual(allowed.unsnapped, [0]);
  assert.deepEqual([allowed.cues[1].start, allowed.cues[1].snap_ms], [1.95, -50]);
});

test('onsets CLI writes words.onsets.json, prints a one-line summary and refuses to overwrite', async t => {
  const directory = await tempdir(t);
  const audio = path.join(directory, 'voice track.wav'), words = path.join(directory, 'words.json'), output = path.join(directory, 'words.onsets.json');
  await writeFile(audio, wavBytes(narration()));
  await writeFile(words, JSON.stringify(WORDS));
  const { stdout } = await exec(process.execPath, [script, '--audio', audio, '--words', words, '--output', output]);
  assert.equal(stdout.trim().split('\n').length, 1);
  const summary = JSON.parse(stdout);
  assert.deepEqual([summary.cues, summary.snapped, summary.unsnapped], [4, 3, 1]);
  const written = JSON.parse(await readFile(output, 'utf8'));
  assert.ok(written.cues.every(c => 'start_raw' in c && 'snap_ms' in c));
  await assert.rejects(exec(process.execPath, [script, '--audio', audio, '--words', words, '--output', output]), /already exists/);
  await writeFile(words, JSON.stringify({ cues: [{ start: 1 }] }));
  await assert.rejects(exec(process.execPath, [script, '--audio', audio, '--words', words, '--output', output, '--overwrite']), /numeric start <= end/);
});
