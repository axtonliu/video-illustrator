#!/usr/bin/env node
// Tempo, beat and strong-onset analysis in plain Node. FFmpeg only decodes audio to PCM.
import { spawn } from 'node:child_process';
import { access, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Estimate BPM, beat grid, downbeats and strong onsets from an audio file.

node scripts/beats.mjs --input music.mp3 --output beats.json [--min-bpm 60 --max-bpm 200 --meter 4 --overwrite]

Decodes with ffmpeg to mono 22.05 kHz PCM, builds a spectral-flux onset envelope,
estimates tempo by autocorrelation, tracks beats with dynamic programming, and picks
the downbeat phase with the strongest low-frequency onsets (meter is assumed, not detected).
Times are seconds from the start of the file.`;

const SR = 22050, N = 1024, HOP = 256;
const HOP_T = HOP / SR;

// Decodes any FFmpeg-readable audio to mono float PCM. Shared with onsets.mjs.
export function decode(input, sampleRate = SR) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', input, '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = []; let stderr = '';
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', d => { stderr = (stderr + d).slice(-4000); });
    child.on('error', e => reject(Error(e.code === 'ENOENT' ? 'ffmpeg is not installed or not on PATH.' : e.message)));
    child.on('close', code => {
      if (code !== 0) return reject(Error(`ffmpeg could not decode the audio: ${stderr}`));
      const buf = Buffer.concat(chunks);
      resolve(new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)));
    });
  });
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

// Returns the full-band and low-band (<200 Hz) half-wave rectified log spectral flux.
export function onsetEnvelope(pcm) {
  const frames = Math.max(0, Math.floor((pcm.length - N) / HOP) + 1);
  const window = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  const lowBins = Math.round(200 / (SR / N));
  const full = new Float64Array(frames), low = new Float64Array(frames);
  let prev = new Float64Array(N / 2);
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = pcm[f * HOP + i] * window[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float64Array(N / 2);
    let sum = 0, lowSum = 0;
    for (let k = 1; k < N / 2; k++) {
      mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
      const d = mag[k] - prev[k];
      if (d > 0) { sum += d; if (k <= lowBins) lowSum += d; }
    }
    if (f > 0) { full[f] = sum; low[f] = lowSum; }
    prev = mag;
  }
  return { full: detrend(full), low: detrend(low) };
}

function detrend(env) {
  const half = Math.round(0.25 / HOP_T), out = new Float64Array(env.length);
  let acc = 0, count = 0, max = 0;
  for (let i = -half; i < env.length; i++) {
    const add = i + half, drop = i - half - 1;
    if (add < env.length) { acc += env[add]; count++; }
    if (drop >= 0) { acc -= env[drop]; count--; }
    if (i >= 0) { out[i] = Math.max(0, env[i] - acc / count); max = Math.max(max, out[i]); }
  }
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

function autocorrelation(env, maxLag) {
  const ac = new Float64Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let i = lag; i < env.length; i++) s += env[i] * env[i - lag];
    ac[lag] = s / (env.length - lag);
  }
  return ac;
}

const interp = (arr, x) => { const i = Math.floor(x), f = x - i; return i + 1 < arr.length ? arr[i] * (1 - f) + arr[i + 1] * f : 0; };

export function estimateTempo(env, minBpm = 60, maxBpm = 200) {
  const maxLag = Math.ceil(4 * 60 / (minBpm * HOP_T));
  const ac = autocorrelation(env, maxLag);
  let best = { bpm: 0, score: -Infinity };
  for (let bpm = minBpm; bpm <= maxBpm + 1e-9; bpm += 0.05) {
    const lag = 60 / (bpm * HOP_T);
    let s = 0;
    for (let m = 1; m <= 4; m++) s += interp(ac, lag * m);
    // Mild preference for moderate tempi resolves half/double ambiguity.
    s *= Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.2) ** 2);
    if (s > best.score) best = { bpm, score: s };
  }
  return best.bpm;
}

export function trackBeats(env, bpm, tightness = 100) {
  const period = 60 / (bpm * HOP_T);
  const n = env.length, score = new Float64Array(n), back = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    let best = 0, arg = -1;
    for (let j = Math.max(0, Math.round(i - 2 * period)); j <= i - Math.round(period / 2); j++) {
      const v = score[j] - tightness * Math.log((i - j) / period) ** 2;
      if (arg < 0 || v > best) { best = v; arg = j; }
    }
    score[i] = env[i] + (arg >= 0 ? Math.max(0, best) : 0);
    back[i] = arg >= 0 && best > 0 ? arg : -1;
  }
  let i = n - 1;
  for (let k = Math.max(0, n - Math.round(period)); k < n; k++) if (score[k] > score[i]) i = k;
  const frames = [];
  for (; i >= 0; i = back[i]) frames.unshift(i);
  return frames;
}

// Frame index to seconds. With a Hann window the flux rises fastest when an onset sits
// three quarters into the frame; synthetic click tracks confirm this within a few ms.
const frameTime = f => (f * HOP + 3 * N / 4) / SR;
const round3 = x => Math.round(x * 1000) / 1000;

export async function analyze(input, { minBpm = 60, maxBpm = 200, meter = 4 } = {}) {
  const pcm = await decode(input);
  if (pcm.length < SR) throw Error('Audio is shorter than one second; nothing to analyze.');
  const { full, low } = onsetEnvelope(pcm);
  const coarse = estimateTempo(full, minBpm, maxBpm);
  const beatFrames = trackBeats(full, coarse);
  const beats = beatFrames.map(frameTime);
  // Refine tempo with a least-squares line through the tracked beats (steady-tempo assumption).
  let bpm = coarse;
  if (beats.length >= 8) {
    const n = beats.length, mx = (n - 1) / 2, my = beats.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    beats.forEach((t, k) => { sxy += (k - mx) * (t - my); sxx += (k - mx) ** 2; });
    const fitted = 60 / (sxy / sxx);
    if (Math.abs(fitted - coarse) / coarse < 0.04) bpm = fitted;
  }
  let phase = 0, phaseScores = [];
  for (let p = 0; p < meter; p++) {
    let s = 0, c = 0;
    for (let k = p; k < beatFrames.length; k += meter) { s += low[beatFrames[k]] * 2 + full[beatFrames[k]]; c++; }
    phaseScores.push(c ? s / c : 0);
  }
  phase = phaseScores.indexOf(Math.max(...phaseScores));
  const mean = full.reduce((a, b) => a + b, 0) / full.length;
  const std = Math.sqrt(full.reduce((a, b) => a + (b - mean) ** 2, 0) / full.length);
  const radius = Math.round(0.05 / HOP_T), minGap = 0.1;
  const strong = [];
  for (let i = radius; i < full.length - radius; i++) {
    if (full[i] < mean + 1.5 * std) continue;
    let peak = true;
    for (let j = i - radius; j <= i + radius && peak; j++) if (full[j] > full[i]) peak = false;
    const t = frameTime(i);
    if (peak && (!strong.length || t - strong.at(-1).t >= minGap)) strong.push({ t: round3(t), strength: round3(full[i]) });
  }
  const sortedScores = [...phaseScores].sort((a, b) => b - a);
  return {
    source: input,
    analyzed_at: new Date().toISOString(),
    duration: round3(pcm.length / SR),
    bpm: Math.round(bpm * 100) / 100,
    bpm_coarse: Math.round(coarse * 100) / 100,
    meter_assumed: meter,
    downbeat_confidence: sortedScores[1] > 0 ? round3(sortedScores[0] / sortedScores[1]) : null,
    beats: beats.map(round3),
    downbeats: beats.filter((_, k) => k % meter === phase).map(round3),
    strong_onsets: strong,
    method: 'log spectral flux (1024/256 @ 22.05 kHz) -> autocorrelation tempo -> DP beat tracking -> low-band downbeat phase'
  };
}

function parse(argv) {
  const opts = { minBpm: 60, maxBpm: 200, meter: 4, overwrite: false };
  const map = { input: 'input', output: 'output', 'min-bpm': 'minBpm', 'max-bpm': 'maxBpm', meter: 'meter' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return null;
    if (argv[i] === '--overwrite') { opts.overwrite = true; continue; }
    const key = map[argv[i].replace(/^--/, '')];
    if (!key || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${argv[i]}`);
    opts[key] = argv[++i];
  }
  if (!opts.input || !opts.output) throw Error('--input and --output are required. Use --help.');
  for (const k of ['minBpm', 'maxBpm', 'meter']) { opts[k] = Number(opts[k]); if (!(opts[k] > 0)) throw Error(`Invalid --${k}`); }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else {
      const output = path.resolve(opts.output);
      if (!opts.overwrite && await access(output).then(() => true, () => false)) throw Error(`Output already exists: ${output}. Use --overwrite to replace it.`);
      const result = await analyze(path.resolve(opts.input), opts);
      await writeFile(output, JSON.stringify(result, null, 2) + '\n');
      console.log(JSON.stringify({ output, bpm: result.bpm, beats: result.beats.length, downbeats: result.downbeats.length, strong_onsets: result.strong_onsets.length, duration: result.duration }, null, 2));
    }
  } catch (error) {
    console.error(`beats failed: ${error.message}`);
    process.exitCode = 1;
  }
}
