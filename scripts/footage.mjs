#!/usr/bin/env node
// Real footage for an explainer: find candidates with their licences, let a person approve the
// ones whose rights are unclear, download only what is approved, and cut labelled clips.
// Plain Node; yt-dlp downloads YouTube and Internet Archive pages, FFmpeg cuts clips.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const UA = 'video-illustrator footage search (https://github.com/axtonliu/video-illustrator)';

const HELP = `Find, approve, download and cut real footage. Rights stay with the person.

node scripts/footage.mjs search --query "Falcon 9 landing" --candidates candidates.json [--sources commons,archive,youtube] [--limit 8]
node scripts/footage.mjs review --candidates candidates.json --out candidates.html
node scripts/footage.mjs fetch --candidates candidates.json --out footage/ [--include-open]
node scripts/footage.mjs clip --input footage/x.mp4 --from 12 --to 19.5 --label "Footage: Tesla launch event" --out clips/x.mp4 [--audio keep|mute] [--fit contain|cover] [--width 1280 --height 720 --fps 30] [--font /path/font.ttf] [--overwrite]

search   appends candidates (title, page, creator, duration, licence) to candidates.json; it never
         downloads media. Licence class: "open" (stated Creative Commons without NC/ND, or public
         domain), "restricted" (NC/noncommercial or ND/no derivatives), or "unknown" (every
         YouTube result, and anything without a stated licence). Attribution and other terms still apply.
         Each candidate has "approved": null. A person sets it to true or false.
review   writes an HTML page with thumbnails, licences and links for that decision.
fetch    downloads candidates with "approved": true, plus "open" ones when --include-open is
         given, and records file, SHA-256, licence and attribution in footage.json.
clip     cuts [from, to) into the frame size, letterboxed (contain) by default so archive 4:3 is
         not cropped, burns the source label in the top-right corner, and keeps the original
         sound normalized to -17 LUFS, or mutes it.`;

const round3 = x => Math.round(x * 1000) / 1000;
const stripHtml = s => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const OPEN = /(^|\b)(cc[ -]?by|cc[ -]?0|cc-by-sa|creative ?commons|public ?domain|pd[- ]|pdm)/i;

export function licenceClass(name, url) {
  const text = `${name || ''} ${url || ''}`;
  if (/creativecommons\.org|publicdomain/i.test(url || '') || OPEN.test(text)) return /\b(?:nc|nd)\b|non[ -]?commercial|no[ -]?derivatives/i.test(text) ? 'restricted' : 'open';
  return 'unknown';
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': UA } });
  if (!response.ok) throw Error(`${url} → HTTP ${response.status}`);
  return response.json();
}

export function commonsCandidates(json) {
  return Object.values(json?.query?.pages || {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map(page => {
    const info = page.imageinfo?.[0] || {}, meta = info.extmetadata || {};
    const name = stripHtml(meta.LicenseShortName?.value), url = meta.LicenseUrl?.value || '';
    return {
      id: `commons:${page.pageid}`, source: 'commons', title: page.title?.replace(/^File:/, ''),
      page: info.descriptionurl, media: info.url?.split('?')[0], thumb: info.thumburl,
      duration: info.duration ? round3(info.duration) : null, size: info.width ? `${info.width}x${info.height}` : null,
      creator: stripHtml(meta.Artist?.value) || null, credit: stripHtml(meta.Credit?.value) || null,
      licence: { name: name || null, url: url || null, class: licenceClass(name, url) }
    };
  });
}

export function archiveCandidates(json) {
  return (json?.response?.docs || []).map(doc => ({
    id: `archive:${doc.identifier}`, source: 'archive', title: doc.title, page: `https://archive.org/details/${doc.identifier}`,
    media: null, thumb: `https://archive.org/services/img/${doc.identifier}`, duration: null, size: null,
    creator: [].concat(doc.creator || []).join(', ') || null, date: doc.date || null,
    licence: { name: doc.licenseurl ? doc.licenseurl.replace(/^https?:\/\//, '') : null, url: doc.licenseurl || null, class: licenceClass('', doc.licenseurl) }
  }));
}

export function youtubeCandidates(lines) {
  return lines.filter(Boolean).map(line => JSON.parse(line)).map(d => ({
    id: `youtube:${d.id}`, source: 'youtube', title: d.title, page: d.webpage_url || d.url || `https://www.youtube.com/watch?v=${d.id}`,
    media: null, thumb: `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`, duration: d.duration ?? null, size: null,
    creator: d.channel || d.uploader || null,
    // Channel identity, so a person can tell the party's own verified channel from a namesake.
    channel_id: d.channel_id || null, channel_verified: d.channel_is_verified ?? null,
    licence: { name: null, url: null, class: 'unknown', note: 'YouTube does not state reuse rights; copyright stays with the uploader' }
  }));
}

async function search({ query, sources, limit }) {
  const q = encodeURIComponent(query);
  const found = [];
  for (const source of sources) {
    try {
      if (source === 'commons') {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=${limit}&gsrsearch=${encodeURIComponent(query + ' filetype:video')}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=480`;
        found.push(...commonsCandidates(await getJson(url)));
      } else if (source === 'archive') {
        const url = `https://archive.org/advancedsearch.php?q=${q}%20AND%20mediatype%3A%28movies%29&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=licenseurl&fl%5B%5D=creator&fl%5B%5D=date&rows=${limit}&output=json`;
        found.push(...archiveCandidates(await getJson(url)));
      } else if (source === 'youtube') {
        const { stdout } = await exec('yt-dlp', ['--flat-playlist', '--dump-json', '--no-warnings', `ytsearch${limit}:${query}`], { maxBuffer: 1 << 26, timeout: 120000 });
        found.push(...youtubeCandidates(stdout.split('\n')));
      } else throw Error(`Unknown source: ${source}`);
    } catch (error) {
      console.error(`Warning: ${source} search failed: ${error.message}`);
    }
  }
  return found.map(c => ({ ...c, query, approved: null }));
}

// New candidates are appended; one already listed keeps its approval and note.
export function mergeCandidates(existing, found) {
  const items = [...(existing?.items || [])];
  const index = new Map(items.map((c, i) => [c.id, i]));
  for (const c of found) {
    if (index.has(c.id)) continue;
    index.set(c.id, items.length);
    items.push(c);
  }
  return { items };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function reviewHtml(table) {
  const cards = (table.items || []).map(c => `<figure class="${esc(c.licence?.class)}">
  <a href="${esc(c.page)}"><img src="${esc(c.thumb)}" loading="lazy" alt=""></a>
  <figcaption><b>${esc(c.title)}</b><br>${esc(c.source)} · ${esc(c.creator || 'unknown creator')}${c.duration ? ` · ${Math.round(c.duration)} s` : ''}<br>
  licence: <span class="lic">${esc(c.licence?.name || 'not stated')} (${esc(c.licence?.class)})</span><br>
  <code>${esc(c.id)}</code> approved: <b>${c.approved === null ? 'undecided' : esc(c.approved)}</b></figcaption></figure>`).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>Footage candidates</title>
<style>body{font:14px/1.4 system-ui,sans-serif;margin:24px;background:#f6f7f9;color:#111827}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
figure{margin:0;background:#fff;border-radius:8px;padding:8px;border:2px solid #e5e7eb}figure.open{border-color:#15803d}figure.unknown,figure.restricted{border-color:#b45309}
img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;background:#e5e7eb}code{font-size:12px}.lic{color:#374151}</style>
<h1>Footage candidates</h1><p>Green: the source states an open licence. Amber: rights unknown or restricted; set <code>"approved": true</code> in candidates.json only for footage you may use.</p>
<main>
${cards}
</main>
<script>window.renderFrame = () => Promise.all([...document.images].map(i => i.decode().catch(() => {})));</script>
`;
}

async function exists(file) { try { await access(file); return true; } catch { return false; } }
const sha256 = file => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  createReadStream(file).on('error', reject).on('data', d => hash.update(d)).on('end', () => resolve(hash.digest('hex')));
});
const safeName = id => id.replace(/[^a-zA-Z0-9._-]+/g, '_');

export async function fetchApproved({ table, out, includeOpen, download = defaultDownload }) {
  await mkdir(out, { recursive: true });
  const record = [];
  for (const c of table.items || []) {
    // Older candidate files may still label ND material as open. Recheck the stated terms.
    const restricted = licenceClass(c.licence?.name, c.licence?.url) === 'restricted';
    const why = c.approved === true ? 'approved by a person' : includeOpen && c.approved !== false && c.licence?.class === 'open' && !restricted ? 'open licence stated by the source' : null;
    if (!why) continue;
    const file = await download(c, out);
    record.push({ id: c.id, file: path.relative(out, file), sha256: await sha256(file), title: c.title, page: c.page, creator: c.creator ?? null,
      licence: c.licence, why, attribution: [c.title, c.creator, c.licence?.name].filter(Boolean).join(' · ') });
  }
  return record;
}

async function defaultDownload(c, out) {
  const base = path.join(out, safeName(c.id));
  if (c.media) {
    const ext = path.extname(new URL(c.media).pathname) || '.bin';
    const target = base + ext, part = target + '.part';
    const response = await fetch(c.media, { headers: { 'user-agent': UA } });
    if (!response.ok) throw Error(`${c.media} → HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(part));
    await rename(part, target);
    return target;
  }
  await exec('yt-dlp', ['--no-warnings', '--no-playlist', '-f', 'bv*[height<=1080]+ba/b[height<=1080]/b', '--merge-output-format', 'mp4', '-o', base + '.%(ext)s', c.page], { maxBuffer: 1 << 26 });
  const name = (await readdir(out)).find(n => n.startsWith(path.basename(base) + '.') && !n.endsWith('.part'));
  if (!name) throw Error(`yt-dlp produced no file for ${c.id}`);
  return path.join(out, name);
}

export const DEFAULT_FONTS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'];
export const drawtextEscape = s => String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\u2019").replace(/%/g, '\\%');
export async function findFont() { for (const f of DEFAULT_FONTS) if (await exists(f)) return f; return null; }

export function clipArgs({ input, from, to, out, label, audio = 'keep', fit = 'contain', width = 1280, height = 720, fps = 30, font, hasAudio = true }) {
  if (!(to > from)) throw Error('--to must be later than --from.');
  const scale = fit === 'cover'
    ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
    : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;
  const u = Math.min(width, height) / 720;
  const size = Math.round(18 * u), pad = Math.round(10 * u), margin = Math.round(24 * u);
  const text = label ? `,drawtext=fontfile='${drawtextEscape(font)}':text='${drawtextEscape(label)}':fontsize=${size}:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=${pad}:x=w-tw-${margin + pad}:y=${margin + pad}` : '';
  const args = ['-v', 'error', '-y', '-ss', String(from), '-t', String(round3(to - from)), '-i', input,
    '-vf', `${scale},setsar=1,fps=${fps}${text},format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18'];
  if (audio === 'keep' && hasAudio) args.push('-af', 'loudnorm=I=-17:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
  else args.push('-an');
  args.push('-movflags', '+faststart', out);
  return args;
}

function parse(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help') return null;
  const opts = { command, overwrite: false, includeOpen: false };
  const values = new Set(['query', 'candidates', 'sources', 'limit', 'out', 'input', 'from', 'to', 'label', 'audio', 'fit', 'width', 'height', 'fps', 'font']);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    if (a === '--include-open') { opts.includeOpen = true; continue; }
    const key = a.replace(/^--/, '');
    if (!a.startsWith('--') || !values.has(key)) throw Error(`Unknown option: ${a}`);
    if (rest[i + 1] === undefined) throw Error(`Missing value for ${a}`);
    opts[key] = rest[++i];
  }
  return opts;
}

const readTable = async file => (await exists(file)) ? JSON.parse(await readFile(file, 'utf8')) : { items: [] };

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    if (opts.command === 'search') {
      if (!opts.query || !opts.candidates) throw Error('search needs --query and --candidates.');
      const file = path.resolve(opts.candidates);
      const found = await search({ query: opts.query, sources: (opts.sources || 'commons,archive,youtube').split(','), limit: Number(opts.limit || 8) });
      const merged = mergeCandidates(await readTable(file), found);
      await writeFile(file, JSON.stringify(merged, null, 2) + '\n');
      console.log(JSON.stringify({ found: found.length, total: merged.items.length, open: found.filter(c => c.licence.class === 'open').length }, null, 2));
    } else if (opts.command === 'review') {
      if (!opts.candidates || !opts.out) throw Error('review needs --candidates and --out.');
      const out = path.resolve(opts.out);
      if (!opts.overwrite && await exists(out)) throw Error(`${out} exists; pass --overwrite to replace it.`);
      await writeFile(out, reviewHtml(await readTable(path.resolve(opts.candidates))));
      console.log(out);
    } else if (opts.command === 'fetch') {
      if (!opts.candidates || !opts.out) throw Error('fetch needs --candidates and --out.');
      const out = path.resolve(opts.out);
      const record = await fetchApproved({ table: await readTable(path.resolve(opts.candidates)), out, includeOpen: opts.includeOpen });
      const file = path.join(out, 'footage.json');
      const previous = await exists(file) ? JSON.parse(await readFile(file, 'utf8')) : [];
      const merged = [...previous.filter(p => !record.some(r => r.id === p.id)), ...record];
      await writeFile(file, JSON.stringify(merged, null, 2) + '\n');
      console.log(JSON.stringify({ downloaded: record.length, record: file }, null, 2));
    } else if (opts.command === 'clip') {
      for (const key of ['input', 'from', 'to', 'out']) if (opts[key] === undefined) throw Error(`clip needs --${key}.`);
      const out = path.resolve(opts.out);
      if (!opts.overwrite && await exists(out)) throw Error(`${out} exists; pass --overwrite to replace it.`);
      let font = opts.font;
      if (opts.label && !font) for (const f of DEFAULT_FONTS) if (await exists(f)) { font = f; break; }
      if (opts.label && !font) throw Error('No font found for the label; pass --font.');
      const probe = await exec('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', path.resolve(opts.input)]);
      await mkdir(path.dirname(out), { recursive: true });
      await exec('ffmpeg', clipArgs({ input: path.resolve(opts.input), from: Number(opts.from), to: Number(opts.to), out, label: opts.label, audio: opts.audio || 'keep', fit: opts.fit || 'contain',
        width: Number(opts.width || 1280), height: Number(opts.height || 720), fps: Number(opts.fps || 30), font, hasAudio: probe.stdout.trim() !== '' }), { maxBuffer: 1 << 24 });
      console.log(out);
    } else throw Error(`Unknown command: ${opts.command}. Use --help.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
