#!/usr/bin/env node
// The explanation plan says how each idea will be made understood before the script is written:
// one signature idea for the episode, and for every concept an explanation and a demonstration
// chosen from many candidates. This checks that the plan was actually worked through and that
// its line references land in the script; it does not judge the ideas themselves.
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { scriptSegments } from './align.mjs';
import { checkExplainPlan } from './explain-check.mjs';

const HELP = `Check the explanation plan (see references/explanation-design.md).

node scripts/explain.mjs --check explain.json [--script script.md]
node scripts/explain.mjs --md explain.json --out explain.md [--overwrite]

explain.json:
  topic
  signature: {candidates: [{idea, why}] (5+), chosen, swap_test, appears?: ["s1:5"]}
  concepts:  [{id, concept, hard_because,
               candidates: [{family, device, aha, feasibility?, risk?}] (6+, 4+ families, one "demo"),
               explanation: {pick, why}, demonstration: {pick, why}, no_demo_reason?,
               lines: ["s2:6"]}]
  review:    {by, changes: []}
families: ${'visible analogy scale contrast process demo narrative'}
Line references are "<segment id>:<spoken line index>" in script.md, counting only spoken lines
(the same lines scripts/align.mjs times). --check prints errors and warnings as JSON and exits 1
on any error.`;

export { FAMILIES } from './explain-check.mjs';
const REF = /^([A-Za-z0-9_-]+):(\d+)$/;

// explain.json names script lines ("<segment>:<spoken line index>"); the counting itself lives in
// explain-check.mjs so that other tools judge the same plan the same way.
export function checkExplain(plan, scriptText) {
  const segs = scriptText === undefined ? null : scriptSegments(scriptText);
  const checkRef = r => {
    const m = REF.exec(r);
    if (!m) return { code: 'line_ref_invalid', detail: `${r}: write "<segment>:<line>"` };
    if (segs && !(segs[m[1]] && Number(m[2]) < segs[m[1]].length)) return { code: 'line_ref_missing', detail: `${r} is not a spoken line in the script` };
    return null;
  };
  return checkExplainPlan(plan, { refField: 'lines', checkRef });
}

const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function explainMarkdown(plan) {
  const sig = plan.signature, s = sig.candidates[sig.chosen];
  const out = [`## Explanation plan`, '', `**Signature idea:** ${s.idea}`, '', `Swap test: ${sig.swap_test || '—'}`, '',
    '| concept | explanation | demonstration | lines | runners-up |', '|---|---|---|---|---|'];
  for (const c of plan.concepts) {
    const e = c.candidates[c.explanation.pick], d = c.demonstration ? c.candidates[c.demonstration.pick] : null;
    const rest = c.candidates.filter((_, i) => i !== c.explanation.pick && i !== c.demonstration?.pick).length;
    out.push(`| ${cell(c.concept)} | ${cell(e.device)} | ${cell(d ? d.device : `none: ${c.no_demo_reason}`)} | ${cell(c.lines.join(', '))} | ${rest} |`);
  }
  if (plan.review?.changes?.length) out.push('', `Review (${cell(plan.review.by)}):`, ...plan.review.changes.map(x => `- ${x}`));
  return out.join('\n') + '\n';
}

async function exists(file) { try { await access(file); return true; } catch { return false; } }

function parse(argv) {
  const opts = { overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') return null;
    if (a === '--overwrite') { opts.overwrite = true; continue; }
    const key = a.replace(/^--/, '');
    if (!a.startsWith('--') || !['check', 'md', 'script', 'out'].includes(key)) throw Error(`Unknown option: ${a}`);
    if (argv[i + 1] === undefined) throw Error(`Missing value for ${a}`);
    if (key === 'check' || key === 'md') { if (opts.mode) throw Error('Give one of --check, --md.'); opts.mode = key; opts.file = argv[++i]; }
    else opts[key] = argv[++i];
  }
  if (!opts.mode) throw Error('Give one of --check, --md. Use --help.');
  if (opts.mode === 'md' && !opts.out) throw Error('--out is required.');
  return opts;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const opts = parse(process.argv.slice(2));
    if (!opts) { console.log(HELP); process.exit(0); }
    const plan = JSON.parse(await readFile(path.resolve(opts.file), 'utf8'));
    const script = opts.script ? await readFile(path.resolve(opts.script), 'utf8') : undefined;
    const report = checkExplain(plan, script);
    if (opts.mode === 'check') { console.log(JSON.stringify(report, null, 2)); process.exit(report.ok ? 0 : 1); }
    if (!report.ok) { console.error(JSON.stringify(report.errors, null, 2)); throw Error('explain.json has errors; run --check.'); }
    const out = path.resolve(opts.out);
    if (!opts.overwrite && await exists(out)) throw Error(`${out} exists; pass --overwrite to replace it.`);
    await writeFile(out, explainMarkdown(plan));
    console.log(out);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
