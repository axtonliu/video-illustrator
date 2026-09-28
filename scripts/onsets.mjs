#!/usr/bin/env node
// Snap cue starts in words.json to measured speech onsets. Plain Node; FFmpeg only decodes audio to PCM.
import { access, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { decode } from './beats.mjs';

const HELP = `Snap each cue's start in words.json to the measured onset of the narration.

node scripts/onsets.mjs --audio narration.wav --words words.json --output words.onsets.json [--window 0.45 --overwrite]

words.json: {text, duration, cues:[{text, start, end}]}. A cue may be a phrase, a word or a
single character. For each cue, the first quiet-to-loud onset within +/- window seconds of
its start (never earlier than 50 ms before the previous cue's end, never after its own end)
replaces start. end is not changed. Each cue gains start_raw and snap_ms (positive = moved
later); a cue with no onset in its window keeps its start and gets snap_ms 0. Other fields
pass through unchanged. Decodes with ffmpeg to mono 16 kHz, so any audio format works.`;

export const SR = 16000;
const WIN = 160, HOP = 32;               // 10 ms RMS window, 2 ms hop
const HOP_T = HOP / SR, WIN_T = WIN / SR;
export const DEFAULTS = {
  window: 0.45,     // search radius around the given start, seconds
  minQuiet: 0.04,   // quiet run required before an onset, seconds
  maxRise: 0.1,     // the onset must reach the loud level within this time, seconds
  quiet: 0.25,      // quiet level: floor + 0.25 of the floor-to-peak dB range
  loud: 0.6,        // loud level: floor + 0.6 of the range
  prevEndSlack: 0.05
};

const round3 = x => Math.round(x * 1000) / 1000;
const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];

// RMS level in dBFS per frame; frame i covers samples [i*HOP, i*HOP + WIN).
export function rmsEnvelope(pcm) {
  const frames = Math.max(0, Math.floor((pcm.length - WIN) / HOP) + 1);
  const db = new Float64Array(frames);
  let acc = 0;
  for (let i = 0; i < WIN && i < pcm.length; i++) acc += pcm[i] * pcm[i];
  for (let f = 0; f < frames; f++) {
    if (f > 0) {
      for (let i = (f - 1) * HOP; i < f * HOP; i++) acc -= pcm[i] * pcm[i];
      for (let i = (f - 1) * HOP + WIN; i < f * HOP + WIN; i++) acc += pcm[i] * pcm[i];
    }
    db[f] = 10 * Math.log10(Math.max(acc, 0) / WIN + 1e-12);
  }
  return db;
}

// Every quiet-to-loud transition in the file. The time is where the level leaves the quiet
// band, measured at the leading edge of the RMS window, so a hard onset is found within one hop.
export function detectOnsets(db, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const sorted = Float64Array.from(db).sort();
  const floor = percentile(sorted, 0.1), peak = percentile(sorted, 0.98);
  const range = peak - floor;
  const levels = { floor_db: round3(floor), peak_db: round3(peak), quiet_db: round3(floor + o.quiet * range), loud_db: round3(floor + o.loud * range) };
  if (!(range >= 10)) return { onsets: [], levels, warning: `Level range is only ${range.toFixed(1)} dB; no onsets detected.` };
  const q = floor + o.quiet * range, l = floor + o.loud * range;
  const minQuiet = Math.round(o.minQuiet / HOP_T), rise = Math.round(o.maxRise / HOP_T);
  const onsets = [];
  let quietRun = 0;
  for (let i = 0; i < db.length; i++) {
    if (db[i] < q) { quietRun++; continue; }
    if (quietRun >= minQuiet) {
      let reached = false;
      for (let j = i; j < Math.min(db.length, i + rise) && !reached; j++) reached = db[j] >= l;
      if (reached) {
        const frac = (q - db[i - 1]) / (db[i] - db[i - 1]);   // linear crossing between frames
        onsets.push((i - 1 + Math.min(1, Math.max(0, frac))) * HOP_T + WIN_T);
      }
    }
    quietRun = 0;
  }
  return { onsets, levels };
}

// Returns the snapped cues and the indices of cues that found no onset in their window.
export function snapCues(cues, onsets, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const unsnapped = [];
  const out = cues.map((cue, k) => {
    const raw = cue.start;
    let lo = raw - o.window;
    const hi = Math.min(raw + o.window, cue.end);
    if (k > 0) lo = Math.max(lo, cues[k - 1].end - o.prevEndSlack);
    const hit = onsets.find(t => t >= lo && t <= hi);
    if (hit === undefined) unsnapped.push(k);
    const start = hit === undefined ? raw : round3(hit);
    return { ...cue, start, start_raw: raw, snap_ms: Math.round((start - raw) * 1000) };
  });
  return { cues: out, unsnapped };
}

export function validateWords(words) {
  if (!words || !Array.isArray(words.cues)) throw Error('words.json must contain a cues array.');
  words.cues.forEach((c, k) => {
    if (!Number.isFinite(c.start) || !Number.isFinite(c.end) || c.end < c.start) throw Error(`Cue ${k} needs numeric start <= end.`);
  });
}

export async function snapWords(audio, words, opts = {}) {
  validateWords(words);
  const o = { ...DEFAULTS, ...opts };
  const pcm = await decode(audio, SR);
  if (pcm.length < WIN * 2) throw Error('Audio is too short to analyze.');
  const { onsets, levels, warning } = detectOnsets(rmsEnvelope(pcm), o);
  const { cues, unsnapped } = snapCues(words.cues, onsets, o);
  return {
    ...words,
    cues,
    onset_analysis: {
      source: audio,
      analyzed_at: new Date().toISOString(),
      window: o.window,
      audio_duration: round3(pcm.length / SR),
      levels,
      onsets_detected: onsets.length,
      unsnapped,
      warnings: warning ? [warning] : [],
      method: 'RMS 10 ms / 2 ms hop @ 16 kHz; first quiet-to-loud onset (quiet >= 40 ms, loud within 100 ms) in the window; end unchanged'
    }
  };
}

function parse(argv) {
  const opts = { window: DEFAULTS.window, overwrite: false };
  const map = { audio: 'audio', words: 'words', output: 'output', window: 'window' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return null;
    if (argv[i] === '--overwrite') { opts.overwrite = true; continue; }
    const key = map[argv[i].replace(/^--/, '')];
    if (!key || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${argv[i]}`);
    opts[key] = argv[++i];
  }
  if (!opts.audio || !opts.words || !opts.output) throw Error('--audio, --words and --output are required. Use --help.');
  opts.window = Number(opts.window);
  if (!(opts.window > 0 && opts.window <= 2)) throw Error('--window must be between 0 and 2 seconds.');
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else {
      const output = path.resolve(opts.output);
      if (!opts.overwrite && await access(output).then(() => true, () => false)) throw Error(`Output already exists: ${output}. Use --overwrite to replace it.`);
      const words = JSON.parse(await readFile(path.resolve(opts.words), 'utf8'));
      const result = await snapWords(path.resolve(opts.audio), words, opts);
      await writeFile(output, JSON.stringify(result, null, 2) + '\n');
      const moved = result.cues.map(c => c.snap_ms).filter(ms => ms !== 0);
      const sorted = [...moved].sort((a, b) => a - b);
      console.log(JSON.stringify({ output, cues: result.cues.length, snapped: moved.length, unsnapped: result.onset_analysis.unsnapped.length, median_snap_ms: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0, max_abs_snap_ms: Math.max(0, ...moved.map(Math.abs)), warnings: result.onset_analysis.warnings }));
      for (const w of result.onset_analysis.warnings) console.error(`warning: ${w}`);
    }
  } catch (error) {
    console.error(`onsets failed: ${error.message}`);
    process.exitCode = 1;
  }
}
