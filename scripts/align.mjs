#!/usr/bin/env node
// Line and word times for narration that follows a written script: transcribe each segment's
// audio with a local Whisper, then align the recognized characters to the script's own text,
// so captions and picture beats use the script's wording and the speech's timing.
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { units } from './episode.mjs';

const exec = promisify(execFile);

const HELP = `Align narration audio to the script.
(Small Whisper models can stop transcribing partway through a segment; turbo is the default.)

node scripts/align.mjs --config episode.json --script script.md --out scene/timing.js [--master narration.mp3] [--model turbo] [--language zh] [--whisper whisper]

script.md: "## <segment id> title" starts a segment; every other non-empty line is one spoken
line, except lines starting with ">" (picture notes) and "#"; {f:<id>} fact citations are dropped.
Each segment in episode.json with an existing "audio" file is transcribed by the local Whisper
CLI (word timestamps) and aligned character by character to its script lines. Writes
window.TIMING = {<id>: {dur, lines:[{text, start, end, chars, match}]}} where chars holds one
start time per caption unit (scripts/episode.mjs units) and match is the share of the line's
characters the recognizer confirmed. Segments without audio keep an estimate (estimated: true).
Lines confirmed below 60% are listed as warnings: listen to them.
--master takes the whole narration recorded in one take: it is transcribed once, aligned to the
full script, cut in the pause between each segment's last line and the next segment's first line,
and written to each segment's "audio" path (wav) before the per-segment alignment above.`;

const round3 = x => Math.round(x * 1000) / 1000;
const norm = ch => ch.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function scriptSegments(md) {
  const out = {};
  let cur = null;
  for (const raw of md.split('\n')) {
    const m = /^##\s+(\S+)/.exec(raw);
    if (m) { cur = m[1]; out[cur] = []; continue; }
    const line = raw.trim();
    if (!cur || !line || line.startsWith('>') || line.startsWith('#')) continue;
    const text = line.replace(/\s*\{f:[^}]+\}/g, '').trim();
    if (text) out[cur].push(text);
  }
  return out;
}

// Recognized words → a character stream with times (a word's span is shared evenly by its characters).
export function recognizedChars(words) {
  const chars = [];
  for (const w of words) {
    const cs = [...w.word].map(norm).filter(Boolean);
    cs.forEach((c, k) => chars.push({ c, t: w.start + (w.end - w.start) * k / cs.length, end: w.end }));
  }
  return chars;
}

// Longest common subsequence between script characters and recognized characters.
export function lcsPairs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return pairs;
}

export function alignLines(lines, words, duration) {
  const rec = recognizedChars(words);
  // Script characters, each pointing back to its line and caption unit.
  const flat = [];
  lines.forEach((text, li) => units(text).forEach((u, ui) => [...u].map(norm).filter(Boolean).forEach(c => flat.push({ c, li, ui }))));
  const pairs = lcsPairs(flat.map(x => x.c), rec.map(x => x.c));
  const time = new Array(flat.length).fill(null);
  for (const [i, j] of pairs) time[i] = rec[j].t;
  // Fill gaps by interpolating between confirmed neighbours (start of audio and its end bound them).
  const first = rec.length ? rec[0].t : 0, last = rec.length ? rec[rec.length - 1].end : duration;
  for (let i = 0; i < flat.length; i++) {
    if (time[i] !== null) continue;
    let p = i - 1; while (p >= 0 && time[p] === null) p--;
    let q = i + 1; while (q < flat.length && time[q] === null) q++;
    const t0 = p >= 0 ? time[p] : first, t1 = q < flat.length ? time[q] : last;
    const i0 = p >= 0 ? p : -1, i1 = q < flat.length ? q : flat.length;
    time[i] = t0 + (t1 - t0) * (i - i0) / (i1 - i0);
  }
  const matched = new Set(pairs.map(([i]) => i));
  return lines.map((text, li) => {
    const idx = flat.map((x, i) => [x, i]).filter(([x]) => x.li === li);
    const us = units(text);
    const chars = us.map((_, ui) => { const hit = idx.find(([x]) => x.ui === ui); return hit ? round3(time[hit[1]]) : null; });
    for (let k = 0; k < chars.length; k++) if (chars[k] === null) chars[k] = k ? chars[k - 1] : (idx[0] ? round3(time[idx[0][1]]) : 0);
    const next = flat.findIndex(x => x.li === li + 1);
    const lastIdx = idx.length ? idx[idx.length - 1][1] : 0;
    const recEnd = rec.find((r, j) => pairs.some(([i, jj]) => i === lastIdx && jj === j));
    const end = recEnd ? recEnd.end : next >= 0 ? time[next] - 0.05 : last;
    const match = idx.length ? idx.filter(([, i]) => matched.has(i)).length / idx.length : 0;
    return { text, start: chars[0], end: round3(Math.max(end, chars[chars.length - 1] + 0.1)), chars, match: round3(match) };
  });
}

// Where to cut one take into segments: halfway through the pause between one segment's last line
// and the next segment's first line, on a line alignment of the whole script.
export function splitPoints(counts, aligned, duration) {
  const cuts = [];
  let k = 0;
  counts.forEach((n, s) => {
    const first = aligned[k], last = aligned[k + n - 1], next = aligned[k + n];
    const from = s === 0 ? 0 : cuts[s - 1].to;
    const to = next ? round3((last.end + next.start) / 2) : round3(duration);
    cuts.push({ from, to, first: first.start, last: last.end, match: round3(aligned.slice(k, k + n).reduce((a, l) => a + l.match, 0) / n) });
    k += n;
  });
  return cuts;
}

async function whisperWords(audio, { model, language, whisper }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'vi-align-'));
  try {
    await exec(whisper, [audio, '--model', model, '--language', language, '--word_timestamps', 'True', '--output_format', 'json', '--output_dir', dir, '--verbose', 'False', '--fp16', 'False', ...(language === 'zh' ? ['--initial_prompt', '以下是普通话的句子。'] : [])], { maxBuffer: 1 << 26 });
    const json = JSON.parse(await readFile(path.join(dir, path.basename(audio).replace(/\.[^.]+$/, '') + '.json'), 'utf8'));
    return json.segments.flatMap(s => s.words || []).map(w => ({ word: w.word.trim(), start: w.start, end: w.end }));
  } finally { await rm(dir, { recursive: true, force: true }); }
}

async function exists(f) { try { await access(f); return true; } catch { return false; } }
const estimate = lines => {
  let t = 0.3;
  const out = lines.map(text => { const d = units(text).length / 4.1; const l = { text, start: round3(t), end: round3(t + d) }; t += d + 0.3; return l; });
  return { dur: round3(t + 0.5), lines: out, estimated: true };
};

function parse(argv) {
  const opts = { model: 'turbo', language: 'zh', whisper: 'whisper' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    const key = a.replace(/^--/, '');
    if (!['config', 'script', 'out', 'master', 'model', 'language', 'whisper'].includes(key) || argv[i + 1] === undefined) throw Error(`Bad option: ${a}`);
    opts[key] = argv[++i];
  }
  for (const k of ['config', 'script', 'out']) if (!opts[k]) throw Error(`--${k} is required. Use --help.`);
  return opts;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    const cfgPath = path.resolve(opts.config), root = path.dirname(cfgPath);
    const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
    const segs = scriptSegments(await readFile(path.resolve(opts.script), 'utf8'));
    const timing = {}, warnings = [];
    if (opts.master) {
      const master = path.resolve(opts.master);
      const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', master]);
      const counts = cfg.segments.map(seg => { if (!segs[seg.id]) throw Error(`script has no segment ${seg.id}`); if (!seg.audio) throw Error(`segment ${seg.id} has no "audio" path to write`); return segs[seg.id].length; });
      const aligned = alignLines(cfg.segments.flatMap(seg => segs[seg.id]), await whisperWords(master, opts), Number(stdout.trim()));
      const cuts = splitPoints(counts, aligned, Number(stdout.trim()));
      for (const [s, seg] of cfg.segments.entries()) {
        const c = cuts[s];
        await exec('ffmpeg', ['-v', 'error', '-y', '-i', master, '-ss', String(c.from), '-to', String(c.to), '-ac', '1', '-ar', '48000', path.resolve(root, seg.audio)]);
        console.error(`${seg.id}: ${c.from}–${c.to} s from the take, match ${c.match}`);
        if (c.match < 0.8) warnings.push({ segment: seg.id, split: c });
      }
    }
    for (const seg of cfg.segments) {
      const lines = segs[seg.id];
      if (!lines) throw Error(`script has no segment ${seg.id}`);
      const audio = seg.audio && path.resolve(root, seg.audio);
      if (!audio || !await exists(audio)) { timing[seg.id] = estimate(lines); continue; }
      const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]);
      const duration = Number(stdout.trim());
      const aligned = alignLines(lines, await whisperWords(audio, opts), duration);
      for (const l of aligned) if (l.match < 0.6) warnings.push({ segment: seg.id, line: l.text, match: l.match });
      timing[seg.id] = { dur: round3(duration + 0.4), lines: aligned };
      console.error(`${seg.id}: ${aligned.length} lines, mean match ${round3(aligned.reduce((a, l) => a + l.match, 0) / aligned.length)}`);
    }
    await writeFile(path.resolve(opts.out), '// Written by scripts/align.mjs.\nwindow.TIMING = ' + JSON.stringify(timing, null, 1) + ';\n');
    console.log(JSON.stringify({ out: path.resolve(opts.out), warnings }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
