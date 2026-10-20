import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFacts, factsMarkdown, factsScript, sourcesMarkdown } from '../scripts/facts.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/facts.mjs', import.meta.url));

const TABLE = {
  sources: [
    { id: 's-event', title: 'Roadster event', publisher: 'Tesla', date: '2026-10-15', url: 'https://example.com/event', kind: 'primary' },
    { id: 's-news', title: 'A report', publisher: 'News', date: '2026-10-16', url: 'https://example.com/news', kind: 'secondary' }
  ],
  facts: [
    { id: 'f-thrust', text: 'Thrust above 80 kN', value: 80, unit: 'kN', kind: 'claim', by: 'Tesla', source: 's-event' },
    { id: 'f-exhaust', text: 'Cold gas exhaust speed about 550 m/s', value: 550, unit: 'm/s', kind: 'reported', source: 's-news' },
    { id: 'f-flow', text: 'About 145 kg of air per second', value: 145, unit: 'kg/s', kind: 'estimate', inputs: ['f-thrust', 'f-exhaust'], formula: '80,000 N ÷ 550 m/s' },
    { id: 'f-tank-time', text: 'Hover time not published', kind: 'unknown' }
  ]
};

test('facts: a clean table passes, and the script may only cite facts that exist', () => {
  const ok = checkFacts(TABLE, 'It pushes with {f:f-thrust}.\nThat is {f:f-flow} every second.\nHow long? {f:f-tank-time}');
  assert.equal(ok.ok, true, JSON.stringify(ok.errors));
  assert.deepEqual(ok.warnings, []);
  const bad = checkFacts(TABLE, 'A number from nowhere {f:f-made-up}.');
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors.map(e => e.code), ['script_cites_unknown']);
  assert.ok(bad.warnings.some(w => w.code === 'fact_unused' && w.where === 'f-thrust'));
});

test('facts: each kind demands what the picture will claim about it', () => {
  const broken = structuredClone(TABLE);
  broken.facts.push(
    { id: 'f-a', text: 'claim without owner', value: 1, unit: 'x', kind: 'claim', source: 's-event' },
    { id: 'f-b', text: 'measured without source', value: 2, unit: 'x', kind: 'measured' },
    { id: 'f-c', text: 'estimate without arithmetic', value: 3, unit: 'x', kind: 'estimate' },
    { id: 'f-d', text: 'unpublished with a value', value: 4, kind: 'unknown' },
    { id: 'f-e', text: 'loop one', value: 5, unit: 'x', kind: 'estimate', inputs: ['f-f'], formula: 'f' },
    { id: 'f-f', text: 'loop two', value: 6, unit: 'x', kind: 'estimate', inputs: ['f-e'], formula: 'e' },
    { id: 'f-g', text: 'secondary only claim', value: 7, unit: 'x', kind: 'claim', by: 'News', source: 's-news' },
    { id: 'f-thrust', text: 'duplicate', kind: 'unknown' }
  );
  const report = checkFacts(broken);
  const codes = report.errors.map(e => e.code);
  for (const code of ['claim_by_missing', 'fact_source_missing', 'estimate_inputs_missing', 'estimate_formula_missing', 'unknown_has_value', 'estimate_cycle', 'id_duplicate']) assert.ok(codes.includes(code), code);
  assert.ok(report.warnings.some(w => w.code === 'secondary_only' && w.where.includes('f-g')));
});

test('facts: exports for review, scenes and the publish notes', async t => {
  const md = factsMarkdown(TABLE);
  assert.match(md, /\| f-flow \| About 145 kg of air per second \| 145 kg\/s \| rough math \| 80,000 N ÷ 550 m\/s \(from f-thrust, f-exhaust\) \|/);
  assert.match(md, /\| f-tank-time \| Hover time not published \| — \| not published \|/);
  assert.match(sourcesMarkdown(TABLE), /^- Tesla, Roadster event, 2026-10-15: https:\/\/example.com\/event$/m);
  const js = factsScript(TABLE);
  const window = {};
  new Function('window', js)(window);
  assert.deepEqual(window.FACTS['f-thrust'], { text: 'Thrust above 80 kN', value: 80, unit: 'kN', kind: 'claim', label: 'claim', by: 'Tesla' });
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator facts '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'facts.json');
  await writeFile(file, JSON.stringify(TABLE));
  await exec(process.execPath, [script, '--js', file, '--out', path.join(directory, 'facts.js')]);
  assert.equal(await readFile(path.join(directory, 'facts.js'), 'utf8'), js);
  await assert.rejects(exec(process.execPath, [script, '--js', file, '--out', path.join(directory, 'facts.js')]), /--overwrite/);
  const broken = structuredClone(TABLE);
  delete broken.facts[0].by;
  await writeFile(file, JSON.stringify(broken));
  await assert.rejects(exec(process.execPath, [script, '--check', file]), error => /claim_by_missing/.test(error.stdout));
});
