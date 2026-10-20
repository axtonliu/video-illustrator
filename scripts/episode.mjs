#!/usr/bin/env node
// Build a whole explainer from segments: render each segment's scene (reusing any segment whose
// inputs did not change), join them, lay the narration under them, and burn word-by-word captions.
// Plain Node; scripts/render.mjs renders, FFmpeg joins and burns.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { drawtextEscape, findFont } from './footage.mjs';
import { frameCount } from './render.mjs';

const exec = promisify(execFile);
const RENDER = fileURLToPath(new URL('./render.mjs', import.meta.url));

const HELP = `Render, reuse and join an explainer's segments.

node scripts/episode.mjs --config episode.json [--only s3,s4] [--no-captions] [--dry]

episode.json (paths relative to it):
  { "width": 1280, "height": 720, "fps": 30, "scene": "scene/roadster.html",
    "inputs": ["scene/facts.js", "scene/timing.js"],          // files every segment depends on
    "timing": "scene/timing.js",                              // window.TIMING = {id: {dur, lines:[{text,start,end,chars?}]}}
    "segments": [{ "id": "s1", "query": "seg=s1", "audio": "audio/s1.wav",
                   "footage": [{ "clip": "clips/hang.mp4", "lines": [0, 1] },
                               { "clip": "clips/fans.mp4", "lines": [2], "rect": [0.04, 0.2, 0.5, 0.5],
                                 "label": "画面：Tesla 发布会直播" }] }, …],
    "query": "timing=timing-v2.js",                           // optional, appended to every segment's query
    "out": "out" , "captions": { "font": "PingFang SC", "size": 46, "bottom": 0.07, "highlight": "#E0962A" } }

A segment's duration is its timing "dur" (or its audio's length when longer). Each segment is
rendered once per distinct input: the hash covers the scene, every listed input, its query,
size, fps and duration, so changing one line of narration re-renders only that segment.
Writes out/segments/<id>-<hash>.mp4, out/episode-clean.mp4 (no captions, narration mixed),
out/episode.mp4 (captions burned, unless --no-captions), out/captions.ass and out/episode.json.
A segment's "footage" lays real clips (scripts/footage.mjs clip, same size, sound dropped; a clip
cut at another frame rate is resampled to the episode's, so it keeps its speed) over the scene from the start of its first line to the start of the line after its
last (or the segment's end); a clip shorter than its window holds its last frame. The scene
still renders underneath, so it can carry a stand-in for when the footage is withdrawn.
"rect" [x, y, w, h] (fractions of the frame) shows the clip as a card with rounded corners and
a soft shadow instead of full frame, so a real picture and the diagram share the screen; the
scene leaves that area free. "label" writes the source inside the card's lower-left corner. "tag" (full-frame clips) names the
step being shown in the lower left, above the captions.
--dry prints what would be rendered or reused and stops.`;

const sha = buf => createHash('sha256').update(buf).digest('hex');
async function exists(file) { try { await access(file); return true; } catch { return false; } }
const round3 = x => Math.round(x * 1000) / 1000;

export async function readTiming(file) {
  const text = await readFile(file, 'utf8');
  const window = {};
  new Function('window', text)(window);
  if (!window.TIMING) throw Error(`${file} does not set window.TIMING`);
  return window.TIMING;
}

// Footage windows on a segment's own clock: first line's start to the next line's start (or the end).
export function footageWindows(footage, lines, duration) {
  return (footage || []).map(f => {
    const [a, b = a] = f.lines;
    if (!lines[a] || !lines[b] || b < a) throw Error(`footage lines ${JSON.stringify(f.lines)} are outside the segment's ${lines.length} lines`);
    const start = round3(lines[a].start), end = round3(lines[b + 1] ? lines[b + 1].start : duration);
    return { clip: f.clip, start, end, ...(f.rect ? { rect: f.rect } : {}), ...(f.label ? { label: f.label } : {}), ...(f.tag ? { tag: f.tag } : {}) };
  });
}

// Card geometry in whole even pixels.
export function cardBox(rect, width, height) {
  const even = n => Math.max(2, Math.round(n / 2) * 2);
  const [x, y, w, h] = rect;
  return { x: even(x * width), y: even(y * height), w: even(w * width), h: even(h * height), r: even(Math.min(w * width, h * height) * 0.035), pad: even(Math.min(width, height) * 0.03) };
}
// Rounded-rectangle alpha mask (gray) and a soft shadow (RGBA) for one card size, made once each.
const roundedLum = (r, x0, y0, w, h) => `255*lte(hypot(max(max(${x0 + r}-X,X-${x0 + w - 1 - r}),0),max(max(${y0 + r}-Y,Y-${y0 + h - 1 - r}),0)),${r})`;
export async function cardAssets(dir, box) {
  await mkdir(dir, { recursive: true });
  const { w, h, r, pad } = box;
  const mask = path.join(dir, `mask-${w}x${h}-r${r}.png`), shadow = path.join(dir, `shadow-${w}x${h}-r${r}.png`);
  if (!await exists(mask)) await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=black:s=${w}x${h}`, '-vf', `format=gray,geq=lum='${roundedLum(r, 0, 0, w, h)}'`, '-frames:v', '1', mask]);
  if (!await exists(shadow)) {
    const sw = w + 2 * pad, sh = h + 2 * pad;
    await exec('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=0x16202B:s=${sw}x${sh}`, '-f', 'lavfi', '-i', `color=c=black:s=${sw}x${sh}`,
      '-filter_complex', `[1:v]format=gray,geq=lum='${roundedLum(r, pad, pad + Math.round(pad / 3), w, h)}',boxblur=${Math.round(pad / 2)}:2,lutyuv=y='val*0.32'[a];[0:v]format=rgba[c];[c][a]alphamerge`, '-frames:v', '1', shadow]);
  }
  return { mask, shadow };
}

export function overlayArgs({ scene, windows, out, width = 1280, height = 720, font = null, duration = 0, fps = 30 }) {
  const args = ['-v', 'error', '-y', '-i', scene];
  let input = 1;
  const parts = [];
  let last = '0:v';
  windows.forEach((w, k) => {
    // Edges snap to whole frames: a clip that starts between two frames leaves one scene frame showing
    // where two windows meet, which reads as a one-frame flash.
    const f0 = Math.round(w.start * fps), f1 = Math.max(f0 + 1, Math.round(w.end * fps));
    const n = f1 - f0, d = round3(n / fps), end = (f1 - 0.5) / fps;
    const ci = input++;
    args.push('-i', w.file);
    // fps first: the window is counted in episode frames, so a clip cut at another rate is resampled
    // to the episode's rate (dropping or repeating frames) instead of being played slower or faster.
    const timed = `[${ci}:v]fps=${fps},tpad=stop_mode=clone:stop_duration=${d},trim=end_frame=${n},setpts=(N+${f0})/(${fps}*TB)`;
    const on = `enable='between(t,${(f0 - 0.5) / fps},${end})'`;
    if (!w.rect) {
      // A tag names the step being shown, lower left, above where the captions go: a plain label
      // with generous padding, never an accent stripe beside it (aesthetic-rules.md AR-17).
      const ts = Math.round(height * 0.046);
      const tag = w.tag && font ? `,drawtext=fontfile='${drawtextEscape(font)}':text='${drawtextEscape(w.tag)}':fontsize=${ts}:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=${Math.round(ts * 0.45)}:x=${Math.round(width * 0.045 + ts * 0.45)}:y=${Math.round(height * 0.6 + ts * 0.25)}` : '';
      parts.push(`${timed}${tag}[c${k}]`, `[${last}][c${k}]overlay=eof_action=pass:${on}[v${k}]`);
    } else {
      const b = cardBox(w.rect, width, height);
      const mi = input++, si = input++;
      args.push('-loop', '1', '-t', String(duration || end + 1), '-i', w.mask, '-loop', '1', '-t', String(duration || end + 1), '-i', w.shadow);
      const size = Math.round(b.h * 0.05), m = Math.round(b.h * 0.035);
      const text = w.label && font ? `,drawtext=fontfile='${drawtextEscape(font)}':text='${drawtextEscape(w.label)}':fontsize=${size}:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=${Math.round(size * 0.4)}:x=${m}:y=h-th-${m}` : '';
      parts.push(`${timed},scale=${b.w}:${b.h}:force_original_aspect_ratio=increase,crop=${b.w}:${b.h}${text},format=rgba[c${k}]`,
        `[${mi}:v]format=gray[m${k}]`, `[c${k}][m${k}]alphamerge[cm${k}]`,
        `[${last}][${si}:v]overlay=${b.x - b.pad}:${b.y - b.pad}:eof_action=pass:${on}[s${k}]`,
        `[s${k}][cm${k}]overlay=${b.x}:${b.y}:eof_action=pass:${on}[v${k}]`);
    }
    last = `v${k}`;
  });
  args.push('-filter_complex', parts.join(';'), '-map', `[${last}]`, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p');
  if (duration) args.push('-t', String(duration));   // looped card images must not outlast the scene
  args.push('-movflags', '+faststart', out);
  return args;
}

// A clip's frame rate as ffprobe reports it, reduced to a plain number string when whole ("30/1" -> "30").
export async function clipRate(file) {
  const { stdout } = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', file]);
  const [a, b = '1'] = stdout.trim().split('/');
  return Number(b) === 1 ? String(Number(a)) : `${a}/${b}`;
}

async function audioSeconds(file) {
  const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Number(stdout.trim());
}

// Bumped when overlayArgs changes what footage segments look like, so old renders are not reused.
export const OVERLAY_VERSION = 2;
// Bumped when render.mjs changes how many frames a segment gets (frameCount), so old renders are not reused.
export const FRAMES_VERSION = 2;

export function segmentHash({ sceneBytes, inputBytes, query, width, height, fps, duration, footage = [] }) {
  const h = createHash('sha256');
  h.update(sceneBytes);
  for (const b of inputBytes) h.update(sha(b));
  h.update(JSON.stringify({ query, width, height, fps, duration, frames: FRAMES_VERSION }));
  // A clip at the episode's rate looks the same as before the fps step; one at another rate did not
  // (it played at the wrong speed), so its rate goes into the hash and old renders of it are redone.
  if (footage.length) h.update(JSON.stringify({ overlay: OVERLAY_VERSION, windows: footage.map(f => ({ clip: f.sha, start: f.start, end: f.end, rect: f.rect, label: f.label, tag: f.tag, ...(f.rate && f.rate !== String(fps) ? { rate: f.rate } : {}) })) }));
  return h.digest('hex').slice(0, 12);
}

// ASS karaoke: each line is one event; each character (or word) gets a \kf of its spoken length.
const assTime = s => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000), m = Math.floor(cs / 6000) % 60, sec = Math.floor(cs / 100) % 60, c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
};
const assColor = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) throw Error(`Bad colour ${hex}`); const [r, g, b] = [0, 2, 4].map(i => m[1].slice(i, i + 2)); return `&H00${b}${g}${r}`.toUpperCase(); };

const UNIT = /[A-Za-z0-9][A-Za-z0-9.,'%–-]*|\S/g;
export function units(text) {
  // Latin words and numbers stay whole; every other visible character is one unit.
  return text.match(UNIT) || [];
}
// The same units, each marked when the script had a space before it, so captions keep it.
export function spacedUnits(text) {
  return [...text.matchAll(UNIT)].map(m => ({ unit: m[0], space: m.index > 0 && /\s/.test(text[m.index - 1]) }));
}

export function karaokeAss({ width, height, lines, font = 'PingFang SC', size = 46, bottom = 0.07, highlight = '#E0962A', ink = '#16202B', outline = '#FFFFFF', lead = 0.15, footage = {} }) {
  // Dark text with a light outline reads on a light picture; only the word being said takes the
  // accent colour, so the caption never lights up more than one thing at a time. Lines said over
  // real footage (line.footage) flip to light text with a dark outline, which reads on dark video.
  const dark = { ink: '#FFFFFF', outline: '#111827', highlight: '#93C5FD', ...footage };
  const border = Math.max(2, Math.round(size / 12)), margins = `${Math.round(width * 0.08)},${Math.round(width * 0.08)},${Math.round(height * bottom)}`;
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,${font},${size},${assColor(ink)},${assColor(ink)},${assColor(outline)},&H00000000,1,0,0,0,100,100,0,0,1,${border},0,2,${margins},1
Style: CapFootage,${font},${size},${assColor(dark.ink)},${assColor(dark.ink)},${assColor(dark.outline)},&H00000000,1,0,0,0,100,100,0,0,1,${border},0,2,${margins},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const clean = s => s.replace(/[{}\\]/g, '');
  const events = [];
  for (const line of lines) {
    const style = line.footage ? 'CapFootage' : 'Cap';
    const hi = `{\\c${assColor(line.footage ? dark.highlight : highlight)}}`, lo = `{\\c${assColor(line.footage ? dark.ink : ink)}}`;
    const u = units(line.text);
    if (!u.length) continue;
    const starts = line.chars && line.chars.length === u.length ? line.chars : u.map((_, k) => line.start + (line.end - line.start) * k / u.length);
    const spaced = spacedUnits(line.text);
    const joined = k => spaced.map(({ unit, space }, j) => (j > 0 && space ? ' ' : '') + (j === k ? hi + clean(unit) + lo : clean(unit))).join('');
    const show = Math.max(0, line.start - lead);
    if (starts[0] > show) events.push([show, starts[0], style, joined(-1)]);
    u.forEach((_, k) => events.push([starts[k], k + 1 < u.length ? starts[k + 1] : line.end, style, joined(k)]));
    events.push([line.end, line.end + 0.2, style, joined(-1)]);
  }
  return header + events.map(([a, b, st, text]) => `Dialogue: 0,${assTime(a)},${assTime(b)},${st},,0,0,0,,${text}`).join('\n') + '\n';
}

function parse(argv) {
  const opts = { only: null, captions: true, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--no-captions') { opts.captions = false; continue; }
    if (a === '--dry') { opts.dry = true; continue; }
    if (a === '--config' || a === '--only') { if (argv[i + 1] === undefined) throw Error(`Missing value for ${a}`); opts[a.slice(2)] = argv[++i]; continue; }
    throw Error(`Unknown option: ${a}`);
  }
  if (!opts.config) throw Error('--config is required. Use --help.');
  if (opts.only) opts.only = new Set(opts.only.split(','));
  return opts;
}

export async function buildEpisode(opts, log = console.error) {
  const configPath = path.resolve(opts.config);
  const root = path.dirname(configPath);
  const cfg = JSON.parse(await readFile(configPath, 'utf8'));
  const rel = p => path.resolve(root, p);
  const { width = 1280, height = 720, fps = 30 } = cfg;
  const out = rel(cfg.out || 'out');
  await mkdir(path.join(out, 'segments'), { recursive: true });
  const scene = rel(cfg.scene);
  const sceneBytes = await readFile(scene);
  const inputBytes = await Promise.all((cfg.inputs || []).map(p => readFile(rel(p))));
  const timing = await readTiming(rel(cfg.timing));

  const plan = [];
  let offset = 0;
  for (const seg of cfg.segments) {
    const t = timing[seg.id];
    if (!t) throw Error(`timing has no segment ${seg.id}`);
    const audio = seg.audio && await exists(rel(seg.audio)) ? rel(seg.audio) : null;
    const audioLen = audio ? await audioSeconds(audio) : 0;
    const duration = round3(frameCount(Math.max(t.dur, audioLen), fps) / fps);
    const query = [seg.query, cfg.query].filter(Boolean).join('&');
    const footage = await Promise.all(footageWindows(seg.footage, t.lines, duration).map(async w => ({ ...w, file: rel(w.clip), sha: sha(await readFile(rel(w.clip))), rate: await clipRate(rel(w.clip)),
      ...(w.rect ? await cardAssets(path.join(out, 'cards'), cardBox(w.rect, width, height)) : {}) })));
    const hash = segmentHash({ sceneBytes, inputBytes, query, width, height, fps, duration, footage });
    const file = path.join(out, 'segments', `${seg.id}-${hash}.mp4`);
    const reuse = await exists(file);
    plan.push({ id: seg.id, query, duration, hash, file, reuse, footage, audio, audioLen: round3(audioLen), offset: round3(offset), lines: t.lines, estimated: Boolean(t.estimated) });
    offset += duration;
  }
  for (const p of plan) log(`${p.id}  ${p.duration.toFixed(2)} s  ${p.reuse ? 'reuse' : opts.only && !opts.only.has(p.id) ? 'missing (skipped by --only)' : 'render'}  ${path.basename(p.file)}${p.audio ? '' : '  (no narration yet)'}`);
  if (opts.dry) return { plan, dry: true };

  for (const p of plan) {
    if (p.reuse) continue;
    if (opts.only && !opts.only.has(p.id)) throw Error(`${p.id} has no current render; include it in --only or drop --only.`);
    const t0 = Date.now();
    const target = p.footage.length ? p.file.replace(/\.mp4$/, '-scene.mp4') : p.file;
    const { stdout } = await exec(process.execPath, [RENDER, '--input', scene, '--output', target, '--duration', String(p.duration), '--width', String(width), '--height', String(height), '--fps', String(fps), '--query', p.query, '--gpu'], { maxBuffer: 1 << 26 });
    if (p.footage.length) {
      await exec('ffmpeg', overlayArgs({ scene: target, windows: p.footage, out: p.file, width, height, font: await findFont(), duration: p.duration, fps }), { maxBuffer: 1 << 26 });
      await rm(target, { force: true });
    }
    p.render = { ...JSON.parse(stdout).timing, seconds: round3((Date.now() - t0) / 1000) };
    log(`${p.id} rendered in ${p.render.seconds} s`);
  }

  // Join pictures; lay narration (or silence) under each segment at its offset.
  const list = path.join(out, 'segments.txt');
  await writeFile(list, plan.map(p => `file '${p.file.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  const total = round3(plan.reduce((a, p) => a + p.duration, 0));
  const clean = path.join(out, 'episode-clean.mp4');
  const audioInputs = plan.filter(p => p.audio);
  const args = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
  audioInputs.forEach(p => args.push('-i', p.audio));
  if (audioInputs.length) {
    const delays = audioInputs.map((p, k) => `[${k + 1}:a]aresample=48000,adelay=${Math.round(p.offset * 1000)}:all=1[a${k}]`).join(';');
    const mix = audioInputs.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${audioInputs.length}:normalize=0,apad,atrim=0:${total},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
    args.push('-filter_complex', `${delays};${mix}`, '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k');
  } else args.push('-map', '0:v');
  args.push('-c:v', 'copy', '-t', String(total), '-movflags', '+faststart', clean);
  await exec('ffmpeg', args, { maxBuffer: 1 << 26 });

  const result = { width, height, fps, duration: total, clean, segments: plan.map(({ lines, ...p }) => ({ ...p, file: path.relative(out, p.file), audio: p.audio && path.relative(root, p.audio), footage: p.footage.map(({ file, mask, shadow, ...f }) => f) })) };
  if (opts.captions) {
    const onFootage = (p, l) => p.footage.some(w => l.start >= w.start - 0.01 && l.start < w.end);
    const lines = plan.flatMap(p => p.lines.map(l => ({ ...l, footage: onFootage(p, l), start: l.start + p.offset, end: l.end + p.offset, chars: l.chars?.map(c => c + p.offset) })));
    const ass = path.join(out, 'captions.ass');
    await writeFile(ass, karaokeAss({ width, height, lines, ...(cfg.captions || {}) }));
    const burned = path.join(out, 'episode.mp4');
    const escaped = ass.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
    await exec('ffmpeg', ['-v', 'error', '-y', '-i', clean, '-vf', `ass='${escaped}'`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', burned], { maxBuffer: 1 << 26 });
    result.captioned = burned;
    result.captions = ass;
  }
  result.estimated_timing = plan.some(p => p.estimated);
  await writeFile(path.join(out, 'episode.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    const result = await buildEpisode(opts);
    console.log(JSON.stringify(result.dry ? { dry: true } : { duration: result.duration, clean: result.clean, captioned: result.captioned ?? null, estimated_timing: result.estimated_timing }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
