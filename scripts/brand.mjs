#!/usr/bin/env node
// Brand pack check and brand sheet. A brand pack is a folder holding brand.json and the files it
// names; a single v1 brand.json is still a valid pack. See references/brand.md.
import { mkdtemp, readFile, readdir, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleanupSync, render } from './render.mjs';

export const SCHEMA_V2 = 'video-illustrator.brand.v2';

const HELP = `Check a brand pack, or render its brand sheet.

node scripts/brand.mjs --check <pack-folder | brand.json> [--tokens upstream.json]
node scripts/brand.mjs --sheet <pack-folder | brand.json> --out sheet.png [--overwrite] [--tokens upstream.json]
node scripts/brand.mjs --which <project-folder>

--check prints JSON {ok, schema, errors, warnings} and exits 1 when there is an error.
Errors are reserved for input that cannot be used safely: brand.json does not parse, an
unknown "schema", a file it names does not exist, an invalid hex colour, palette_scope "film"
without ground/ink/accent, accent_rules.max_area outside (0, 1]. Everything else is a
warning: shapes that authors will ignore, low contrast, a font without a licence file,
palette_sources that do not match the upstream tokens. Whether a film keeps the accent
rules or the forbid list is judged by the reviewer (AR-16), never here.
--tokens names an upstream design-token JSON; each palette_sources entry ("name" or
"name(mode)") is looked up there and compared with the palette value (warning on mismatch).
--sheet runs the check, refuses on errors, then renders one PNG (1920 wide) with the palette,
type scale, motifs, accent do and don't, motion and the forbid list, plus the end card
template when the pack has one. It uses scripts/render.mjs (Playwright Chromium).
--which prints {source, pack}: the pack a project uses. <project>/inputs/brand first; without it
the user's default pack, $VIDEO_ILLUSTRATOR_BRAND if set (exit 1 when it does not exist), else
~/.config/video-illustrator/brand/ when it exists; else source "none".
rules_docs (v2) lists the user's own rule documents (absolute, ~/ or pack-relative paths); the
author reads them live before designing. A listed file that does not exist is an error.`;

const V1_FIELDS = ['display_name', 'palette', 'fonts', 'logo', 'making_of'];
const V2_FIELDS = ['schema', 'palette_sources', 'palette_scope', 'accent_rules', 'type_scale', 'motion', 'motifs', 'sound', 'endcard', 'forbid', 'references', 'rules_docs'];
const PALETTE_ROLES = { v1: ['primary', 'accent', 'ground', 'ink'], v2: ['ground', 'surface', 'ink', 'ink_secondary', 'primary', 'accent'] };
const FILM_REQUIRED = ['ground', 'ink', 'accent'];
const FONT_ROLES = { v1: ['display', 'body'], v2: ['display', 'body', 'mono'] };
const TYPE_LEVELS = ['hero', 'title', 'body', 'micro'];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const LICENSE_FILE = /^(ofl|license|licence|copying)|licen[cs]e/i;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim() !== '';
const fraction = value => typeof value === 'number' && Number.isFinite(value);

// ---------- colour ----------

export function normalizeHex(value) {
  const hex = value.slice(1).toLowerCase();
  return '#' + (hex.length === 3 ? [...hex].map(c => c + c).join('') : hex);
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(normalizeHex(hex).slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Largest y of a CSS cubic-bezier (x1, x2 in [0, 1]); above 1 means the curve overshoots.
export function bezierMaxY(y1, y2) {
  let max = 0;
  for (let i = 0; i <= 2000; i++) { const u = i / 2000; max = Math.max(max, 3 * y1 * (1 - u) ** 2 * u + 3 * y2 * (1 - u) * u * u + u ** 3); }
  return max;
}

// ---------- upstream tokens ----------

// "name" or "name(mode)". A token is a hex string, or an object with value/$value or per-mode keys.
export function resolveToken(tokens, source) {
  const match = /^\s*([^()]+?)\s*(?:\(\s*([^()]+?)\s*\))?\s*$/.exec(String(source));
  if (!match) return { error: `cannot read "${source}"` };
  const [, name, mode] = match;
  const tables = [tokens?.tokens, tokens].filter(isObject);
  let entry;
  for (const table of tables) {
    if (name in table) { entry = table[name]; break; }
    let node = table;
    for (const part of name.split('.')) node = isObject(node) ? node[part] : undefined;
    if (node !== undefined) { entry = node; break; }
  }
  if (entry === undefined) return { error: `token "${name}" not found` };
  const pick = value => (typeof value === 'string' && HEX.test(value) ? { value: normalizeHex(value) } : null);
  if (typeof entry === 'string') return pick(entry) || { error: `token "${name}" is not a hex colour` };
  if (!isObject(entry)) return { error: `token "${name}" is not a colour` };
  if (mode) {
    const key = Object.keys(entry).find(k => k.toLowerCase() === mode.toLowerCase());
    return (key && pick(entry[key])) || { error: `token "${name}" has no hex value for mode "${mode}"` };
  }
  const direct = pick(entry.value) || pick(entry.$value);
  if (direct) return direct;
  const modes = [...new Set(Object.values(entry).map(v => (typeof v === 'string' && HEX.test(v) ? normalizeHex(v) : null)).filter(Boolean))];
  if (modes.length === 1) return { value: modes[0] };
  return { error: `token "${name}" has ${modes.length ? 'several mode values' : 'no hex value'}; name the mode, e.g. "${name}(dark)"` };
}

// ---------- check ----------

async function kind(file) {
  try { const info = await stat(file); return info.isDirectory() ? 'dir' : 'file'; } catch { return null; }
}

async function locate(target) {
  const resolved = path.resolve(target);
  const found = await kind(resolved);
  if (!found) throw Error(`Not found: ${resolved}`);
  const file = found === 'dir' ? path.join(resolved, 'brand.json') : resolved;
  if (await kind(file) !== 'file') throw Error(`No brand.json in ${resolved}`);
  const real = await realpath(file);
  return { file: real, dir: path.dirname(real) };
}

export async function checkBrand(target, { tokens } = {}) {
  const { file, dir } = await locate(target);
  const errors = [];
  const warnings = [];
  const error = (code, field, message) => errors.push({ code, field, message });
  const warn = (code, field, message) => warnings.push({ code, field, message });
  const result = () => ({ file, dir, schema: brand && brand.schema === SCHEMA_V2 ? SCHEMA_V2 : 'v1 (no schema)', ok: errors.length === 0, errors, warnings });

  let brand = null;
  try { brand = JSON.parse(await readFile(file, 'utf8')); } catch (e) {
    error('json_parse', '', `brand.json does not parse: ${e.message}`);
    return { ...result(), brand: null };
  }
  if (!isObject(brand)) {
    error('json_parse', '', 'brand.json must be a JSON object');
    brand = null;
    return { ...result(), brand: null };
  }
  if ('schema' in brand && brand.schema !== SCHEMA_V2) {
    error('schema_unknown', 'schema', `unknown schema ${JSON.stringify(brand.schema)}; expected "${SCHEMA_V2}" (or no schema for v1)`);
    return { ...result(), brand };
  }
  const v2 = brand.schema === SCHEMA_V2;
  const version = v2 ? 'v2' : 'v1';

  for (const key of Object.keys(brand)) {
    if (key.startsWith('$')) continue;
    if (V1_FIELDS.includes(key)) continue;
    if (V2_FIELDS.includes(key)) { if (!v2) warn('v2_field_in_v1', key, `"${key}" is a v2 field but there is no "schema": "${SCHEMA_V2}"; the file is read as v1 and the field is ignored`); continue; }
    warn('unknown_field', key, `unknown field "${key}"; authors ignore it`);
  }

  // Files the pack names. Missing files are errors; paths leaving the pack are warnings.
  const files = [];
  const rulesDocs = [];
  const needFile = async (field, relative, { directory = false } = {}) => {
    if (!isText(relative)) { warn('path_invalid', field, `${field} must be a relative path string`); return null; }
    const full = path.resolve(dir, relative);
    const found = await kind(full);
    if (!found) { error('file_missing', field, `${field} names ${relative}, which does not exist in ${dir}`); return null; }
    if (directory && found !== 'dir') { warn('path_invalid', field, `${field} must be a folder`); return null; }
    if (!directory && found !== 'file') { warn('path_invalid', field, `${field} must be a file`); return null; }
    const real = await realpath(full);
    if (real !== dir && !real.startsWith(dir + path.sep)) warn('path_outside_pack', field, `${relative} lies outside the pack folder; copy it in so the pack travels as one folder`);
    files.push({ field, path: real });
    return real;
  };

  // display_name / making_of (v1 rules, unchanged)
  if (!isText(brand.display_name)) warn('display_name_missing', 'display_name', 'no display_name: credits and the end card show no author name (never invent one)');
  if ('making_of' in brand && typeof brand.making_of !== 'string') warn('making_of_invalid', 'making_of', 'making_of must be a string');

  // palette
  const palette = {};
  if ('palette' in brand) {
    if (!isObject(brand.palette)) warn('palette_invalid', 'palette', 'palette must be an object of hex colours');
    else for (const [role, value] of Object.entries(brand.palette)) {
      if (typeof value !== 'string' || !HEX.test(value)) { error('hex_invalid', `palette.${role}`, `palette.${role} = ${JSON.stringify(value)} is not a hex colour (#rgb or #rrggbb)`); continue; }
      palette[role] = normalizeHex(value);
      if (!PALETTE_ROLES[version].includes(role)) warn('palette_role_unknown', `palette.${role}`, `"${role}" is not a ${version} palette role (${PALETTE_ROLES[version].join(', ')}); authors may ignore it`);
    }
  }

  let scope = 'credits';
  if (v2) {
    if ('palette_scope' in brand) {
      if (brand.palette_scope === 'film' || brand.palette_scope === 'credits') scope = brand.palette_scope;
      else warn('palette_scope_unknown', 'palette_scope', `palette_scope ${JSON.stringify(brand.palette_scope)} is neither "credits" nor "film"; read as "credits"`);
    }
    if (scope === 'film') {
      const missing = FILM_REQUIRED.filter(role => !palette[role] && !(isObject(brand.palette) && role in brand.palette));
      if (missing.length) error('film_palette_incomplete', 'palette', `palette_scope "film" needs palette.${missing.join(', palette.')}`);
    }
  }

  // contrast on the ground (legibility proxy, warning only)
  if (palette.ground) {
    for (const [role, minimum] of [['ink', 4.5], ['ink_secondary', 3], ['accent', 3]]) {
      if (!palette[role]) continue;
      const ratio = contrast(palette[role], palette.ground);
      if (ratio < minimum) warn('contrast_low', `palette.${role}`, `${role} on ground has contrast ${ratio.toFixed(2)}:1, below ${minimum}:1`);
    }
  }

  // fonts
  if ('fonts' in brand) {
    if (!isObject(brand.fonts)) warn('font_invalid', 'fonts', 'fonts must be an object of roles');
    else for (const [role, font] of Object.entries(brand.fonts)) {
      const field = `fonts.${role}`;
      if (!FONT_ROLES[version].includes(role)) warn('font_role_unknown', field, `"${role}" is not a ${version} font role (${FONT_ROLES[version].join(', ')})`);
      if (!isObject(font)) { warn('font_invalid', field, `${field} must be {family, file?, license?}`); continue; }
      if (!isText(font.family)) warn('font_invalid', `${field}.family`, `${field}.family is missing`);
      const fontFile = 'file' in font ? await needFile(`${field}.file`, font.file) : null;
      if ('license' in font) await needFile(`${field}.license`, font.license);
      else if (fontFile) {
        const siblings = await readdir(path.dirname(fontFile)).catch(() => []);
        if (!siblings.some(name => LICENSE_FILE.test(name))) warn('font_license_missing', field, `no licence file next to ${font.file}; add one (for example OFL.txt) or a "license" path before sharing the pack`);
      }
    }
  }

  if ('logo' in brand) await needFile('logo', brand.logo);

  if (v2) {
    // palette_sources (provenance only)
    if ('palette_sources' in brand) {
      if (!isObject(brand.palette_sources)) warn('palette_sources_invalid', 'palette_sources', 'palette_sources must map palette roles to token names');
      else for (const [role, source] of Object.entries(brand.palette_sources)) {
        const field = `palette_sources.${role}`;
        if (!(role in palette)) { warn('palette_source_unknown_role', field, `palette has no "${role}"`); continue; }
        if (!isText(source)) { warn('palette_sources_invalid', field, `${field} must be a token name`); continue; }
        if (!tokens) continue;
        const found = resolveToken(tokens, source);
        if (found.error) warn('palette_source_unresolved', field, `${source}: ${found.error}`);
        else if (found.value !== palette[role]) warn('palette_source_mismatch', field, `palette.${role} is ${palette[role]} but upstream ${source} is ${found.value}`);
      }
    }

    // accent_rules
    if ('accent_rules' in brand) {
      const rules = brand.accent_rules;
      if (!isObject(rules)) warn('accent_rules_invalid', 'accent_rules', 'accent_rules must be an object');
      else {
        if ('max_area' in rules && !(fraction(rules.max_area) && rules.max_area > 0 && rules.max_area <= 1)) {
          error('accent_max_area_range', 'accent_rules.max_area', `accent_rules.max_area = ${JSON.stringify(rules.max_area)} must be a number in (0, 1]`);
        }
        if ('per_frame' in rules && !(Number.isInteger(rules.per_frame) && rules.per_frame > 0)) warn('accent_rules_invalid', 'accent_rules.per_frame', 'per_frame must be a positive integer');
        for (const key of ['forms', 'never']) {
          if (key in rules && !(Array.isArray(rules[key]) && rules[key].every(isText))) warn('accent_rules_invalid', `accent_rules.${key}`, `${key} must be a list of short phrases`);
        }
        if (Array.isArray(rules.forms) && Array.isArray(rules.never)) {
          const never = new Set(rules.never.map(s => String(s).toLowerCase()));
          const both = rules.forms.filter(s => never.has(String(s).toLowerCase()));
          if (both.length) warn('accent_rules_conflict', 'accent_rules', `listed in both forms and never: ${both.join(', ')}`);
        }
        if (!palette.accent) warn('accent_rules_without_accent', 'accent_rules', 'accent_rules without palette.accent');
      }
    }

    // type_scale
    if ('type_scale' in brand) {
      const scale = brand.type_scale;
      if (!isObject(scale)) warn('type_scale_invalid', 'type_scale', 'type_scale must map levels to fractions of the frame height');
      else {
        for (const [level, value] of Object.entries(scale)) {
          if (!(fraction(value) && value > 0 && value < 1)) warn('type_scale_invalid', `type_scale.${level}`, `type_scale.${level} must be a fraction of the frame height in (0, 1)`);
        }
        const known = TYPE_LEVELS.filter(level => fraction(scale[level]));
        for (let i = 1; i < known.length; i++) {
          if (scale[known[i]] >= scale[known[i - 1]]) warn('type_scale_order', `type_scale.${known[i]}`, `${known[i]} (${scale[known[i]]}) is not smaller than ${known[i - 1]} (${scale[known[i - 1]]})`);
        }
      }
    }

    // motion: the style-card token fields
    if ('motion' in brand) checkMotion(brand.motion, warn);

    // motifs
    if ('motifs' in brand) {
      if (!Array.isArray(brand.motifs)) warn('motif_invalid', 'motifs', 'motifs must be a list');
      else {
        const ids = new Set();
        const never = Array.isArray(brand.accent_rules?.never) ? brand.accent_rules.never.join(' ').toLowerCase() : '';
        for (const [k, motif] of brand.motifs.entries()) {
          const field = `motifs[${k}]`;
          if (!isObject(motif)) { warn('motif_invalid', field, `${field} must be {id, what, use_when, file}`); continue; }
          for (const key of ['id', 'what', 'use_when']) if (!isText(motif[key])) warn('motif_invalid', `${field}.${key}`, `${field}.${key} is missing`);
          if (isText(motif.id)) { if (ids.has(motif.id)) warn('motif_invalid', `${field}.id`, `duplicate motif id "${motif.id}"`); ids.add(motif.id); }
          if (!('file' in motif)) { warn('motif_invalid', `${field}.file`, `${field}.file is missing`); continue; }
          const motifFile = await needFile(`${field}.file`, motif.file);
          if (!motifFile || !/\.svg$/i.test(motifFile)) continue;
          const svg = await readFile(motifFile, 'utf8');
          if (!/<svg[\s>]/i.test(svg)) warn('motif_invalid', `${field}.file`, `${motif.file} has no <svg> element`);
          if (/<script[\s>]/i.test(svg) || /\son\w+\s*=/i.test(svg)) warn('motif_script', `${field}.file`, `${motif.file} contains script; the sheet strips it and scenes should not inline it`);
          if (/gradient/.test(never) && /<(linear|radial)Gradient[\s>]/i.test(svg)) warn('motif_forbidden_effect', `${field}.file`, `${motif.file} uses an SVG gradient while accent_rules.never lists gradient`);
          if (/glow|blur/.test(never) && /<filter[\s>]/i.test(svg)) warn('motif_forbidden_effect', `${field}.file`, `${motif.file} uses an SVG filter while accent_rules.never lists glow`);
        }
      }
    }

    // sound (logo may stay empty)
    if ('sound' in brand) {
      const sound = brand.sound;
      if (!isObject(sound)) warn('sound_invalid', 'sound', 'sound must be an object');
      else {
        for (const key of Object.keys(sound)) if (!['logo', 'music_prompt', 'sfx_dir'].includes(key)) warn('unknown_field', `sound.${key}`, `unknown field "sound.${key}"`);
        for (const key of ['logo', 'music_prompt']) {
          if (sound[key] === null || sound[key] === '' || !(key in sound)) continue;
          await needFile(`sound.${key}`, sound[key]);
        }
        if (sound.sfx_dir !== null && sound.sfx_dir !== '' && 'sfx_dir' in sound) await needFile('sound.sfx_dir', sound.sfx_dir, { directory: true });
      }
    }

    // endcard
    if ('endcard' in brand && brand.endcard !== null && brand.endcard !== '') {
      const endcard = await needFile('endcard', brand.endcard);
      if (endcard && !(await readFile(endcard, 'utf8')).includes('renderFrame')) warn('endcard_no_render_frame', 'endcard', `${brand.endcard} does not define renderFrame(t); render.mjs cannot render it on its own`);
    }

    // forbid
    if ('forbid' in brand && !(Array.isArray(brand.forbid) && brand.forbid.every(isText))) warn('forbid_invalid', 'forbid', 'forbid must be a list of short, checkable phrases');

    // references
    if ('references' in brand) {
      if (!Array.isArray(brand.references)) warn('references_invalid', 'references', 'references must be a list of {url, learn, avoid}');
      else brand.references.forEach((ref, k) => {
        for (const key of ['url', 'learn', 'avoid']) if (!isObject(ref) || !isText(ref[key])) warn('references_invalid', `references[${k}].${key}`, `references[${k}].${key} is missing`);
      });
    }

    // rules_docs: the user's own rule documents, read live (never copied), so they may sit anywhere.
    if ('rules_docs' in brand) {
      if (!Array.isArray(brand.rules_docs)) warn('rules_docs_invalid', 'rules_docs', 'rules_docs must be a list of paths to documents the author reads before designing');
      else for (const [k, doc] of brand.rules_docs.entries()) {
        const field = `rules_docs[${k}]`;
        if (!isText(doc)) { warn('path_invalid', field, `${field} must be a path string`); continue; }
        const full = doc.startsWith('~/') ? path.join(homedir(), doc.slice(2)) : path.resolve(dir, doc);
        const found = await kind(full);
        if (!found) { error('file_missing', field, `${field} names ${doc}, which does not exist`); continue; }
        if (found !== 'file') { warn('path_invalid', field, `${field} must be a file`); continue; }
        rulesDocs.push(full);
        files.push({ field, path: await realpath(full) });
      }
    }
  }

  return { ...result(), brand, scope, files, rules_docs: rulesDocs };
}

// The pack a project uses: its own inputs/brand, else the user's default pack.
export async function findBrandPack(project, { env = process.env, home = homedir() } = {}) {
  const own = path.resolve(project, 'inputs/brand');
  if (await kind(own)) return { source: 'project', pack: own };
  if (isText(env.VIDEO_ILLUSTRATOR_BRAND)) {
    const set = path.resolve(env.VIDEO_ILLUSTRATOR_BRAND);
    if (!(await kind(set))) throw Error(`VIDEO_ILLUSTRATOR_BRAND names ${set}, which does not exist`);
    return { source: 'env', pack: set };
  }
  const user = path.join(home, '.config/video-illustrator/brand');
  if (await kind(user)) return { source: 'user', pack: user };
  return { source: 'none', pack: null };
}

function checkMotion(motion, warn) {
  const bad = (field, message) => warn('motion_invalid', `motion.${field}`, message);
  const odd = (field, message) => warn('motion_inconsistent', `motion.${field}`, message);
  if (!isObject(motion)) return bad('', 'motion must be an object with the style-card token fields');
  const known = ['cadence', 'enter', 'exit', 'ease', 'overshoot', 'squash', 'reading_hold', 'end_hold'];
  for (const key of Object.keys(motion)) if (!known.includes(key)) bad(key, `unknown motion field "${key}" (fields: ${known.join(', ')})`);
  if ('cadence' in motion && !(typeof motion.cadence === 'string' && /^(on [123]s|\d+ fps stepped)$/.test(motion.cadence))) bad('cadence', 'cadence must be "on 1s", "on 2s", "on 3s" or "N fps stepped"');
  const range = key => {
    if (!(key in motion)) return null;
    const r = motion[key];
    if (Array.isArray(r) && r.length === 2 && r.every(n => Number.isInteger(n) && n > 0) && r[0] <= r[1]) return r;
    bad(key, `${key} must be [min, max] whole frames at 30 fps, min <= max`);
    return null;
  };
  const enter = range('enter'), exit = range('exit');
  if (enter && exit && exit[1] > enter[1]) odd('exit', 'an exit is slower than the slowest entrance');
  let easeIn = null;
  if ('ease' in motion) {
    const curve = key => {
      const c = motion.ease?.[key];
      if (Array.isArray(c) && c.length === 4 && c.every(Number.isFinite) && c[0] >= 0 && c[0] <= 1 && c[2] >= 0 && c[2] <= 1) return c;
      bad(`ease.${key}`, `ease.${key} must be cubic-bezier [x1, y1, x2, y2] with x1 and x2 in [0, 1]`);
      return null;
    };
    if (!isObject(motion.ease)) bad('ease', 'ease must be {"in": [x1, y1, x2, y2], "out": [...]}');
    else { easeIn = curve('in'); curve('out'); }
  }
  const bound = key => {
    if (!(key in motion)) return undefined;
    const v = motion[key];
    if (v === 'none') return null;
    if (fraction(v) && v > 0 && v <= 0.3) return v;
    bad(key, `${key} must be "none" or a share in (0, 0.3]`);
    return undefined;
  };
  const overshoot = bound('overshoot');
  bound('squash');
  if (easeIn && overshoot !== undefined) {
    const over = bezierMaxY(easeIn[1], easeIn[3]) - 1;
    if (overshoot === null && over > 1e-4) odd('overshoot', `overshoot "none" but ease.in passes its target by ${(over * 100).toFixed(1)}%`);
    if (overshoot !== null && over > overshoot + 1e-4) odd('overshoot', `ease.in overshoots by ${(over * 100).toFixed(1)}%, more than the declared ${overshoot * 100}%`);
  }
  for (const key of ['reading_hold', 'end_hold']) if (key in motion && !(fraction(motion[key]) && motion[key] > 0)) bad(key, `${key} must be seconds > 0`);
  if (fraction(motion.reading_hold) && fraction(motion.end_hold) && motion.reading_hold > motion.end_hold) odd('reading_hold', 'reading_hold is longer than end_hold');
  if (fraction(motion.end_hold) && motion.end_hold < 1) odd('end_hold', 'end_hold under 1 s: contact.mjs warns below 1.0 s');
}

// ---------- sheet ----------

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const urlOf = relative => 'pack/' + relative.split(/[\\/]/).map(encodeURIComponent).join('/');

function cleanSvg(svg) {
  return svg.replace(/<\?xml[^>]*\?>/gi, '').replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
}

function curvePath(c, size) {
  const [x1, y1, x2, y2] = c;
  const point = u => [3 * x1 * (1 - u) ** 2 * u + 3 * x2 * (1 - u) * u * u + u ** 3, 3 * y1 * (1 - u) ** 2 * u + 3 * y2 * (1 - u) * u * u + u ** 3];
  const pad = size * 0.12, span = size - 2 * pad;
  return Array.from({ length: 61 }, (_, i) => point(i / 60)).map(([x, y], i) => `${i ? 'L' : 'M'}${(pad + x * span).toFixed(1)},${(size - pad - y * span * 0.8).toFixed(1)}`).join(' ');
}

const ACCENT_DO = {
  'flat line': () => `<svg viewBox="0 0 300 150"><path d="M40 105 H180 V55 H260" fill="none" stroke="var(--accent)" stroke-width="3"/></svg>`,
  'signal dot': () => `<div class="d-dot"><i></i><span>signal</span></div>`,
  numerals: () => `<div class="d-num"><b>03</b><span>/ 07</span></div>`,
  underline: () => `<div class="d-under"><span>landmark</span></div>`
};
const ACCENT_DONT = {
  metallic: () => `<div class="x-metal">GOLD</div>`,
  gradient: () => `<div class="x-grad"></div>`,
  glow: () => `<div class="x-glow">glow</div>`,
  bevel: () => `<div class="x-bevel">BEVEL</div>`,
  glitter: () => `<div class="x-glitter">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 53) % 92 + 4}%;top:${(i * 37) % 80 + 8}%"></i>`).join('')}</div>`
};

export function sheetHtml({ brand, scope, packName, hasEndcard, motifSvgs }) {
  const p = brand.palette || {};
  const color = {
    ground: p.ground || '#ffffff', ink: p.ink || '#111111', accent: p.accent || p.primary || '#888888',
    surface: p.surface || null, inkSecondary: p.ink_secondary || null, primary: p.primary || null
  };
  const fonts = brand.fonts || {};
  const faces = Object.entries(fonts).filter(([, f]) => isObject(f) && isText(f.file))
    .map(([role, f]) => `@font-face{font-family:"vi-${role}";src:url("${urlOf(f.file)}");font-display:block}`).join('\n');
  const stack = (...roles) => [...roles.flatMap(role => (fonts[role]?.file ? [`'vi-${role}'`] : []).concat(isText(fonts[role]?.family) ? [`'${fonts[role].family.replace(/["'<>]/g, '')}'`] : [])), 'system-ui', 'sans-serif'].join(',');
  const scale = isObject(brand.type_scale) ? brand.type_scale : {};
  const rules = isObject(brand.accent_rules) ? brand.accent_rules : {};
  const motion = isObject(brand.motion) ? brand.motion : {};
  const forbid = Array.isArray(brand.forbid) ? brand.forbid : [];
  const rulesDocs = Array.isArray(brand.rules_docs) ? brand.rules_docs.filter(isText) : [];
  const sources = isObject(brand.palette_sources) ? brand.palette_sources : {};
  const name = isText(brand.display_name) ? brand.display_name : '(no display_name)';
  const sampleLine = isText(brand.making_of) ? brand.making_of : 'Body copy 正文示例 0123456789';

  const swatches = Object.entries(p).filter(([, v]) => typeof v === 'string' && HEX.test(v)).map(([role, value]) => {
    const ratio = p.ground && role !== 'ground' ? `${contrast(value, p.ground).toFixed(1)}:1 on ground` : '';
    return `<div class="sw"><div class="chip" style="background:${esc(value)}"></div><div class="mono role">${esc(role)}</div><div class="mono">${esc(normalizeHex(value).toUpperCase())}</div><div class="mono dim">${esc(sources[role] || '')}</div><div class="mono dim">${esc(ratio)}</div></div>`;
  }).join('');

  const ladder = TYPE_LEVELS.filter(level => fraction(scale[level])).map(level => {
    const px = Math.round(scale[level] * 1080);
    const family = level === 'micro' ? stack('mono', 'body') : level === 'body' ? stack('body', 'display') : stack('display', 'body');
    const text = { hero: 'Aa 探索 2026', title: 'Title 标题 Atlas', body: 'Body text 正文 · a quiet line of reading', micro: 'MICRO · 00:12 · 刻度 · STAGE 02' }[level];
    const legible = scale[level] >= 0.05 ? 'key line' : scale[level] >= 0.03 ? 'secondary line' : 'texture only (AR-15)';
    return `<div class="lv"><div class="mono dim lvl">${level}<br>${scale[level]} · ${px}px @1080<br>${legible}</div><div class="spec" style="font-family:${family};font-size:${px}px;${level === 'micro' ? 'letter-spacing:.08em' : ''}">${esc(text)}</div></div>`;
  }).join('');

  const fontRows = Object.entries(fonts).filter(([, f]) => isObject(f)).map(([role, f]) =>
    `<div class="mono"><span class="dim">${esc(role)}</span> ${esc(f.family || '')} <span class="dim">${esc(f.file || 'installed / system')}</span></div>`).join('');

  const motifs = motifSvgs.map(m => `<figure class="motif"><div class="art">${m.svg}</div><figcaption><div class="mono role">${esc(m.id)}</div><div class="cap">${esc(m.what)}</div><div class="cap dim">use when: ${esc(m.use_when)}</div></figcaption></figure>`).join('');

  const forms = Array.isArray(rules.forms) ? rules.forms : [];
  const never = Array.isArray(rules.never) ? rules.never : [];
  const doTiles = forms.map(form => `<div class="tile ok"><div class="art">${(ACCENT_DO[String(form).toLowerCase()] || (() => `<div class="d-word">${esc(form)}</div>`))()}</div><div class="mono"><b>✓</b> ${esc(form)}</div></div>`).join('');
  const structural = [];
  if (Number.isInteger(rules.per_frame)) structural.push(`<div class="tile no"><div class="art"><div class="x-two"><i></i><i></i></div></div><div class="mono"><b>✗</b> more than ${rules.per_frame} accent per frame</div></div>`);
  if (fraction(rules.max_area)) structural.push(`<div class="tile no"><div class="art"><div class="x-area"></div></div><div class="mono"><b>✗</b> accent over ${Math.round(rules.max_area * 100)}% of the frame</div></div>`);
  const dontTiles = never.map(item => `<div class="tile no"><div class="art">${(ACCENT_DONT[String(item).toLowerCase()] || (() => `<div class="d-word">${esc(item)}</div>`))()}</div><div class="mono"><b>✗</b> ${esc(item)}</div></div>`).join('') + structural.join('');

  const ease = isObject(motion.ease) ? motion.ease : {};
  const curve = (label, c) => Array.isArray(c) && c.length === 4 && c.every(Number.isFinite)
    ? `<div class="curve"><svg viewBox="0 0 200 200"><rect x="24" y="24" width="152" height="152" fill="none" class="frame"/><path d="${curvePath(c, 200)}" fill="none" class="line"/></svg><div class="mono dim">${label} cubic-bezier(${c.join(', ')})</div></div>` : '';
  const sec = frames => (Array.isArray(frames) ? `${frames[0]}–${frames[1]} f (${(frames[0] / 30).toFixed(2)}–${(frames[1] / 30).toFixed(2)} s)` : '–');
  const motionRows = [
    ['cadence', motion.cadence ?? '–'], ['enter', sec(motion.enter)], ['exit', sec(motion.exit)],
    ['overshoot', motion.overshoot ?? '–'], ['squash', motion.squash ?? '–'],
    ['reading hold', motion.reading_hold !== undefined ? `≥ ${motion.reading_hold} s` : '–'], ['end hold', motion.end_hold !== undefined ? `≥ ${motion.end_hold} s` : '–']
  ].map(([k, v]) => `<div class="mono"><span class="dim">${k}</span> ${esc(v)}</div>`).join('');

  const accentRule = forms.some(f => /underline|line/i.test(f)) || !forms.length;
  const budget = [fraction(rules.max_area) ? `accent ≤ ${Math.round(rules.max_area * 100)}% of the frame` : '', Number.isInteger(rules.per_frame) ? `≤ ${rules.per_frame} per frame` : ''].filter(Boolean).join(' · ');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${faces}
:root{--ground:${color.ground};--ink:${color.ink};--accent:${color.accent};
--surface:${color.surface || `color-mix(in srgb, ${color.ink} 7%, ${color.ground})`};
--ink2:${color.inkSecondary || `color-mix(in srgb, ${color.ink} 62%, ${color.ground})`};
--line:color-mix(in srgb, ${color.ink} 14%, ${color.ground});
--display:${stack('display', 'body')};--body:${stack('body', 'display')};--mono:${stack('mono', 'body')}}
*{box-sizing:border-box}html,body{margin:0;width:1920px;overflow:hidden}
body{background:var(--ground);color:var(--ink);font-family:var(--body);padding:64px 80px 72px}
.mono{font-family:var(--mono);font-size:17px;line-height:1.5;letter-spacing:.02em}
.dim{color:var(--ink2)}.role{color:var(--ink)}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:18px}
header .t{font-family:var(--display);font-size:34px;font-weight:600;letter-spacing:-.01em}
h2{font-family:var(--mono);font-weight:400;font-size:16px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);margin:52px 0 20px}
.frames{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.frame16{position:relative;width:100%;aspect-ratio:16/9;background:var(--ground);outline:1px solid var(--line);overflow:hidden;container-type:size}
.title-frame .lab{position:absolute;left:9cqw;top:22cqh;font-family:var(--mono);font-size:${(scale.micro || 0.02) * 100}cqh;letter-spacing:.14em;color:var(--ink2)}
.title-frame .h{position:absolute;left:9cqw;top:31cqh;font-family:var(--display);font-weight:600;font-size:${(scale.hero || 0.14) * 100}cqh;line-height:1;letter-spacing:-.02em}
.title-frame .u{position:absolute;left:9cqw;top:${31 + (scale.hero || 0.14) * 100 + 4}cqh;height:max(2px,.45cqh);width:22cqw;background:var(--accent)}
.title-frame .b{position:absolute;left:9cqw;top:${31 + (scale.hero || 0.14) * 100 + 10}cqh;font-family:var(--body);font-size:${(scale.body || 0.04) * 100}cqh;color:var(--ink2)}
.frame16 iframe{position:absolute;left:0;top:0;width:1280px;height:720px;border:0;transform-origin:0 0}
.cap16{margin-top:10px}
.swatches{display:grid;grid-template-columns:repeat(6,1fr);gap:24px}
.chip{height:120px;outline:1px solid var(--line);margin-bottom:12px}
.budget{margin-top:18px}
.typeset{display:grid;grid-template-columns:1fr 420px;gap:48px}
.lv{display:grid;grid-template-columns:260px 1fr;align-items:center;gap:24px;padding:14px 0;border-bottom:1px solid var(--line)}
.spec{white-space:nowrap;overflow:hidden;line-height:1.1}
.lvl{font-size:15px}
.fonts .mono{margin-bottom:8px}
.motifs{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.motif{margin:0;background:var(--ground);outline:1px solid var(--line);padding:20px}
.motif .art{height:220px;display:flex;align-items:center;justify-content:center;color:var(--ink);--brand-ground:var(--ground);--brand-surface:var(--surface);--brand-ink:var(--ink);--brand-ink-secondary:var(--ink2);--brand-accent:var(--accent);--brand-font-mono:var(--mono);--brand-font-display:var(--display);--brand-font-body:var(--body)}
.motif .art svg{max-width:100%;max-height:100%}
.cap{font-size:17px;line-height:1.45;margin-top:6px}
.accents{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-content:start;align-items:start}
.tile{background:var(--surface);padding:12px 14px 12px}
.tile .art{height:112px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.tile .art svg{width:100%;height:100%}
.tile.no .art::after{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 1px),var(--ink2) calc(50% - 1px),var(--ink2) calc(50% + 1px),transparent calc(50% + 1px));opacity:.55}
.tile.no>.mono b{color:var(--ink2)}.tile.ok>.mono b{color:var(--ink)}
.d-dot{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:20px}.d-dot i{width:12px;height:12px;border-radius:50%;background:var(--accent)}
.d-num{font-family:var(--display);display:flex;align-items:baseline;gap:10px}.d-num b{font-size:64px;font-weight:500;color:var(--accent);font-variant-numeric:tabular-nums}.d-num span{font-size:22px;color:var(--ink2)}
.d-under span{font-family:var(--display);font-size:34px;border-bottom:3px solid var(--accent);padding-bottom:6px}
.d-word{font-family:var(--mono);font-size:18px;color:var(--accent)}
.x-metal{font-family:var(--display);font-size:52px;font-weight:800;background:linear-gradient(180deg,#fff6c8,var(--accent) 45%,#6b5410 55%,#f3e2a0);-webkit-background-clip:text;color:transparent}
.x-grad{width:80%;height:46px;background:linear-gradient(90deg,#ff3b6b,#ffb800,#3bd16f,#2f8cff,#9b51e0)}
.x-glow{font-family:var(--display);font-size:46px;color:var(--accent);text-shadow:0 0 8px var(--accent),0 0 24px var(--accent),0 0 48px var(--accent)}
.x-bevel{font-family:var(--display);font-size:46px;font-weight:800;color:var(--accent);text-shadow:1px 1px 0 #fff8,-1px -1px 0 #0008,3px 3px 0 #0006}
.x-glitter{position:absolute;inset:0}.x-glitter i{position:absolute;width:6px;height:6px;background:var(--accent);transform:rotate(45deg)}
.x-two{display:flex;gap:40px}.x-two i{width:56px;height:8px;background:var(--accent)}
.x-area{width:70%;height:70%;background:var(--accent)}
.bottom{display:grid;grid-template-columns:1.1fr 1fr;gap:56px}
.curves{display:flex;gap:28px;margin-bottom:12px}.curve svg{width:200px;height:200px}
.curve .frame{stroke:var(--line)}.curve .line{stroke:var(--ink);stroke-width:2.5}
.forbid li{font-size:19px;line-height:1.5;margin-bottom:6px;color:var(--ink)}
.forbid ul{margin:0;padding-left:1.1em}.forbid li::marker{content:"✗  ";color:var(--ink2)}
</style></head><body>
<header><div class="t">${esc(name)} <span class="dim">· brand sheet</span></div><div class="mono dim">${esc(packName)} · ${esc(brand.schema || 'v1 (no schema)')} · palette_scope ${esc(scope)}</div></header>

<h2>Frames · 16:9</h2>
<div class="frames">
  <div><div class="frame16 title-frame"><div class="lab">01 · TITLE FRAME</div><div class="h">${esc(name)}</div>${accentRule ? '<div class="u"></div>' : ''}<div class="b">${esc(sampleLine)}</div></div><div class="mono dim cap16">title frame built from palette, fonts and type_scale · one accent</div></div>
  <div><div class="frame16" id="end">${hasEndcard ? `<iframe src="${urlOf(brand.endcard)}" scrolling="no"></iframe>` : `<div class="title-frame"><div class="lab">NO ENDCARD</div></div>`}</div><div class="mono dim cap16">${hasEndcard ? `end card · ${esc(brand.endcard)} at its settled state` : 'no endcard template in this pack'}</div></div>
</div>

<h2>Palette</h2>
<div class="swatches">${swatches || '<div class="mono dim">no palette</div>'}</div>
${budget ? `<div class="mono dim budget">${esc(budget)}</div>` : ''}

<h2>Type scale · share of frame height</h2>
<div class="typeset"><div>${ladder || '<div class="mono dim">no type_scale</div>'}</div><div class="fonts">${fontRows || '<div class="mono dim">no fonts</div>'}</div></div>

<h2>Motifs</h2>
<div class="motifs">${motifs || '<div class="mono dim">no motifs</div>'}</div>

<h2>Accent · do / never</h2>
<div class="accents"><div class="tiles">${doTiles || '<div class="mono dim">no accent forms</div>'}</div><div class="tiles">${dontTiles || '<div class="mono dim">nothing listed</div>'}</div></div>

<div class="bottom">
  <div><h2>Motion · 30 fps</h2><div class="curves">${curve('in', ease.in)}${curve('out', ease.out)}</div>${motionRows}</div>
  <div class="forbid"><h2>Forbid</h2>${forbid.length ? `<ul>${forbid.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : '<div class="mono dim">nothing listed</div>'}${rulesDocs.length ? `<div class="mono dim">Read before designing: ${rulesDocs.map(d => esc(path.basename(d))).join(' · ')}</div>` : ''}</div>
</div>
<script>
window.renderFrame = async () => {
  await Promise.all([...document.fonts].map(face => face.load().catch(() => {})));
  await document.fonts.ready;
  const frame = document.querySelector('#end iframe');
  if (frame) {
    const box = document.getElementById('end');
    frame.style.transform = 'scale(' + box.clientWidth / 1280 + ')';
    if (frame.contentDocument?.readyState !== 'complete') await new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    const win = frame.contentWindow;
    if (typeof win.renderFrame === 'function') await win.renderFrame(win.endcardTiming?.settled ?? 10);
    await win.document.fonts.ready;
  }
};
</script></body></html>`;
}

const staging = new Set();
function installExitCleanup() {
  const clean = () => { cleanupSync(); for (const dir of staging) { try { rmSync(dir, { recursive: true, force: true }); } catch {} } staging.clear(); };
  process.on('exit', clean);
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) process.on(signal, () => { clean(); process.exit(code); });
}

// The sheet grows with the pack (more motifs, a longer forbid list), so its height is measured
// once in the same served setup before render.mjs takes the still.
async function measureHeight(root, html) {
  const { chromium } = await import('playwright');
  const { startStaticServer } = await import('./render.mjs');
  const server = await startStaticServer(await realpath(root));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 });
    await page.goto(`${server.origin}/${path.basename(html)}`, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => window.renderFrame(0));
    const height = await page.evaluate(() => Math.ceil(document.body.scrollHeight));
    return Math.min(8000, Math.max(1200, height + (height % 2)));
  } finally {
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

export async function makeSheet(target, out, { overwrite = false, tokens } = {}) {
  if (!out || path.extname(out).toLowerCase() !== '.png') throw Error('--out must be a .png path.');
  const check = await checkBrand(target, { tokens });
  if (!check.ok) {
    const error = Error(`Brand pack has errors; fix them before rendering a sheet:\n${check.errors.map(e => `  ${e.code} ${e.field}: ${e.message}`).join('\n')}`);
    error.check = check;
    throw error;
  }
  const brand = check.brand;
  const motifSvgs = [];
  for (const motif of Array.isArray(brand.motifs) ? brand.motifs : []) {
    if (!isObject(motif) || !isText(motif.file) || !/\.svg$/i.test(motif.file)) continue;
    motifSvgs.push({ id: motif.id, what: motif.what, use_when: motif.use_when, svg: cleanSvg(await readFile(path.resolve(check.dir, motif.file), 'utf8')) });
  }
  const temporary = await mkdtemp(path.join(tmpdir(), 'vi-brand-sheet-'));
  staging.add(temporary);
  try {
    // The pack is linked, not copied, so large fonts cost nothing; the server only sees this folder.
    await symlink(check.dir, path.join(temporary, 'pack'), process.platform === 'win32' ? 'junction' : 'dir');
    const html = path.join(temporary, 'sheet.html');
    await writeFile(html, sheetHtml({ brand, scope: check.scope, packName: path.basename(check.dir), hasEndcard: isText(brand.endcard), motifSvgs }));
    const height = await measureHeight(temporary, html);
    const rendered = await render({ input: html, output: out, still: 0, width: 1920, height, overwrite, root: temporary, fps: 30 });
    return { output: rendered.output, width: rendered.width, height: rendered.height, check: { ok: check.ok, schema: check.schema, warnings: check.warnings }, warnings: rendered.warnings };
  } finally {
    await rm(temporary, { recursive: true, force: true });
    staging.delete(temporary);
  }
}

function parse(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') return null;
    if (arg === '--overwrite') { opts.overwrite = true; continue; }
    if (!['--check', '--sheet', '--out', '--tokens', '--which'].includes(arg)) throw Error(`Unknown option: ${arg}`);
    if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) throw Error(`Missing value for ${arg}`);
    opts[arg.slice(2)] = argv[++i];
  }
  if ([opts.check, opts.sheet, opts.which].filter(Boolean).length !== 1) throw Error('Use exactly one of --check, --sheet or --which. Use --help.');
  if (opts.sheet && !opts.out) throw Error('--sheet needs --out sheet.png.');
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  installExitCleanup();
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) console.log(HELP);
    else {
      const tokens = opts.tokens ? JSON.parse(await readFile(path.resolve(opts.tokens), 'utf8')) : undefined;
      if (opts.which) console.log(JSON.stringify(await findBrandPack(opts.which), null, 2));
      else if (opts.check) {
        const { brand, files, scope, ...report } = await checkBrand(opts.check, { tokens });
        for (const e of report.errors) console.error(`Error: ${e.code} ${e.field}: ${e.message}`);
        for (const w of report.warnings) console.error(`Warning: ${w.code} ${w.field}: ${w.message}`);
        console.log(JSON.stringify({ ...report, palette_scope: scope ?? null }, null, 2));
        if (!report.ok) process.exitCode = 1;
      } else {
        const result = await makeSheet(opts.sheet, path.resolve(opts.out), { overwrite: opts.overwrite, tokens });
        for (const w of result.check.warnings) console.error(`Warning: ${w.code} ${w.field}: ${w.message}`);
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (error) {
    console.error(`brand.mjs: ${error.message}`);
    process.exitCode = 1;
  }
}
