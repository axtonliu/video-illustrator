#!/usr/bin/env node
// Procedural sound effects: no samples, no network, deterministic for a given seed.
// Every file's loudest sample is recorded in sfx.json so a mix can put that peak on the beat.
import { mkdir, writeFile, readFile, access, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { decode } from './beats.mjs';

const HELP = `Synthesize basic sound effects as 48 kHz mono 16-bit WAV, measure their peaks,
and compute where to place them in a mix.

node scripts/sfx.mjs --out /path/to/sfx            # all types
node scripts/sfx.mjs --type whoosh --out /path/to/sfx --duration 0.8 --seed 7
node scripts/sfx.mjs --measure inputs/sfx/hit.wav [--measure ...] --out /path/to/sfx
node scripts/sfx.mjs --place whoosh.wav --at 1.741 --json /path/to/sfx/sfx.json [--semitones 2 --gain-db -2]

Types: whoosh, impact, tick, paper, riser, sparkle.
Options: --type all|<type>[,<type>] --duration <s> --seed <int> --overwrite
Files are named <type>.wav. Existing files are kept unless --overwrite is given.

sfx.json (written or merged in the --out folder) records, per file, the time of its loudest
sample: {"files": {"whoosh.wav": {"type": "whoosh", "duration_s": 0.7, "peak_s": 0.291, "seed": 1}}}.
--measure adds the user's own recordings (any FFmpeg-readable audio) with "type": "user" and
"path" relative to the sfx.json folder; the files themselves are not copied or changed.
--place prints the filter for one effect whose peak must land at --at seconds of film time:
adelay_ms = round((at - peak_s) * 1000); when that is negative the head of the effect is
trimmed instead (atrim=start=peak_s - at, asetpts=PTS-STARTPTS). --semitones pitches with
asetrate and moves the peak accordingly; --gain-db appends a volume step.`;

export const SAMPLE_RATE = 48000;
export const DEFAULT_DURATION = { whoosh: 0.7, impact: 1.2, tick: 0.06, paper: 0.45, riser: 1.6, sparkle: 0.9 };
const round3 = x => Math.round(x * 1000) / 1000;

function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1; };
}

// State-variable band-pass filter, cutoff may change per sample.
function bandpass() {
  let low = 0, band = 0;
  return (x, cutoff, q = 0.7) => {
    const f = 2 * Math.sin(Math.PI * Math.min(cutoff, SAMPLE_RATE / 6) / SAMPLE_RATE);
    low += f * band; const high = x - low - q * band; band += f * high;
    return band;
  };
}

const synth = {
  whoosh(n, random) {
    const out = new Float32Array(n), filter = bandpass();
    for (let i = 0; i < n; i++) {
      const p = i / n;
      const env = Math.sin(Math.PI * Math.pow(p, 0.8)) ** 2;          // swell and release
      const cutoff = 300 + 3200 * Math.sin(Math.PI * p);             // sweep up then down
      out[i] = filter(random(), cutoff, 0.5) * env * 1.6;
    }
    return out;
  },
  impact(n, random) {
    const out = new Float32Array(n), filter = bandpass();
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const freq = 42 + 90 * Math.exp(-t * 18);                     // pitch drop gives weight
      phase += 2 * Math.PI * freq / SAMPLE_RATE;
      const body = Math.sin(phase) * Math.exp(-t * 4.5);
      const crack = filter(random(), 1800, 0.9) * Math.exp(-t * 60) * 1.4;
      out[i] = Math.tanh((body + crack) * 1.4) * 0.9;
    }
    return out;
  },
  tick(n, random) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      out[i] = (Math.sin(2 * Math.PI * 2400 * t) * 0.8 + random() * 0.2) * Math.exp(-t * 180) * 0.9;
    }
    return out;
  },
  paper(n, random) {
    const out = new Float32Array(n), filter = bandpass();
    // A few irregular crinkle grains inside one short gesture.
    const grains = Array.from({ length: 9 }, (_, k) => ({ at: (k / 9 + random() * 0.04) * n * 0.85, len: (0.02 + Math.abs(random()) * 0.05) * SAMPLE_RATE, gain: 0.4 + Math.abs(random()) * 0.6 }));
    for (let i = 0; i < n; i++) {
      let env = 0;
      for (const g of grains) if (i >= g.at && i < g.at + g.len) env = Math.max(env, g.gain * Math.exp(-(i - g.at) / g.len * 3));
      const bed = 0.12 * Math.sin(Math.PI * i / n);
      out[i] = filter(random(), 3500 + 1500 * Math.sin(i / 900), 0.6) * (env + bed) * 1.8;
    }
    return out;
  },
  riser(n, random) {
    // Noise and a tone both sweep upward and swell into a peak about 5% before the end.
    const out = new Float32Array(n), filter = bandpass();
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      const env = p < 0.95 ? (p / 0.95) ** 2.5 : 1 - (p - 0.95) / 0.05 * 0.85;
      const freq = 180 * Math.pow(10, p);                          // 180 Hz -> 1.8 kHz
      phase += 2 * Math.PI * freq / SAMPLE_RATE;
      const air = filter(random(), 400 + 5600 * p * p, 0.6);
      out[i] = (Math.sin(phase) * 0.45 + air * 1.3) * env;
    }
    return out;
  },
  sparkle(n, random) {
    // A short cascade of high pings; the first one is the loudest.
    const out = new Float32Array(n);
    const pings = Array.from({ length: 7 }, (_, k) => ({ at: Math.round((k * 0.085 + Math.abs(random()) * 0.02) * SAMPLE_RATE), freq: 2600 + Math.abs(random()) * 3400, gain: 1 - k * 0.11 }));
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (const g of pings) if (i >= g.at) { const t = (i - g.at) / SAMPLE_RATE; v += Math.sin(2 * Math.PI * g.freq * t) * Math.exp(-t * 22) * g.gain; }
      out[i] = v * 0.6;
    }
    return out;
  }
};
export const TYPES = Object.keys(synth);

export function synthesize(type, { duration = DEFAULT_DURATION[type], seed = 1 } = {}) {
  if (!synth[type]) throw Error(`Unknown sound type: ${type}. Use one of ${TYPES.join(', ')}.`);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 10) throw Error('--duration must be between 0 and 10 seconds.');
  const n = Math.round(duration * SAMPLE_RATE);
  const samples = synth[type](n, rng(seed * 7919 + TYPES.indexOf(type)));
  const fade = Math.min(n, Math.round(0.004 * SAMPLE_RATE));       // avoid clicks at the edges
  for (let i = 0; i < fade; i++) { samples[i] *= i / fade; samples[n - 1 - i] *= i / fade; }
  let peak = 0; for (const v of samples) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) for (let i = 0; i < n; i++) samples[i] *= 0.89 / peak; // about -1 dBFS
  return samples;
}

// 16-bit PCM exactly as written to the WAV file.
export function quantize(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  return pcm;
}

// Time of the first sample with the largest absolute value. No smoothing, no conversion.
export function peakSeconds(samples, sampleRate = SAMPLE_RATE) {
  let best = -1, index = 0;
  for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (v > best) { best = v; index = i; } }
  return index / sampleRate;
}

export function wavBytes(samples) {
  const pcm = quantize(samples);
  const data = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24); header.writeUInt32LE(SAMPLE_RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Where an effect goes so that its peak sounds at target_s (film time).
// Positive lead: delay the file. Negative lead: never a negative delay; trim the head instead.
export function placeSfx({ target_s, peak_s, semitones = 0, gain_db = 0, sampleRate = SAMPLE_RATE }) {
  if (!Number.isFinite(target_s) || target_s < 0) throw Error('target time must be a nonnegative number of seconds.');
  if (!Number.isFinite(peak_s) || peak_s < 0) throw Error('peak_s must be a nonnegative number of seconds.');
  if (!Number.isFinite(semitones) || Math.abs(semitones) > 12) throw Error('--semitones must be between -12 and 12.');
  if (!Number.isFinite(gain_db) || Math.abs(gain_db) > 24) throw Error('--gain-db must be between -24 and 24.');
  const chain = [];
  let peak = peak_s;
  if (semitones) {
    const rate = Math.round(sampleRate * 2 ** (semitones / 12));
    chain.push(`asetrate=${rate}`, `aresample=${sampleRate}`);
    peak = peak_s * sampleRate / rate;                          // faster playback reaches the peak sooner
  }
  const lead = target_s - peak;
  let adelay_ms = 0, atrim_s = 0;
  if (lead >= 0) {
    adelay_ms = Math.round(lead * 1000);
    if (adelay_ms > 0) chain.push(`adelay=${adelay_ms}:all=1`);
  } else {
    atrim_s = round3(-lead);
    chain.push(`atrim=start=${atrim_s}`, 'asetpts=PTS-STARTPTS');
    if (target_s >= 0.008) chain.push('afade=t=in:d=0.004');     // soften the cut edge without touching the peak
  }
  if (gain_db) chain.push(`volume=${gain_db}dB`);
  return { target_s, peak_s: Math.round(peak * 10000) / 10000, adelay_ms, atrim_s, filter: chain.length ? chain.join(',') : 'anull' };
}

async function readManifest(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { files: {} }; throw Error(`Could not read ${file}: ${error.message}`); }
}

async function writeManifest(out, entries) {
  const file = path.join(out, 'sfx.json');
  const manifest = await readManifest(file);
  manifest.files = { ...(manifest.files || {}), ...entries };
  manifest.note = 'peak_s = time of the loudest sample in the file. Place an effect with adelay_ms = round((target_s - peak_s) * 1000); if negative, atrim=start=peak_s - target_s instead.';
  await writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  return file;
}

function parse(argv) {
  const opts = { type: 'all', seed: 1, overwrite: false, measure: [] };
  const valued = ['type', 'out', 'duration', 'seed', 'place', 'at', 'json', 'semitones', 'gain-db'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    const key = a.replace(/^--/, '');
    if (key === 'measure' && argv[i + 1] !== undefined) { opts.measure.push(argv[++i]); continue; }
    if (!valued.includes(key) || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${a}`);
    opts[key] = argv[++i];
  }
  if (opts.place !== undefined) {
    if (opts.at === undefined || opts.json === undefined) throw Error('--place needs --at <seconds> and --json <sfx.json>.');
    opts.mode = 'place';
    opts.at = Number(opts.at);
    opts.semitones = Number(opts.semitones ?? 0);
    opts.gainDb = Number(opts['gain-db'] ?? 0);
    return opts;
  }
  if (!opts.out) throw Error('--out <directory> is required. Use --help.');
  if (opts.measure.length) { opts.mode = 'measure'; return opts; }
  opts.mode = 'synth';
  opts.types = opts.type === 'all' ? TYPES : opts.type.split(',');
  opts.seed = Number(opts.seed);
  if (opts.duration !== undefined) opts.duration = Number(opts.duration);
  return opts;
}

export async function run(opts) {
  const out = path.resolve(opts.out);
  await mkdir(out, { recursive: true });
  const written = [], entries = {};
  for (const type of opts.types) {
    const file = path.join(out, `${type}.wav`);
    if (!opts.overwrite && await access(file).then(() => true, () => false)) throw Error(`Output already exists: ${file}. Use --overwrite to replace it.`);
    const samples = synthesize(type, { duration: opts.duration ?? DEFAULT_DURATION[type], seed: opts.seed });
    await writeFile(file, wavBytes(samples));
    const peak_s = round3(peakSeconds(quantize(samples)));
    entries[`${type}.wav`] = { type, duration_s: samples.length / SAMPLE_RATE, peak_s, seed: opts.seed };
    written.push({ type, file, duration: samples.length / SAMPLE_RATE, sample_rate: SAMPLE_RATE, seed: opts.seed, peak_s });
  }
  const manifest = await writeManifest(out, entries);
  return { written, manifest };
}

// The user's own recordings: decode to mono 48 kHz, record the loudest sample. The file is not changed.
export async function measure(opts) {
  const out = path.resolve(opts.out);
  await mkdir(out, { recursive: true });
  const entries = {}, measured = [];
  for (const source of opts.measure) {
    const file = path.resolve(source);
    const pcm = await decode(file, SAMPLE_RATE);
    if (!pcm.length) throw Error(`No audio samples in ${file}.`);
    const name = path.basename(file);
    if (entries[name]) throw Error(`Two measured files share the name ${name}; rename one.`);
    const entry = { type: 'user', duration_s: round3(pcm.length / SAMPLE_RATE), peak_s: round3(peakSeconds(pcm)), seed: null, path: path.relative(out, file) || name };
    entries[name] = entry;
    measured.push({ name, ...entry });
  }
  const manifest = await writeManifest(out, entries);
  return { measured, manifest };
}

export async function place(opts) {
  const manifest = await readManifest(path.resolve(opts.json));
  const entry = manifest.files?.[opts.place];
  if (!entry || !Number.isFinite(entry.peak_s)) throw Error(`${opts.place} has no peak_s in ${opts.json}. Generate it with sfx.mjs or add it with --measure.`);
  return { name: opts.place, ...placeSfx({ target_s: opts.at, peak_s: entry.peak_s, semitones: opts.semitones, gain_db: opts.gainDb }) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else console.log(JSON.stringify(await (opts.mode === 'place' ? place(opts) : opts.mode === 'measure' ? measure(opts) : run(opts)), null, 2));
  } catch (error) {
    console.error(`sfx failed: ${error.message}`);
    process.exitCode = 1;
  }
}
