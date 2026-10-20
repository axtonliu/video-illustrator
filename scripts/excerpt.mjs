#!/usr/bin/env node
// Cut one window out of a longer narrated video or recording: its audio plus the subtitle cues
// that fall inside it, re-timed to start at 0. Plain Node; FFmpeg only cuts the audio.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);

const HELP = `Cut a window [from, to) out of a longer narration and its subtitles.

node scripts/excerpt.mjs --srt final.srt --from 43 --to 68 --out excerpt/ [--media master.mp4] [--overwrite]
node scripts/excerpt.mjs --words words.json --from 43 --to 68 --out excerpt/

Writes into --out:
  words.json    {text, duration, source, cues:[{text, start, end, source_start, source_end, clipped?}]}
                in the format scripts/onsets.mjs reads; times are seconds from the window start.
                A cue that crosses an edge is kept, cut to the window, and marked
                clipped: "start" | "end" | "both", so a half sentence is visible, not hidden.
  narration.wav (with --media) the window's audio, 48 kHz PCM, from any file FFmpeg reads.
                It is the source's audio as it is: a mixed master stays a mix (music included).
  excerpt.json  source paths and SHA-256, the window, the cue count and what was clipped.
Times accept seconds (43.13) or SRT/clock form (00:00:43,130 or 0:43.13).
Existing files in --out are protected unless --overwrite.`;

const round3 = x => Math.round(x * 1000) / 1000;

export function parseTime(value) {
  const text = String(value).trim().replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => !Number.isFinite(n))) throw Error(`Bad time: ${value}`);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function parseSrt(text) {
  const cues = [];
  for (const block of text.replace(/^﻿/, '').replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const timing = lines.findIndex(line => line.includes('-->'));
    if (timing < 0) continue;
    const [a, b] = lines[timing].split('-->').map(s => s.trim().split(/\s+/)[0]);
    const body = lines.slice(timing + 1).join('\n');
    if (!body) continue;
    cues.push({ text: body, start: parseTime(a), end: parseTime(b) });
  }
  return cues;
}

// Keep every cue that overlaps [from, to); cut it to the window and say which edge was cut.
export function windowCues(cues, from, to) {
  if (!(to > from)) throw Error('--to must be later than --from.');
  const out = [];
  for (const cue of cues) {
    if (!(cue.end > from && cue.start < to)) continue;
    const start = Math.max(cue.start, from), end = Math.min(cue.end, to);
    const cutStart = cue.start < from, cutEnd = cue.end > to;
    const row = { text: cue.text, start: round3(start - from), end: round3(end - from), source_start: round3(cue.start), source_end: round3(cue.end) };
    if (cutStart || cutEnd) row.clipped = cutStart && cutEnd ? 'both' : cutStart ? 'start' : 'end';
    out.push(row);
  }
  return out;
}

function parse(argv) {
  const opts = { overwrite: false };
  const values = new Set(['srt', 'words', 'from', 'to', 'out', 'media']);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return null;
    if (argv[i] === '--overwrite') { opts.overwrite = true; continue; }
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !values.has(key)) throw Error(`Unknown option: ${argv[i]}`);
    if (argv[i + 1] === undefined) throw Error(`Missing value for --${key}`);
    opts[key] = argv[++i];
  }
  if (!opts.srt === !opts.words) throw Error('Give exactly one of --srt or --words.');
  if (opts.from === undefined || opts.to === undefined || !opts.out) throw Error('--from, --to and --out are required. Use --help.');
  opts.from = parseTime(opts.from);
  opts.to = parseTime(opts.to);
  return opts;
}

const sha256 = file => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  createReadStream(file).on('error', reject).on('data', chunk => hash.update(chunk)).on('end', () => resolve(hash.digest('hex')));
});

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function excerpt(opts) {
  const subtitle = path.resolve(opts.srt || opts.words);
  const raw = await readFile(subtitle, 'utf8');
  const all = opts.srt ? parseSrt(raw) : (JSON.parse(raw).cues || []);
  const cues = windowCues(all, opts.from, opts.to);
  const duration = round3(opts.to - opts.from);
  if (!cues.length) throw Error(`No cue overlaps ${opts.from}–${opts.to} s in ${subtitle}.`);
  const out = path.resolve(opts.out);
  await mkdir(out, { recursive: true });
  const targets = ['words.json', 'excerpt.json', ...(opts.media ? ['narration.wav'] : [])].map(name => path.join(out, name));
  if (!opts.overwrite) for (const file of targets) if (await exists(file)) throw Error(`${file} exists; pass --overwrite to replace it.`);

  const source = { subtitle, subtitle_sha256: await sha256(subtitle), from: opts.from, to: opts.to };
  if (opts.media) {
    const media = path.resolve(opts.media);
    source.media = media;
    source.media_sha256 = await sha256(media);
    await exec('ffmpeg', ['-v', 'error', '-y', '-ss', String(opts.from), '-t', String(duration), '-i', media,
      '-map', '0:a:0', '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', path.join(out, 'narration.wav')]);
  }
  const words = { text: cues.map(c => c.text).join(''), duration, source, cues };
  await writeFile(path.join(out, 'words.json'), JSON.stringify(words, null, 2) + '\n');
  const report = {
    source, duration, cues: cues.length,
    clipped: cues.filter(c => c.clipped).map(c => ({ text: c.text, clipped: c.clipped, source_start: c.source_start, source_end: c.source_end })),
    audio: opts.media ? 'narration.wav: the source audio as it is (a mixed master stays mixed)' : null
  };
  await writeFile(path.join(out, 'excerpt.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    const report = await excerpt(opts);
    for (const c of report.clipped) console.error(`Warning: "${c.text}" (${c.source_start}–${c.source_end} s) crosses the window ${c.clipped === 'both' ? 'on both sides' : `at its ${c.clipped}`}.`);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
