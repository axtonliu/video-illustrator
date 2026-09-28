#!/usr/bin/env node
// Contact sheet, distinct-scene count and real-asset screen time for a rendered clip.
// FFmpeg extracts and scales frames; hashing and template matching run in plain Node.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Sample a preview or final MP4, write a labelled contact sheet and contact.json.

node scripts/contact.mjs --input clip.mp4 --output-dir qa/ [--beats beats.json] [--asset cover.png ...]
  [--threshold 64 --interval 2 --scenes N --asset-threshold 0.55 --overwrite]

Sampling: one frame per bar (middle of each bar from beats.json downbeats, in film time),
or one frame per --interval seconds (middle of each interval) without beats.
Each frame gets a 256-bit dHash (FFmpeg scales it to 17x16 grey). A frame counts as a new
scene when its smallest Hamming distance to every earlier sample is >= --threshold (default
64 of 256), so small camera moves on the same picture do not count.
--asset (repeatable) estimates how often a real asset is on screen: normalized cross-correlation
of the downscaled asset against the downscaled frame at several sizes. It only finds the asset
roughly upright and facing the camera; perspective, heavy relighting or partial crops lower
the score. The result is an estimate, labelled as such.
--scenes N (the scene-list count from brief.md) adds a warning when distinct_scenes < 70% of N.
An asset on screen in more than half of the samples also adds a warning. Warnings never fail
the run; they are evidence for the brief.`;

const HASH_W = 17, HASH_H = 16;
const ANALYSIS_SHORT = 144;                       // short side of the frame used for asset matching
const ASSET_SCALES = [0.2, 0.25, 0.3, 0.36, 0.43, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]; // asset height as a fraction of frame height (landscape)
const THUMB_LONG = 320;
const round3 = x => Math.round(x * 1000) / 1000;

function run(command, args, { binary = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = []; let stderr = '';
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', d => { stderr = (stderr + d).slice(-4000); });
    child.on('error', e => reject(Error(e.code === 'ENOENT' ? `${command} is not installed or not on PATH.` : e.message)));
    child.on('close', code => {
      if (code !== 0) return reject(Error(`${command} failed: ${stderr.trim()}`));
      const out = Buffer.concat(chunks);
      resolve(binary ? out : out.toString('utf8'));
    });
  });
}

async function probe(input) {
  const info = JSON.parse(await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', input]));
  const stream = info.streams?.[0];
  if (!stream) throw Error(`No video stream in ${input}`);
  const [num, den] = stream.r_frame_rate.split('/').map(Number);
  return { width: stream.width, height: stream.height, fps: den ? num / den : num, duration: Number(info.format.duration) };
}

// Sample times: middle of each bar when beats are given, otherwise middle of each interval.
export function sampleTimes(duration, { beats = null, interval = 2 } = {}) {
  if (beats) {
    let starts = (beats.downbeats?.length ? beats.downbeats : (beats.beats || []).filter((_, k) => k % (beats.meter_assumed || 4) === 0)).filter(t => t < duration);
    if (starts.length >= 2) {
      const gaps = starts.slice(1).map((t, k) => t - starts[k]).sort((a, b) => a - b);
      const bar = gaps[Math.floor(gaps.length / 2)];
      while (starts[0] - bar + bar / 2 > 0) starts.unshift(starts[0] - bar);
      while (starts.at(-1) + bar + bar / 2 < duration) starts.push(starts.at(-1) + bar);
      const times = starts.map((t, k) => t + ((starts[k + 1] ?? t + bar) - t) / 2).filter(t => t >= 0 && t < duration);
      return { mode: 'bars', bar_seconds: round3(bar), times: times.map(round3) };
    }
  }
  const times = [];
  for (let t = interval / 2; t < duration; t += interval) times.push(round3(t));
  return { mode: 'interval', interval, times };
}

export function dhashBits(gray, w = HASH_W, h = HASH_H) {
  const bits = new Uint8Array((w - 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) bits[y * (w - 1) + x] = gray[y * w + x] > gray[y * w + x + 1] ? 1 : 0;
  return bits;
}

export const bitsToHex = bits => {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) hex += ((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16);
  return hex;
};

export function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += a[i] !== b[i];
  return d;
}

// For each sample: smallest distance to any earlier sample, which one, and whether it is a new scene.
export function distinctScenes(hashes, threshold = 64) {
  const frames = hashes.map((bits, k) => {
    let min = null, nearest = null;
    for (let j = 0; j < k; j++) { const d = hamming(bits, hashes[j]); if (min === null || d < min) { min = d; nearest = j; } }
    return { min_distance: min, nearest, new_scene: k === 0 || min >= threshold };
  });
  return { frames, distinct: frames.filter(f => f.new_scene).length };
}

// Best zero-mean normalized cross-correlation of a template anywhere in the frame (both grey, Uint8).
export function bestMatch(frame, fw, fh, tpl, tw, th) {
  if (tw > fw || th > fh) return null;
  const n = tw * th;
  let tMean = 0; for (let i = 0; i < n; i++) tMean += tpl[i]; tMean /= n;
  const t = new Float64Array(n); let tNorm = 0;
  for (let i = 0; i < n; i++) { t[i] = tpl[i] - tMean; tNorm += t[i] * t[i]; }
  tNorm = Math.sqrt(tNorm);
  if (tNorm < 1e-6) return null;
  const W = fw + 1, S = new Float64Array(W * (fh + 1)), S2 = new Float64Array(W * (fh + 1));
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const v = frame[y * fw + x], i = (y + 1) * W + x + 1;
    S[i] = v + S[i - 1] + S[i - W] - S[i - W - 1];
    S2[i] = v * v + S2[i - 1] + S2[i - W] - S2[i - W - 1];
  }
  let best = { score: -1, x: 0, y: 0 };
  for (let y = 0; y + th <= fh; y++) for (let x = 0; x + tw <= fw; x++) {
    const a = y * W + x, b = a + tw, c = a + th * W, d = c + tw;
    const sum = S[d] - S[b] - S[c] + S[a], sum2 = S2[d] - S2[b] - S2[c] + S2[a];
    const variance = sum2 - sum * sum / n;
    if (variance < n * 4) continue;               // flat patch (std < 2 grey levels): no evidence either way
    let dot = 0;
    for (let ty = 0; ty < th; ty++) {
      const row = (y + ty) * fw + x, trow = ty * tw;
      for (let tx = 0; tx < tw; tx++) dot += frame[row + tx] * t[trow + tx];
    }
    const score = dot / (Math.sqrt(variance) * tNorm);
    if (score > best.score) best = { score, x, y };
  }
  return best;
}

async function grayFrame(input, time, w, h, file) {
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', String(time), '-i', input, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-f', 'rawvideo', file]);
  const data = await readFile(file);
  if (data.length !== w * h) throw Error(`Could not read a frame at ${time}s.`);
  return new Uint8Array(data);
}

async function grayImage(file, w, h) {
  const data = await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { binary: true });
  if (data.length !== w * h) throw Error(`Could not read asset ${file}.`);
  return new Uint8Array(data);
}

async function loadAsset(file, fw, fh) {
  const bytes = await readFile(file);
  const info = JSON.parse(await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file]));
  const { width, height } = info.streams?.[0] || {};
  if (!width || !height) throw Error(`Asset is not an image FFmpeg can read: ${file}`);
  const templates = [];
  for (const s of ASSET_SCALES) {
    const th = Math.round(fh * s), tw = Math.round(th * width / height);
    if (tw < 8 || th < 8 || tw > fw || th > fh) continue;
    templates.push({ scale: s, tw, th, data: await grayImage(file, tw, th) });
  }
  return { file, name: path.basename(file), sha256: createHash('sha256').update(bytes).digest('hex'), templates };
}

function matchAsset(asset, frame, fw, fh) {
  let best = null;
  for (const t of asset.templates) {
    const m = bestMatch(frame, fw, fh, t.data, t.tw, t.th);
    if (m && (!best || m.score > best.score)) best = { ...m, tw: t.tw, th: t.th };
  }
  if (!best) return { score: null, box: null };
  return { score: round3(best.score), box: [best.x / fw, best.y / fh, best.tw / fw, best.th / fh].map(round3) };
}

const label = s => s.replace(/[^A-Za-z0-9 .#=+-]/g, '');

async function thumbnail(input, time, tw, th, frame, file, withText) {
  const filters = [`scale=${tw}:${th}:flags=area`];
  for (const a of frame.assetHits) if (a.present) {
    const [x, y, w, h] = a.box;
    filters.push(`drawbox=x=${Math.round(x * tw)}:y=${Math.round(y * th)}:w=${Math.round(w * tw)}:h=${Math.round(h * th)}:color=yellow@0.9:t=2`);
  }
  if (withText) {
    const top = label(`#${String(frame.index).padStart(2, '0')}  ${frame.time.toFixed(2)} s  ${frame.new_scene ? 'NEW' : `d=${frame.min_distance} ~#${frame.nearest}`}`);
    filters.push(`drawtext=text='${top}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4`);
    const hits = frame.assetHits.filter(a => a.score !== null).map(a => `${a.name.slice(0, 18)} ${a.score.toFixed(2)}${a.present ? ' ON' : ''}`);
    if (hits.length) filters.push(`drawtext=text='${label(hits.join('  '))}':x=6:y=h-th-8:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4`);
  }
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', String(time), '-i', input, '-frames:v', '1', '-vf', filters.join(','), file]);
}

export async function contact(opts) {
  const input = path.resolve(opts.input);
  const outDir = path.resolve(opts.outputDir);
  const threshold = opts.threshold ?? 64, assetThreshold = opts.assetThreshold ?? 0.55;
  const meta = await probe(input);
  const beats = opts.beats ? JSON.parse(await readFile(path.resolve(opts.beats), 'utf8')) : null;
  const sampling = sampleTimes(meta.duration, { beats, interval: opts.interval ?? 2 });
  const lastFrame = Math.max(0, meta.duration - 1.5 / meta.fps);
  const times = sampling.times.map(t => Math.min(t, lastFrame));
  if (!times.length) throw Error('The clip is too short to sample.');
  const landscape = meta.width >= meta.height;
  const fw = landscape ? Math.round(ANALYSIS_SHORT * meta.width / meta.height) : ANALYSIS_SHORT;
  const fh = landscape ? ANALYSIS_SHORT : Math.round(ANALYSIS_SHORT * meta.height / meta.width);
  const tw = landscape ? THUMB_LONG : Math.round(THUMB_LONG * meta.width / meta.height / 2) * 2;
  const th = landscape ? Math.round(THUMB_LONG * meta.height / meta.width / 2) * 2 : THUMB_LONG;
  const scratch = await mkdtemp(path.join(tmpdir(), 'video-illustrator-contact-'));
  const warnings = [];
  try {
    const assets = [];
    for (const file of opts.assets || []) assets.push(await loadAsset(path.resolve(file), fw, fh));
    const hashes = [], frames = [];
    for (const [k, time] of times.entries()) {
      const small = await grayFrame(input, time, HASH_W, HASH_H, path.join(scratch, 'h.gray'));
      hashes.push(dhashBits(small));
      const assetHits = [];
      if (assets.length) {
        const big = await grayFrame(input, time, fw, fh, path.join(scratch, 'a.gray'));
        for (const a of assets) { const m = matchAsset(a, big, fw, fh); assetHits.push({ name: a.name, ...m, present: m.score !== null && m.score >= assetThreshold }); }
      }
      frames.push({ index: k, time, dhash: bitsToHex(hashes[k]), assetHits });
    }
    const scenes = distinctScenes(hashes, threshold);
    frames.forEach((f, k) => Object.assign(f, scenes.frames[k]));

    let labels = true;
    for (const f of frames) {
      const file = path.join(scratch, `t${String(f.index).padStart(4, '0')}.png`);
      try { await thumbnail(input, f.time, tw, th, f, file, labels); }
      catch (error) {
        if (!labels) throw error;
        labels = false;
        warnings.push(`Contact sheet has no text labels (FFmpeg drawtext failed: ${error.message.slice(0, 200)}). Times are in contact.json.`);
        await thumbnail(input, f.time, tw, th, f, file, false);
      }
    }
    const cols = Math.min(5, frames.length), rows = Math.ceil(frames.length / cols);
    await mkdir(outDir, { recursive: true });
    const sheet = path.join(outDir, 'contact.png'), json = path.join(outDir, 'contact.json');
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-framerate', '1', '-start_number', '0', '-i', path.join(scratch, 't%04d.png'), '-vf', `tile=${cols}x${rows}:padding=4:margin=4:color=0x202020`, '-frames:v', '1', '-update', '1', sheet]);

    const assetSummary = assets.map(a => {
      const present = frames.filter(f => f.assetHits.find(h => h.name === a.name)?.present).length;
      return { file: a.file, sha256: a.sha256, estimate: true, threshold: assetThreshold, frames_present: present, frames_sampled: frames.length, fraction: round3(present / frames.length), method: `max zero-mean NCC of the grey asset at heights ${ASSET_SCALES.join('/')} of the frame height, frame downscaled to ${fw}x${fh}; upright, front-facing appearances only` };
    });
    if (opts.scenes && scenes.distinct < 0.7 * opts.scenes) warnings.push(`distinct_scenes ${scenes.distinct} is below 70% of the scene list (${opts.scenes}).`);
    for (const a of assetSummary) if (a.fraction > 0.5) warnings.push(`${path.basename(a.file)} is estimated on screen in ${Math.round(a.fraction * 100)}% of samples (more than half).`);
    if (frames.length < 2) warnings.push('Only one frame was sampled; the scene count says nothing.');

    const result = {
      source: input,
      analyzed_at: new Date().toISOString(),
      duration: round3(meta.duration), fps: round3(meta.fps), width: meta.width, height: meta.height,
      sampling: { ...sampling, times: undefined, beats: opts.beats ? path.resolve(opts.beats) : null },
      hash: 'dHash: FFmpeg area-scaled 17x16 grey, 256 bits; distance = Hamming',
      threshold,
      frames_sampled: frames.length,
      distinct_scenes: scenes.distinct,
      scene_list_count: opts.scenes ?? null,
      frames: frames.map(f => ({
        index: f.index, time: f.time, dhash: f.dhash, min_distance: f.min_distance, nearest: f.nearest, new_scene: f.new_scene,
        ...(f.assetHits.length ? { assets: Object.fromEntries(f.assetHits.map(h => [h.name, { score: h.score, present: h.present, box: h.box }])) } : {})
      })),
      assets: assetSummary,
      sheet, labels,
      warnings,
      note: 'Proxy measures for review. Warnings are evidence for brief.md, not a pass/fail gate.'
    };
    await writeFile(json, JSON.stringify(result, null, 2) + '\n');
    return { ...result, json };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

function parse(argv) {
  const opts = { assets: [], overwrite: false };
  const map = { input: 'input', 'output-dir': 'outputDir', beats: 'beats', threshold: 'threshold', interval: 'interval', scenes: 'scenes', 'asset-threshold': 'assetThreshold' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    if (a === '--asset' && argv[i + 1] !== undefined) { opts.assets.push(argv[++i]); continue; }
    const key = map[a.replace(/^--/, '')];
    if (!key || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${a}`);
    opts[key] = argv[++i];
  }
  if (!opts.input || !opts.outputDir) throw Error('--input and --output-dir are required. Use --help.');
  for (const [k, lo, hi] of [['threshold', 1, 256], ['interval', 0.1, 60], ['scenes', 1, 1000], ['assetThreshold', 0, 1]]) {
    if (opts[k] === undefined) continue;
    opts[k] = Number(opts[k]);
    if (!(opts[k] >= lo && opts[k] <= hi)) throw Error(`Invalid --${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}: must be between ${lo} and ${hi}.`);
  }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else {
      const outDir = path.resolve(opts.outputDir);
      if (!opts.overwrite) for (const name of ['contact.png', 'contact.json']) {
        const file = path.join(outDir, name);
        if (await access(file).then(() => true, () => false)) throw Error(`Output already exists: ${file}. Use --overwrite to replace it.`);
      }
      const r = await contact(opts);
      console.log(JSON.stringify({ sheet: r.sheet, json: r.json, frames: r.frames_sampled, sampling: r.sampling.mode, distinct_scenes: r.distinct_scenes, assets: r.assets.map(a => ({ file: path.basename(a.file), fraction: a.fraction, estimate: true })), warnings: r.warnings }));
      for (const w of r.warnings) console.error(`warning: ${w}`);
    }
  } catch (error) {
    console.error(`contact failed: ${error.message}`);
    process.exitCode = 1;
  }
}
