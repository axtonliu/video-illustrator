#!/usr/bin/env node
// Generate a music bed with Google Lyria through OpenRouter (default) or the Gemini API.
// Each real call is billed by the provider; --dry-run shows the request without sending it.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Generate music with Google Lyria (paid). Default provider: OpenRouter (needs OPENROUTER_API_KEY);
--provider gemini calls the Gemini API directly (needs GEMINI_API_KEY).

node scripts/music.mjs --out /path/to/audio --style "taut string ostinato with taiko" \\
  --mood "tense, rising" --bpm 120 --duration 30 [--prompt "extra direction"] [--name music] \\
  [--ref keyframe-1.jpg --ref keyframe-2.jpg ...]

Options: --provider openrouter|gemini --model <id> --seed <int> (OpenRouter only) --vocals --dry-run --overwrite
--ref <image>  a keyframe or asset image sent with the prompt so the music follows the picture's mood,
               colour and pace (repeatable, at most 10; PNG, JPEG or WebP). References shape style only;
               they do not make the music hit picture cuts. Measure beats with scripts/beats.mjs.
Models: duration <= 30 s uses the 30 s clip model (OpenRouter google/lyria-3-clip-preview, Gemini
lyria-3-clip-preview); longer uses google/lyria-3-pro-preview (OpenRouter) or lyria-3.5 (Gemini).
Instrumental by default so narration stays clear; --vocals allows singing.
Writes <name>.<returned format> (bytes as returned), <name>.wav (48 kHz stereo, trimmed to
--duration with a short fade when the return is longer) and <name>.json (provider, model, prompt,
reference file names and sha256, time, cost basis).
The key is read from the environment and never printed or written.`;

export const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const CLIP_MODEL = 'google/lyria-3-clip-preview';
export const PRO_MODEL = 'google/lyria-3-pro-preview';
// Gemini Interactions API (ai.google.dev/gemini-api/docs/music-generation, checked 2026-09-27).
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const GEMINI_CLIP_MODEL = 'lyria-3-clip-preview';
export const GEMINI_FULL_MODEL = 'lyria-3.5';
// Gemini documents up to 10 images per request; OpenRouter lists image input for both Lyria models.
export const MAX_REFS = 10;
export const PROVIDERS = {
  openrouter: { endpoint: ENDPOINT, keyEnv: 'OPENROUTER_API_KEY', clip: CLIP_MODEL, full: PRO_MODEL },
  gemini: { endpoint: GEMINI_ENDPOINT, keyEnv: 'GEMINI_API_KEY', clip: GEMINI_CLIP_MODEL, full: GEMINI_FULL_MODEL }
};
// Listed prices checked 2026-09-27 (OpenRouter model pages; Gemini API pricing page, paid tier).
// For OpenRouter, usage.cost from the response wins when present.
export const LISTED_PRICE = {
  [`openrouter:${CLIP_MODEL}`]: '$0.04 per 30-second clip (OpenRouter listing)',
  [`openrouter:${PRO_MODEL}`]: '$0.08 per song (OpenRouter listing)',
  [`gemini:${GEMINI_CLIP_MODEL}`]: '$0.04 per 30-second clip (Gemini API paid tier)',
  [`gemini:${GEMINI_FULL_MODEL}`]: '$0.08 per song (Gemini API paid tier)'
};

export function buildPrompt({ style, mood, bpm, duration, prompt, vocals, references = 0 }) {
  const parts = [vocals ? 'Music.' : 'Instrumental music only, no vocals, no singing, no spoken words.'];
  if (style) parts.push(`Style and instrumentation: ${style}.`);
  if (mood) parts.push(`Mood: ${mood}.`);
  if (bpm) parts.push(`Tempo: ${bpm} BPM, steady and clearly audible pulse.`);
  if (duration) parts.push(`Length: about ${duration} seconds, with a clear ending rather than a fade into silence.`);
  if (references) parts.push(`The attached ${references === 1 ? 'image is a frame' : `${references} images are frames`} from the video this music will accompany; match ${references === 1 ? 'its' : 'their'} mood, colour temperature, pace and texture.`);
  if (prompt) parts.push(prompt);
  return parts.join(' ');
}

export function imageMime(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

// Read reference images; the type comes from the file's bytes, not its extension.
export async function loadReferences(files = []) {
  if (files.length > MAX_REFS) throw Error(`At most ${MAX_REFS} --ref images are allowed (got ${files.length}).`);
  const refs = [];
  for (const file of files) {
    const bytes = await readFile(path.resolve(file)).catch(e => { throw Error(`Cannot read --ref ${file}: ${e.code || e.message}`); });
    const mime = imageMime(bytes);
    if (!mime) throw Error(`--ref ${file} is not a PNG, JPEG or WebP image.`);
    refs.push({ file: path.basename(file), mime, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), data: bytes.toString('base64') });
  }
  return refs;
}

const describeRef = ref => ({ file: ref.file, mime: ref.mime, bytes: ref.bytes, sha256: ref.sha256 });

function defaultModel(provider, duration) {
  const p = PROVIDERS[provider];
  return duration <= 30 ? p.clip : p.full;
}

// OpenRouter chat completions body. Images go as OpenAI-style image_url data URLs after the text.
export function buildRequest(opts, refs = []) {
  const duration = Number(opts.duration ?? 30);
  const model = opts.model || defaultModel('openrouter', duration);
  const text = buildPrompt({ ...opts, duration, references: refs.length });
  const content = refs.length
    ? [{ type: 'text', text }, ...refs.map(ref => ({ type: 'image_url', image_url: { url: `data:${ref.mime};base64,${ref.data}` } }))]
    : text;
  const body = {
    model,
    messages: [{ role: 'user', content }],
    modalities: ['text', 'audio'],
    stream: true
  };
  if (opts.seed !== undefined) body.seed = Number(opts.seed);
  return body;
}

// Gemini Interactions body: input is the text, or a list of text and image content blocks.
export function buildGeminiRequest(opts, refs = []) {
  const duration = Number(opts.duration ?? 30);
  const model = opts.model || defaultModel('gemini', duration);
  const text = buildPrompt({ ...opts, duration, references: refs.length });
  const input = refs.length
    ? [{ type: 'text', text }, ...refs.map(ref => ({ type: 'image', mime_type: ref.mime, data: ref.data }))]
    : text;
  return { model, input };
}

export function requestFor(opts, refs = []) {
  const provider = opts.provider || 'openrouter';
  if (!PROVIDERS[provider]) throw Error(`--provider must be openrouter or gemini (got ${provider}).`);
  const body = provider === 'gemini' ? buildGeminiRequest(opts, refs) : buildRequest(opts, refs);
  const prompt = buildPrompt({ ...opts, duration: Number(opts.duration ?? 30), references: refs.length });
  return { provider, endpoint: PROVIDERS[provider].endpoint, keyEnv: PROVIDERS[provider].keyEnv, model: body.model, prompt, body };
}

// A copy of the body with image bytes replaced by a short description, for --dry-run output.
export function redactBody(body) {
  const redact = value => typeof value === 'string' && value.length > 200
    ? `<${value.startsWith('data:') ? value.slice(0, value.indexOf(',') + 1) : ''}${value.length} base64 chars omitted>` : value;
  return JSON.parse(JSON.stringify(body, (key, value) => (key === 'data' || key === 'url') ? redact(value) : value));
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

// Parse a Gemini Interactions response: audio and text blocks inside model_output steps.
// The last audio block wins, matching the SDK's output_audio convenience property.
export function parseInteraction(json) {
  let audio = null;
  const words = [];
  for (const step of json.steps ?? []) {
    if (step.type !== 'model_output') continue;
    for (const block of step.content ?? []) {
      if (block.type === 'audio' && block.data) audio = block.data;
      else if (block.type === 'text' && block.text) words.push(block.text);
    }
  }
  const error = json.error ? (json.error.message || JSON.stringify(json.error)) : null;
  return { bytes: Buffer.from(audio ?? '', 'base64'), text: words.join('\n'), usage: json.usage ?? null, id: json.id ?? null, status: json.status ?? null, error };
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

async function callProvider(request, key) {
  if (request.provider === 'gemini') {
    const response = await fetch(request.endpoint, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body)
    });
    const text = await response.text();
    if (!response.ok) throw Error(`Gemini API returned HTTP ${response.status}: ${text.slice(0, 600)}`);
    let json;
    try { json = JSON.parse(text); } catch { throw Error(`Gemini API returned non-JSON: ${text.slice(0, 300)}`); }
    return parseInteraction(json);
  }
  const response = await fetch(request.endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'video-illustrator' },
    body: JSON.stringify(request.body)
  });
  const transcript = await response.text();
  if (!response.ok) throw Error(`OpenRouter returned HTTP ${response.status}: ${transcript.slice(0, 600)}`);
  return parseStream(transcript);
}

export async function generate(opts) {
  const name = opts.name || 'music';
  const provider = opts.provider || 'openrouter';
  if (provider === 'gemini' && opts.seed !== undefined) throw Error('--seed is not part of the documented Gemini Lyria request; omit it with --provider gemini.');
  const refs = await loadReferences(opts.ref ?? []);
  const request = requestFor(opts, refs);
  const price = LISTED_PRICE[`${request.provider}:${request.model}`] ?? 'unknown';
  if (opts.dryRun) return { dry_run: true, provider: request.provider, endpoint: request.endpoint, key_env: request.keyEnv, body: redactBody(request.body), references: refs.map(describeRef), listed_price: price };
  const out = path.resolve(opts.out);
  const key = process.env[request.keyEnv];
  if (!key) throw Error(`${request.keyEnv} is not set in this environment. Export it in your shell first; this script never asks for or stores the key.`);
  await mkdir(out, { recursive: true });
  const jsonPath = path.join(out, `${name}.json`), wavPath = path.join(out, `${name}.wav`);
  for (const file of [jsonPath, wavPath]) {
    if (!opts.overwrite && await access(file).then(() => true, () => false)) throw Error(`Output already exists: ${file}. Use --overwrite or another --name.`);
  }
  const started = new Date();
  const parsed = await callProvider(request, key);
  const label = request.provider === 'gemini' ? 'Gemini API' : 'OpenRouter stream';
  if (parsed.error) throw Error(`${label} error: ${parsed.error}`);
  const format = detectFormat(parsed.bytes);
  if (!format) throw Error(`No decodable audio in the response (${parsed.bytes.length} bytes${parsed.status ? `, status ${parsed.status}` : ''}). First text: ${parsed.text.slice(0, 200)}`);
  const rawPath = path.join(out, `${name}.${format}`);
  if (!opts.overwrite && format !== 'wav' && await access(rawPath).then(() => true, () => false)) throw Error(`Output already exists: ${rawPath}.`);
  const rawTarget = format === 'wav' ? path.join(out, `${name}.source.wav`) : rawPath;
  await writeFile(rawTarget, parsed.bytes);
  const returned = await probeDuration(rawTarget);
  const target = Number(opts.duration ?? 30);
  const warnings = [];
  const filters = ['aresample=48000'];
  if (returned > target + 0.05) {
    // A clip that stops mid-phrase reads as broken; use a long fade (rendering.md: end on a bar, fade 2–3 s).
    const fade = Math.min(3, target / 4);
    filters.push(`atrim=0:${target}`, `afade=t=out:st=${(target - fade).toFixed(3)}:d=${fade.toFixed(3)}`);
  } else if (returned < target - 0.05) {
    warnings.push(`Returned music is ${returned.toFixed(2)} s, shorter than the requested ${target} s; not padded.`);
  }
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', rawTarget, '-af', filters.join(','), '-ac', '2', '-c:a', 'pcm_s16le', wavPath]);
  const reported = request.provider === 'openrouter' ? parsed.usage?.cost ?? null : null;
  const receipt = {
    created_at: started.toISOString(),
    provider: request.provider,
    model: request.model,
    endpoint: request.endpoint,
    generation_id: parsed.id,
    prompt: request.prompt,
    references: refs.map(describeRef),
    parameters: { style: opts.style ?? null, mood: opts.mood ?? null, bpm: opts.bpm ? Number(opts.bpm) : null, duration: target, seed: request.body.seed ?? null, vocals: Boolean(opts.vocals) },
    returned: { format, bytes: parsed.bytes.length, duration: Math.round(returned * 1000) / 1000, text: parsed.text || null, ...(parsed.status ? { status: parsed.status } : {}) },
    files: { source: rawTarget, wav: wavPath, wav_duration: Math.round((await probeDuration(wavPath)) * 1000) / 1000 },
    cost: {
      reported_usd: reported,
      usage: parsed.usage,
      basis: reported != null ? 'usage.cost reported by OpenRouter for this call' : `listed price ${price} (checked 2026-09-27); no cost field in the response`
    },
    note: 'The requested BPM is a prompt, not a guarantee, and reference images shape style, not cut timing. Measure the actual grid with scripts/beats.mjs before timing picture.',
    warnings
  };
  await writeFile(jsonPath, JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

function parse(argv) {
  const opts = { overwrite: false, vocals: false, dryRun: false };
  const values = ['out', 'style', 'mood', 'bpm', 'duration', 'prompt', 'model', 'seed', 'name', 'provider'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    if (a === '--vocals') { opts.vocals = true; continue; }
    if (a === '--dry-run') { opts.dryRun = true; continue; }
    if (a === '--ref') {
      if (argv[i + 1] === undefined) throw Error('Missing value for --ref');
      (opts.ref ??= []).push(argv[++i]);
      continue;
    }
    const key = a.replace(/^--/, '');
    if (!values.includes(key) || argv[i + 1] === undefined) throw Error(`Unknown or incomplete option: ${a}`);
    opts[key] = argv[++i];
  }
  if (!opts.out && !opts.dryRun) throw Error('--out <directory> is required. Use --help.');
  if (opts.duration !== undefined && !(Number(opts.duration) > 0 && Number(opts.duration) <= 240)) throw Error('--duration must be between 0 and 240 seconds.');
  if (opts.provider && !PROVIDERS[opts.provider]) throw Error('--provider must be openrouter or gemini.');
  if (opts.ref && opts.ref.length > MAX_REFS) throw Error(`At most ${MAX_REFS} --ref images are allowed.`);
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
