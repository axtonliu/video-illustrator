import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MOTION_DEFAULTS } from '../scripts/contact.mjs';

const refs = name => fileURLToPath(new URL(`../references/${name}`, import.meta.url));
const section = (text, title) => {
  const start = text.indexOf(`\n## ${title}`);
  if (start < 0) return null;
  const end = text.indexOf('\n## ', start + 4);
  return text.slice(start, end < 0 ? undefined : end);
};
// Largest y of a CSS cubic-bezier over the curve (x1, x2 in [0, 1] keep x monotonic).
function bezierMaxY(y1, y2) {
  let max = 0;
  for (let i = 0; i <= 4000; i++) { const u = i / 4000; max = Math.max(max, 3 * y1 * (1 - u) ** 2 * u + 3 * y2 * (1 - u) * u * u + u ** 3); }
  return max;
}
const curve = text => {
  const v = text.split(',').map(Number);
  assert.equal(v.length, 4, text);
  assert.ok(v.every(Number.isFinite), text);
  assert.ok(v[0] >= 0 && v[0] <= 1 && v[2] >= 0 && v[2] <= 1, `x outside [0, 1]: ${text}`);
  return v;
};

async function styleNames() {
  const atlas = await readFile(refs('styles.md'), 'utf8');
  return [...new Set([...atlas.matchAll(/\]\(([a-z-]+)\.md\)/g)].map(m => m[1]))];
}

export function parseTokens(block) {
  const line = key => block.split('\n').find(l => l.startsWith(`- ${key}`));
  const cadence = line('cadence:').match(/^- cadence: (on [123]s|\d+ fps stepped)\b/);
  const timing = line('enter / exit:').match(/^- enter \/ exit: (\d+)–(\d+) f \/ (\d+)–(\d+) f/);
  const ease = line('ease:').match(/^- ease: cubic-bezier\(([^)]*)\) \(in\) \/ cubic-bezier\(([^)]*)\) \(out\)/);
  const bounds = line('overshoot:').match(/^- overshoot: (none|≤ (\d+)%).*squash-stretch: (none|≤ (\d+)%)/);
  const holds = line('reading hold:').match(/^- reading hold: ≥ ([\d.]+) s.*end hold: ≥ ([\d.]+) s/);
  for (const [name, m] of Object.entries({ cadence, timing, ease, bounds, holds })) assert.ok(m, `unparsed ${name} line`);
  return {
    cadence: cadence[1],
    enter: [Number(timing[1]), Number(timing[2])], exit: [Number(timing[3]), Number(timing[4])],
    easeIn: curve(ease[1]), easeOut: curve(ease[2]),
    overshoot: bounds[2] === undefined ? null : Number(bounds[2]) / 100,
    squash: bounds[4] === undefined ? null : Number(bounds[4]) / 100,
    reading: Number(holds[1]), end: Number(holds[2])
  };
}

test('motion tokens: every atlas style has parseable tokens whose numbers agree with each other', async () => {
  const names = await styleNames();
  assert.equal(names.length, 25);                                   // 24 styles plus the cinematic treatment
  const all = {};
  for (const name of names) {
    const block = section(await readFile(refs(`${name}.md`), 'utf8'), 'Motion tokens');
    assert.ok(block, `${name}.md has no Motion tokens section`);
    const tk = all[name] = parseTokens(block);
    assert.ok(tk.enter[0] > 0 && tk.enter[0] <= tk.enter[1] && tk.exit[0] > 0 && tk.exit[0] <= tk.exit[1], `${name} ranges`);
    assert.ok(tk.exit[1] <= tk.enter[1], `${name}: an exit is never slower than the entrance`);
    // Declared overshoot must be what the entrance curve actually does.
    const over = bezierMaxY(tk.easeIn[1], tk.easeIn[3]) - 1;
    if (tk.overshoot === null) assert.ok(over <= 1e-4, `${name}: overshoot none but the curve passes 1 by ${over}`);
    else assert.ok(over > 0.001 && over <= tk.overshoot + 1e-4, `${name}: curve overshoot ${over.toFixed(4)} vs declared ${tk.overshoot}`);
    assert.ok(tk.squash === null || (tk.squash > 0 && tk.squash <= 0.3), `${name} squash`);
    assert.ok(tk.reading >= 0.5 && tk.reading <= tk.end, `${name} holds`);
    assert.ok(tk.end >= MOTION_DEFAULTS.endHoldMin, `${name}: end hold ${tk.end} is below the contact.mjs warning limit`);
  }
  // Real differences between styles, not one template copied 25 times.
  const key = tk => JSON.stringify(tk);
  assert.equal(new Set(Object.values(all).map(key)).size, names.length, 'two styles share identical tokens');
  assert.ok(new Set(Object.values(all).map(tk => tk.easeIn.join())).size >= 18, 'entrance curves barely vary');
  assert.ok(new Set(Object.values(all).map(tk => tk.enter.join())).size >= 15, 'entrance durations barely vary');
  assert.ok(new Set(Object.values(all).map(tk => tk.cadence)).size >= 4, 'cadences barely vary');
  // Spot checks against the media: a halftone panel snaps and overshoots; stained glass fills slowly and never does.
  assert.ok(all['halftone-comic'].enter[1] <= 8 && all['halftone-comic'].overshoot >= 0.1);
  assert.ok(all['stained-glass'].enter[0] >= 30 && all['stained-glass'].overshoot === null);
  assert.equal(all['pixel-art'].cadence, '12 fps stepped');
});

test('signature craft: every style names 2-4 media techniques, each with a number to start from', async () => {
  const names = (await styleNames()).filter(name => name !== 'cinematic');
  assert.equal(names.length, 24);
  const required = ['cut-paper', 'ink-wash', 'pixel-art', 'editorial-motion', 'halftone-comic', 'pencil-sketch', 'rubber-hose', 'risograph', 'woodcut', 'flat-cartoon', 'isometric'];
  assert.ok(required.every(name => names.includes(name)));
  const seen = new Set();
  for (const name of names) {
    const text = await readFile(refs(`${name}.md`), 'utf8');
    const block = section(text, 'Signature craft');
    assert.ok(block, `${name}.md has no Signature craft section`);
    assert.ok(text.indexOf('## Signature craft') > text.indexOf('## Motion tokens'), `${name}: craft follows the tokens`);
    const items = block.split('\n').filter(l => l.startsWith('- '));
    assert.ok(items.length >= 2 && items.length <= 4, `${name}: ${items.length} craft items`);
    for (const item of items) {
      assert.match(item, /\d/, `${name}: craft item without a parameter: ${item.slice(0, 60)}`);
      assert.ok(!seen.has(item), `${name}: craft item copied from another style`);
      seen.add(item);
    }
  }
});

test('transitions: 7-10 forms, each with use, frames, a Canvas and a three.js recipe, and where not to use it', async () => {
  const text = await readFile(refs('transitions.md'), 'utf8');
  const forms = text.split('\n## ').slice(1).filter(s => !s.startsWith('Rules'));
  assert.ok(forms.length >= 7 && forms.length <= 10, `${forms.length} forms`);
  const columns = text.match(/Column values: (.*)\./)[1].match(/`([a-z]+)`/g).map(s => s.slice(1, -1));
  assert.equal(columns[0], 'cut');
  for (const form of forms) {
    const id = form.split(':')[0];
    assert.ok(columns.includes(id), `${id} is not a column value`);
    for (const field of ['Use:', 'Frames:', 'Canvas:', 'three.js:', 'Not for:']) assert.ok(form.includes(`**${field}**`), `${id} lacks ${field}`);
    assert.match(form.split('**Frames:**')[1].split('\n- ')[0], /\d/, `${id}: frames without numbers`);
  }
  assert.equal(forms.length, columns.length);
});

test('aesthetic rules: numbered in order, each with rule, case, check, fix and inputs; quotes or an explicit benchmark', async () => {
  const text = await readFile(refs('aesthetic-rules.md'), 'utf8');
  const rules = text.split('\n## ').slice(1);
  assert.ok(rules.length >= 6);
  rules.forEach((rule, k) => {
    const id = `AR-${String(k + 1).padStart(2, '0')}`;
    assert.ok(rule.startsWith(id + ' '), `rule ${k + 1} is numbered ${rule.slice(0, 5)}`);
    for (const part of ['Rule.', 'Case.', 'Check.', 'Fix.', 'Seen in.']) assert.ok(rule.includes(`**${part}**`), `${id} lacks ${part}`);
    const cased = rule.split('**Case.**')[1].split('- **Check.**')[0];
    assert.ok(/“[^”]+”/.test(cased) || /External benchmark/.test(cased), `${id}: the case has neither a quote nor an external-benchmark label`);
    assert.match(rule.split('**Seen in.**')[1], /sheet|stills|brief|audio/);
  });
  // The rules the 0.5 design requires, by their quoted cases.
  for (const quote of ['谈不上惊艳', '场面不够宏大', '分镜少了', '让人睡着了', '片尾的音乐不如']) assert.ok(text.includes(quote), quote);
  assert.match(text, /## AR-\d+ The real asset is the hero, not the wallpaper/);   // the cover as a backdrop
  assert.match(text, /## AR-\d+ Leave the desk/);
});

test('examples stay clear of the showcase films and do not name other creators', async () => {
  const { readdir } = await import('node:fs/promises');
  const files = ['../SKILL.md', ...(await readdir(refs('.'))).filter(f => f.endsWith('.md'))];
  for (const file of files) {
    const text = await readFile(refs(file), 'utf8');
    for (const banned of ['重构个体', '两扇门', '通行证', 'two doors', 'pass card', 'second door']) assert.ok(!text.includes(banned), `${file} uses the showcase theme “${banned}”`);
    assert.ok(!/Vincent(?!wei1021\/)/i.test(text), `${file} names a creator instead of a project`);
  }
});
