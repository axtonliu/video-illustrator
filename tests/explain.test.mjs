import test from 'node:test';
import assert from 'node:assert/strict';
import { checkExplain, explainMarkdown } from '../scripts/explain.mjs';

const script = `## s1 开头\n第一句。\n> 画面说明不算口播\n第二句。\n## s2 第二段\n只有一句。\n`;
const cand = family => ({ family, device: `${family} picture`, aha: 'clicks' });
const plan = () => ({
  topic: 't',
  signature: { candidates: [1, 2, 3, 4, 5].map(i => ({ idea: `idea ${i}` })), chosen: 0, swap_test: 'only this topic', appears: ['s1:0'] },
  concepts: [{ id: 'c1', concept: 'x', hard_because: 'invisible',
    candidates: ['visible', 'analogy', 'scale', 'demo', 'contrast', 'visible'].map(cand),
    explanation: { pick: 0, why: 'w' }, demonstration: { pick: 3, why: 'w' }, lines: ['s1:1', 's2:0'] }],
  review: { by: 'subagent', changes: [] }
});

test('a worked plan passes, and its line references count only spoken lines', () => {
  const r = checkExplain(plan(), script);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.warnings, []);
  const p = plan(); p.concepts[0].lines = ['s1:2'];   // s1 has two spoken lines; the picture note is not one
  assert.deepEqual(checkExplain(p, script).errors.map(e => e.code), ['line_ref_missing']);
});

test('a plan that skipped the divergent step fails', () => {
  const p = plan();
  p.signature.candidates = p.signature.candidates.slice(0, 2);
  p.concepts[0].candidates = ['visible', 'visible', 'analogy'].map(cand);
  p.concepts[0].explanation.pick = 0; p.concepts[0].demonstration.pick = 0;
  const codes = checkExplain(p).errors.map(e => e.code);
  for (const c of ['signature_too_few', 'candidates_too_few', 'families_too_few', 'demo_missing', 'same_pick']) assert.ok(codes.includes(c), c);
});

test('a concept with no possible demonstration says why instead', () => {
  const p = plan();
  p.concepts[0].candidates = ['visible', 'analogy', 'scale', 'contrast', 'process', 'narrative'].map(cand);
  delete p.concepts[0].demonstration;
  assert.ok(checkExplain(p).errors.some(e => e.code === 'demo_missing'));
  p.concepts[0].no_demo_reason = 'no footage exists and a simulation would mislead';
  assert.equal(checkExplain(p).ok, true);
  assert.match(explainMarkdown(p), /none: no footage exists/);
});

test('the markdown table names the chosen devices and counts runners-up', () => {
  const md = explainMarkdown(plan());
  assert.match(md, /\*\*Signature idea:\*\* idea 1/);
  assert.match(md, /\| x \| visible picture \| demo picture \| s1:1, s2:0 \| 4 \|/);
});

test('another tool can judge the same plan with its own references, from the import-free checker', async () => {
  const { checkExplainPlan } = await import('../scripts/explain-check.mjs');
  const shots = new Set(['shot-001', 'shot-002']);
  const checkRef = r => (shots.has(r) ? null : { code: 'shot_ref_missing', detail: `${r} is not a shot` });
  const p = plan();
  p.signature.appears = ['shot-001'];
  p.concepts[0].shots = ['shot-002'];
  delete p.concepts[0].lines;
  assert.equal(checkExplainPlan(p, { refField: 'shots', checkRef }).ok, true);
  p.concepts[0].shots = ['shot-009'];
  assert.deepEqual(checkExplainPlan(p, { refField: 'shots', checkRef }).errors.map(e => e.code), ['shot_ref_missing']);
  delete p.concepts[0].shots;
  assert.deepEqual(checkExplainPlan(p, { refField: 'shots', checkRef }).errors.map(e => e.code), ['shots_missing']);
});
