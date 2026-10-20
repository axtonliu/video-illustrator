#!/usr/bin/env node
// One fact table drives the script, the picture and the publish notes. This checks it, lists it
// for review, exports it for scenes, and checks that the script only cites facts that exist.
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Check and export the episode's fact table.

node scripts/facts.mjs --check facts.json [--script script.md]
node scripts/facts.mjs --md facts.json --out facts.md [--overwrite]
node scripts/facts.mjs --js facts.json --out facts.js [--overwrite]
node scripts/facts.mjs --sources facts.json --out sources.md [--overwrite]

facts.json:
  sources: [{id, title, publisher, date, url, kind: "primary" | "secondary"}]
  facts:   [{id, text, value?, unit?, kind, by?, source?, quote?, simplified?, inputs?, formula?}]
kind says how far the number can be trusted, and the picture must say it too:
  claim     what a party says about itself (by + source required)       e.g. "Tesla's claim"
  measured  a primary record, measurement or document (source required)
  reported  a third party's report (source required)
  estimate  our own rough math (inputs + formula required, no source)   e.g. "Rough math"
  unknown   not published; value stays empty                           e.g. "Tesla hasn't said"
In script.md cite a fact as {f:<id>} anywhere on the line that uses it.
--check prints errors and warnings as JSON and exits 1 on any error.`;

const KINDS = new Set(['claim', 'measured', 'reported', 'estimate', 'unknown']);
const SOURCE_KINDS = new Set(['primary', 'secondary']);
const ID = /^[a-z0-9][a-z0-9._-]*$/;
export const CITE = /\{f:([a-z0-9][a-z0-9._-]*)\}/g;

export function checkFacts(table, scriptText) {
  const errors = [], warnings = [];
  const err = (code, where, detail) => errors.push({ code, where, detail });
  const warn = (code, where, detail) => warnings.push({ code, where, detail });
  const sources = Array.isArray(table?.sources) ? table.sources : [];
  const facts = Array.isArray(table?.facts) ? table.facts : [];
  if (!Array.isArray(table?.facts)) err('facts_missing', 'facts', 'facts must be an array');

  const sourceById = new Map();
  for (const [i, s] of sources.entries()) {
    const where = `sources[${i}]${s?.id ? ' ' + s.id : ''}`;
    if (!s?.id || !ID.test(s.id)) { err('id_invalid', where, 'lower-case id required'); continue; }
    if (sourceById.has(s.id)) err('id_duplicate', where, s.id);
    sourceById.set(s.id, s);
    if (!s.title) err('source_title_missing', where, 'title required');
    if (!s.url) err('source_url_missing', where, 'url required: the reader must be able to find it');
    if (!SOURCE_KINDS.has(s.kind)) err('source_kind_invalid', where, 'kind is primary or secondary');
    if (!s.date) warn('source_date_missing', where, 'publication date helps readers judge freshness');
  }

  const factById = new Map();
  for (const [i, f] of facts.entries()) {
    const where = `facts[${i}]${f?.id ? ' ' + f.id : ''}`;
    if (!f?.id || !ID.test(f.id)) { err('id_invalid', where, 'lower-case id required'); continue; }
    if (factById.has(f.id) || sourceById.has(f.id)) err('id_duplicate', where, f.id);
    factById.set(f.id, f);
    if (!f.text) err('fact_text_missing', where, 'text required: the fact in one sentence');
    if (!KINDS.has(f.kind)) { err('fact_kind_invalid', where, `kind is one of ${[...KINDS].join(', ')}`); continue; }
    if (f.kind === 'estimate') {
      if (!Array.isArray(f.inputs) || !f.inputs.length) err('estimate_inputs_missing', where, 'an estimate lists the facts it is computed from');
      if (!f.formula) err('estimate_formula_missing', where, 'an estimate shows its arithmetic');
    } else if (f.kind === 'unknown') {
      if (f.value !== undefined && f.value !== null) err('unknown_has_value', where, 'an unpublished number has no value');
    } else {
      if (!f.source) err('fact_source_missing', where, `a ${f.kind} fact needs a source`);
      else if (!sourceById.has(f.source)) err('fact_source_unknown', where, f.source);
      else if (sourceById.get(f.source).kind === 'secondary' && f.kind !== 'reported') warn('secondary_only', where, 'secondary reports are leads; confirm against a primary source');
      if (f.kind === 'claim' && !f.by) err('claim_by_missing', where, 'say whose claim it is');
    }
    if (typeof f.value === 'number' && !f.unit) warn('unit_missing', where, 'a number without a unit');
  }

  // Estimate inputs must exist and must not loop.
  for (const f of factById.values()) for (const input of f.inputs || []) if (!factById.has(input)) err('estimate_input_unknown', f.id, input);
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2 || !factById.has(id)) return;
    if (state.get(id) === 1) { err('estimate_cycle', id, [...trail, id].join(' → ')); return; }
    state.set(id, 1);
    for (const input of factById.get(id).inputs || []) visit(input, [...trail, id]);
    state.set(id, 2);
  };
  for (const id of factById.keys()) visit(id, []);

  if (scriptText !== undefined) {
    const cited = new Set();
    scriptText.split('\n').forEach((line, n) => {
      for (const m of line.matchAll(CITE)) {
        cited.add(m[1]);
        if (!factById.has(m[1])) err('script_cites_unknown', `script line ${n + 1}`, m[1]);
      }
    });
    for (const f of factById.values()) {
      if (cited.has(f.id)) continue;
      const usedBy = [...factById.values()].some(g => (g.inputs || []).includes(f.id) && cited.has(g.id));
      if (!usedBy) warn('fact_unused', f.id, 'not cited by the script or by a cited estimate');
    }
  }
  return { ok: errors.length === 0, facts: facts.length, sources: sources.length, errors, warnings };
}

const LABEL = { claim: 'claim', measured: 'measured', reported: 'reported', estimate: 'rough math', unknown: 'not published' };
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function factsMarkdown(table) {
  const sources = new Map((table.sources || []).map(s => [s.id, s]));
  const rows = (table.facts || []).map(f => {
    const value = f.kind === 'unknown' ? '—' : [f.value, f.unit].filter(v => v !== undefined && v !== null).join(' ');
    const where = f.kind === 'estimate' ? `${f.formula} (from ${f.inputs.join(', ')})` : sources.get(f.source)?.title || '';
    return `| ${cell(f.id)} | ${cell(f.text)} | ${cell(value)} | ${LABEL[f.kind]}${f.by ? ` · ${cell(f.by)}` : ''} | ${cell(where)} | ${cell(f.simplified)} |`;
  });
  return ['| id | fact | value | kind | from | simplified |', '|---|---|---|---|---|---|', ...rows, ''].join('\n');
}

export function sourcesMarkdown(table) {
  return (table.sources || []).map(s => `- ${[s.publisher, s.title, s.date].filter(Boolean).join(', ')}: ${s.url}`).join('\n') + '\n';
}

export function factsScript(table) {
  const out = {};
  for (const f of table.facts || []) out[f.id] = { text: f.text, value: f.value ?? null, unit: f.unit ?? null, kind: f.kind, label: LABEL[f.kind], by: f.by ?? null };
  return `// Generated by scripts/facts.mjs from facts.json. Scenes read numbers from here, never retype them.\nwindow.FACTS = ${JSON.stringify(out, null, 2)};\n`;
}

async function exists(file) { try { await access(file); return true; } catch { return false; } }

function parse(argv) {
  const opts = { overwrite: false };
  const modes = ['check', 'md', 'js', 'sources'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    const key = a.replace(/^--/, '');
    if (!a.startsWith('--') || ![...modes, 'script', 'out'].includes(key)) throw Error(`Unknown option: ${a}`);
    if (argv[i + 1] === undefined) throw Error(`Missing value for ${a}`);
    if (modes.includes(key)) { if (opts.mode) throw Error('Give one of --check, --md, --js, --sources.'); opts.mode = key; opts.file = argv[++i]; }
    else opts[key] = argv[++i];
  }
  if (!opts.mode) throw Error('Give one of --check, --md, --js, --sources. Use --help.');
  if (opts.mode !== 'check' && !opts.out) throw Error('--out is required.');
  return opts;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    const table = JSON.parse(await readFile(path.resolve(opts.file), 'utf8'));
    if (opts.mode === 'check') {
      const script = opts.script ? await readFile(path.resolve(opts.script), 'utf8') : undefined;
      const report = checkFacts(table, script);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.ok ? 0 : 1);
    }
    const report = checkFacts(table);
    if (!report.ok) { console.error(JSON.stringify(report.errors, null, 2)); throw Error('facts.json has errors; run --check.'); }
    const out = path.resolve(opts.out);
    if (!opts.overwrite && await exists(out)) throw Error(`${out} exists; pass --overwrite to replace it.`);
    const text = opts.mode === 'md' ? factsMarkdown(table) : opts.mode === 'js' ? factsScript(table) : sourcesMarkdown(table);
    await writeFile(out, text);
    console.log(out);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
