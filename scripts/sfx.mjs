#!/usr/bin/env node
// Procedural sound effects: no samples, no network, deterministic for a given seed.
import { mkdir, writeFile, access, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Synthesize basic sound effects as 48 kHz mono 16-bit WAV.

node scripts/sfx.mjs --out /path/to/sfx            # all types
node scripts/sfx.mjs --type whoosh --out /path/to/sfx --duration 0.8 --seed 7

Types: whoosh, impact, tick, paper. Options: --type all|<type>[,<type>] --duration <s> --seed <int> --overwrite
Files are named <type>.wav. Existing files are kept unless --overwrite is given.`;

export const SAMPLE_RATE = 48000;
export const DEFAULT_DURATION = { whoosh: 0.7, impact: 1.2, tick: 0.06, paper: 0.45 };

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

export function wavBytes(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24); header.writeUInt32LE(SAMPLE_RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function parse(argv) {
  const opts = { type: 'all', seed: 1, overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    const key = a.replace(/^--/, '');
    if (!['type', 'out', 'duration', 'seed'].includes(key) || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${a}`);
    opts[key] = argv[++i];
  }
  if (!opts.out) throw Error('--out <directory> is required. Use --help.');
  opts.types = opts.type === 'all' ? TYPES : opts.type.split(',');
  opts.seed = Number(opts.seed);
  if (opts.duration !== undefined) opts.duration = Number(opts.duration);
  return opts;
}

export async function run(opts) {
  const out = path.resolve(opts.out);
  await mkdir(out, { recursive: true });
  const written = [];
  for (const type of opts.types) {
    const file = path.join(out, `${type}.wav`);
    if (!opts.overwrite && await access(file).then(() => true, () => false)) throw Error(`Output already exists: ${file}. Use --overwrite to replace it.`);
    const samples = synthesize(type, { duration: opts.duration ?? DEFAULT_DURATION[type], seed: opts.seed });
    await writeFile(file, wavBytes(samples));
    written.push({ type, file, duration: samples.length / SAMPLE_RATE, sample_rate: SAMPLE_RATE, seed: opts.seed });
  }
  return { written };
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else console.log(JSON.stringify(await run(opts), null, 2));
  } catch (error) {
    console.error(`sfx failed: ${error.message}`);
    process.exitCode = 1;
  }
}
