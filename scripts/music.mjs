#!/usr/bin/env node
// Generate a music bed with Google Lyria 3 through OpenRouter's chat completions API.
// Each real call is billed by OpenRouter; --dry-run shows the request without sending it.
import { spawn } from 'node:child_process';
import { access, mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Generate music with Google Lyria 3 via OpenRouter (paid; needs OPENROUTER_API_KEY).

node scripts/music.mjs --out /path/to/audio --style "taut string ostinato with taiko" \\
  --mood "tense, rising" --bpm 120 --duration 30 [--prompt "extra direction"] [--name music]

Options: --model <id> --seed <int> --vocals --dry-run --overwrite
Model: duration <= 30 s uses google/lyria-3-clip-preview (30 s clip); longer uses google/lyria-3-pro-preview.
Instrumental by default so narration stays clear; --vocals allows singing.
Writes <name>.<returned format> (bytes as returned), <name>.wav (48 kHz stereo, trimmed to
--duration with a short fade when the return is longer) and <name>.json (model, prompt, time, cost basis).
The key is read from the environment and never printed or written.`;

export const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const CLIP_MODEL = 'google/lyria-3-clip-preview';
export const PRO_MODEL = 'google/lyria-3-pro-preview';
// OpenRouter listing checked 2026-09-27. usage.cost from the response wins when present.
export const LISTED_PRICE = { [CLIP_MODEL]: '$0.04 per 30-second clip', [PRO_MODEL]: '$0.08 per song' };

export function buildPrompt({ style, mood, bpm, duration, prompt, vocals }) {
  const parts = [vocals ? 'Music.' : 'Instrumental music only, no vocals, no singing, no spoken words.'];
  if (style) parts.push(`Style and instrumentation: ${style}.`);
  if (mood) parts.push(`Mood: ${mood}.`);
  if (bpm) parts.push(`Tempo: ${bpm} BPM, steady and clearly audible pulse.`);
  if (duration) parts.push(`Length: about ${duration} seconds, with a clear ending rather than a fade into silence.`);
  if (prompt) parts.push(prompt);
  return parts.join(' ');
}

export function buildRequest(opts) {
  const duration = Number(opts.duration ?? 30);
  const model = opts.model || (duration <= 30 ? CLIP_MODEL : PRO_MODEL);
  const body = {
    model,
    messages: [{ role: 'user', content: buildPrompt({ ...opts, duration }) }],
    modalities: ['text', 'audio'],
    stream: true
  };
  if (opts.seed !== undefined) body.seed = Number(opts.seed);
  return body;
}

// Parse a complete SSE transcript from OpenRouter into audio bytes, text, usage and errors.
export function parseStream(text) {
  const audio = [], words = [];
  let usage = null, id = null, error = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    let chunk;
    try { chunk = JSON.parse(data); } catch { continue; }
    if (chunk.error) error = chunk.error.message || JSON.stringify(chunk.error);
    id ??= chunk.id ?? null;
    if (chunk.usage) usage = chunk.usage;
    for (const choice of chunk.choices ?? []) {
      const delta = choice.delta ?? {};
      if (delta.audio?.data) audio.push(delta.audio.data);
      if (delta.audio?.transcript) words.push(delta.audio.transcript);
      if (typeof delta.content === 'string') words.push(delta.content);
      if (choice.error) error = choice.error.message || JSON.stringify(choice.error);
    }
  }
  return { bytes: Buffer.from(audio.join(''), 'base64'), text: words.join(''), usage, id, error };
}

export function detectFormat(bytes) {
  if (bytes.length < 4) return null;
  const head = bytes.subarray(0, 4).toString('latin1');
  if (head === 'RIFF') return 'wav';
  if (head === 'fLaC') return 'flac';
  if (head === 'OggS') return 'ogg';
  if (head.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'mp3';
  return null;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err = (err + d).slice(-4000); });
    child.on('error', e => reject(Error(e.code === 'ENOENT' ? `${command} is not installed or not on PATH.` : e.message)));
    child.on('close', code => code === 0 ? resolve(out) : reject(Error(`${command} exited with ${code}: ${err}`)));
  });
}

const probeDuration = async file => Number((await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file])).trim());

export async function generate(opts) {
  const name = opts.name || 'music';
  const body = buildRequest(opts);
  if (opts.dryRun) return { dry_run: true, endpoint: ENDPOINT, body, listed_price: LISTED_PRICE[body.model] ?? 'unknown' };
  const out = path.resolve(opts.out);
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw Error('OPENROUTER_API_KEY is not set in this environment. Export it in your shell first; this script never asks for or stores the key.');
  await mkdir(out, { recursive: true });
  const jsonPath = path.join(out, `${name}.json`), wavPath = path.join(out, `${name}.wav`);
  for (const file of [jsonPath, wavPath]) {
    if (!opts.overwrite && await access(file).then(() => true, () => false)) throw Error(`Output already exists: ${file}. Use --overwrite or another --name.`);
  }
  const started = new Date();
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'video-illustrator' },
    body: JSON.stringify(body)
  });
  const transcript = await response.text();
  if (!response.ok) throw Error(`OpenRouter returned HTTP ${response.status}: ${transcript.slice(0, 600)}`);
  const parsed = parseStream(transcript);
  if (parsed.error) throw Error(`OpenRouter stream error: ${parsed.error}`);
  const format = detectFormat(parsed.bytes);
  if (!format) throw Error(`No decodable audio in the response (${parsed.bytes.length} bytes). First text: ${parsed.text.slice(0, 200)}`);
  const rawPath = path.join(out, `${name}.${format}`);
  if (!opts.overwrite && format !== 'wav' && await access(rawPath).then(() => true, () => false)) throw Error(`Output already exists: ${rawPath}.`);
  const rawTarget = format === 'wav' ? path.join(out, `${name}.source.wav`) : rawPath;
  await writeFile(rawTarget, parsed.bytes);
  const returned = await probeDuration(rawTarget);
  const target = Number(opts.duration ?? 30);
  const warnings = [];
  const filters = ['aresample=48000'];
  if (returned > target + 0.05) {
    const fade = Math.min(1.5, target / 4);
    filters.push(`atrim=0:${target}`, `afade=t=out:st=${(target - fade).toFixed(3)}:d=${fade.toFixed(3)}`);
  } else if (returned < target - 0.05) {
    warnings.push(`Returned music is ${returned.toFixed(2)} s, shorter than the requested ${target} s; not padded.`);
  }
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', rawTarget, '-af', filters.join(','), '-ac', '2', '-c:a', 'pcm_s16le', wavPath]);
  const receipt = {
    created_at: started.toISOString(),
    model: body.model,
    endpoint: ENDPOINT,
    generation_id: parsed.id,
    prompt: body.messages[0].content,
    parameters: { style: opts.style ?? null, mood: opts.mood ?? null, bpm: opts.bpm ? Number(opts.bpm) : null, duration: target, seed: body.seed ?? null, vocals: Boolean(opts.vocals) },
    returned: { format, bytes: parsed.bytes.length, duration: Math.round(returned * 1000) / 1000, text: parsed.text || null },
    files: { source: rawTarget, wav: wavPath, wav_duration: Math.round((await probeDuration(wavPath)) * 1000) / 1000 },
    cost: {
      reported_usd: parsed.usage?.cost ?? null,
      usage: parsed.usage,
      basis: parsed.usage?.cost != null ? 'usage.cost reported by OpenRouter for this call' : `OpenRouter listed price ${LISTED_PRICE[body.model] ?? 'unknown'} (checked 2026-09-27); no cost field in the response`
    },
    note: 'The requested BPM is a prompt, not a guarantee. Measure the actual grid with scripts/beats.mjs before timing picture.',
    warnings
  };
  await writeFile(jsonPath, JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

function parse(argv) {
  const opts = { overwrite: false, vocals: false, dryRun: false };
  const values = ['out', 'style', 'mood', 'bpm', 'duration', 'prompt', 'model', 'seed', 'name'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    if (a === '--vocals') { opts.vocals = true; continue; }
    if (a === '--dry-run') { opts.dryRun = true; continue; }
    const key = a.replace(/^--/, '');
    if (!values.includes(key) || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${a}`);
    opts[key] = argv[++i];
  }
  if (!opts.out && !opts.dryRun) throw Error('--out <directory> is required. Use --help.');
  if (opts.duration !== undefined && !(Number(opts.duration) > 0 && Number(opts.duration) <= 240)) throw Error('--duration must be between 0 and 240 seconds.');
  if (opts.name && !/^[\w.-]+$/.test(opts.name)) throw Error('--name may contain only letters, digits, dot, dash and underscore.');
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else console.log(JSON.stringify(await generate(opts), null, 2));
  } catch (error) {
    console.error(`music failed: ${error.message}`);
    process.exitCode = 1;
  }
}
