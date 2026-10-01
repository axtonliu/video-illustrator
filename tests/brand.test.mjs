import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { SCHEMA_V2, checkBrand, contrast, resolveToken } from '../scripts/brand.mjs';

const exec = promisify(execFile);
const skill = fileURLToPath(new URL('..', import.meta.url));
const script = path.join(skill, 'scripts/brand.mjs');
const cli = args => exec(process.execPath, [script, ...args]);

// A minimal valid v2 pack; each case changes one thing.
const BASE = () => ({
  schema: SCHEMA_V2,
  display_name: 'Test Studio',
  palette: { ground: '#FFFFFF', surface: '#EEEEEE', ink: '#111111', ink_secondary: '#555555', primary: '#224466', accent: '#CC3300' },
  palette_scope: 'film'
});

async function pack(t, brand, files = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'vi brand test '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), content);
  }
  await writeFile(path.join(dir, 'brand.json'), typeof brand === 'string' ? brand : JSON.stringify(brand, null, 2));
  return dir;
}
const codes = list => list.map(item => item.code);

const ERROR_CASES = {
  json_parse: [['{ "display_name": "x", }'], ['[1, 2]']],
  schema_unknown: [[{ ...BASE(), schema: 'video-illustrator.brand.v9' }]],
  file_missing: [[{ ...BASE(), endcard: 'templates/none.html' }], [{ display_name: 'v1', logo: 'logo.svg' }]],
  hex_invalid: [[{ ...BASE(), palette: { ...BASE().palette, accent: 'gold' } }], [{ display_name: 'v1', palette: { ink: '#12345' } }]],
  film_palette_incomplete: [[{ ...BASE(), palette: { ground: '#FFFFFF', ink: '#111111' } }]],
  accent_max_area_range: [[{ ...BASE(), accent_rules: { max_area: 0 } }], [{ ...BASE(), accent_rules: { max_area: 1.5 } }], [{ ...BASE(), accent_rules: { max_area: '8%' } }]]
};

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;
const WARNING_CASES = {
  v2_field_in_v1: [{ display_name: 'v1', forbid: ['glow'] }],
  unknown_field: [{ ...BASE(), colour: '#FFFFFF' }],
  path_invalid: [{ ...BASE(), endcard: 42 }],
  path_outside_pack: [{ ...BASE(), logo: '../outside.svg' }, {}, 'outside'],
  display_name_missing: [{ ...BASE(), display_name: '' }],
  making_of_invalid: [{ ...BASE(), making_of: 3 }],
  palette_invalid: [{ display_name: 'v1', palette: '#FFFFFF' }],
  palette_role_unknown: [{ ...BASE(), palette: { ...BASE().palette, highlight: '#FFEE00' } }],
  palette_scope_unknown: [{ ...BASE(), palette_scope: 'everything' }],
  contrast_low: [{ ...BASE(), palette: { ...BASE().palette, ink: '#EEEEEE' } }],
  font_invalid: [{ ...BASE(), fonts: { display: 'Inter' } }],
  font_role_unknown: [{ ...BASE(), fonts: { caption: { family: 'X' } } }],
  font_license_missing: [{ ...BASE(), fonts: { body: { family: 'X', file: 'fonts/x.ttf' } } }, { 'fonts/x.ttf': 'not really a font' }],
  palette_sources_invalid: [{ ...BASE(), palette_sources: ['ground'] }],
  palette_source_unknown_role: [{ ...BASE(), palette_sources: { highlight: 'gold' } }],
  palette_source_unresolved: [{ ...BASE(), palette_sources: { ground: 'missing.token' } }, {}, null, { tokens: { white: '#FFFFFF' } }],
  palette_source_mismatch: [{ ...BASE(), palette_sources: { ground: 'cream' } }, {}, null, { tokens: { cream: '#FAF0E0' } }],
  accent_rules_invalid: [{ ...BASE(), accent_rules: { per_frame: 0, forms: 'line' } }],
  accent_rules_conflict: [{ ...BASE(), accent_rules: { forms: ['glow'], never: ['Glow'] } }],
  accent_rules_without_accent: [{ ...BASE(), palette_scope: 'credits', palette: { ink: '#111111' }, accent_rules: { per_frame: 1 } }],
  type_scale_invalid: [{ ...BASE(), type_scale: { hero: 16 } }],
  type_scale_order: [{ ...BASE(), type_scale: { hero: 0.1, title: 0.12 } }],
  motion_invalid: [{ ...BASE(), motion: { cadence: 'smooth', ease: { in: [2, 0, 0.5, 1], out: [0, 0, 1, 1] } } }],
  motion_inconsistent: [{ ...BASE(), motion: { ease: { in: [0.3, 1.4, 0.4, 1], out: [0.5, 0, 1, 1] }, overshoot: 'none' } }],
  motif_invalid: [{ ...BASE(), motifs: [{ id: 'a', file: 'm.svg' }] }, { 'm.svg': svg('') }],
  motif_script: [{ ...BASE(), motifs: [{ id: 'a', what: 'w', use_when: 'u', file: 'm.svg' }] }, { 'm.svg': svg('<script>alert(1)</script>') }],
  motif_forbidden_effect: [{ ...BASE(), accent_rules: { never: ['gradient'] }, motifs: [{ id: 'a', what: 'w', use_when: 'u', file: 'm.svg' }] }, { 'm.svg': svg('<linearGradient id="g"/>') }],
  sound_invalid: [{ ...BASE(), sound: 'logo.wav' }],
  endcard_no_render_frame: [{ ...BASE(), endcard: 'end.html' }, { 'end.html': '<p>static</p>' }],
  forbid_invalid: [{ ...BASE(), forbid: 'glow' }],
  references_invalid: [{ ...BASE(), references: [{ url: 'https://example.com' }] }]
};

test('brand check: every error code has a failing case and the CLI exits 1', async t => {
  for (const [code, cases] of Object.entries(ERROR_CASES)) {
    for (const [brand] of cases) {
      const dir = await pack(t, brand);
      const result = await checkBrand(dir);
      assert.equal(result.ok, false, `${code}: expected an error for ${JSON.stringify(brand).slice(0, 80)}`);
      assert.ok(codes(result.errors).includes(code), `${code}: got ${codes(result.errors)}`);
    }
  }
  const dir = await pack(t, ERROR_CASES.film_palette_incomplete[0][0]);
  await assert.rejects(cli(['--check', dir]), error => error.code === 1 && /film_palette_incomplete/.test(error.stdout));
});

test('brand check: every warning code has a case, and warnings never fail the check', async t => {
  for (const [code, [brand, files = {}, outside, options = {}]] of Object.entries(WARNING_CASES)) {
    const dir = await pack(t, brand, files);
    if (outside) await writeFile(path.join(path.dirname(dir), 'outside.svg'), svg('')).then(() => t.after(() => rm(path.join(path.dirname(dir), 'outside.svg'), { force: true })));
    const result = await checkBrand(dir, options);
    assert.ok(codes(result.warnings).includes(code), `${code}: got warnings ${codes(result.warnings)} errors ${codes(result.errors)}`);
    assert.equal(result.ok, true, `${code} must stay a warning, got errors ${codes(result.errors)}`);
  }
  // No code in the script goes untested.
  const source = await readFile(script, 'utf8');
  const used = new Set([...source.matchAll(/(?:error|warn)\('([a-z_]+)'/g)].map(m => m[1]));
  for (const code of ['motion_invalid', 'motion_inconsistent']) used.add(code);
  const tested = new Set([...Object.keys(ERROR_CASES), ...Object.keys(WARNING_CASES)]);
  for (const code of used) assert.ok(tested.has(code), `${code} has no test case`);
});

test('brand check: a v1 single-file brand.json still passes, with and without referenced files', async t => {
  const plain = await pack(t, { display_name: 'Your Name', palette: { primary: '#1F3A5F', accent: '#C9A227', ground: '#F6F3EC', ink: '#1A1A1A' }, making_of: 'One prompt · every frame is code' });
  let result = await checkBrand(path.join(plain, 'brand.json'));
  // The 0.5 example: still valid. Its gold accent on cream is under 3:1, which is only a warning.
  assert.deepEqual([result.ok, result.schema, result.errors, codes(result.warnings)], [true, 'v1 (no schema)', [], ['contrast_low']]);
  const withFiles = await pack(t, { display_name: 'Your Name', fonts: { display: { family: 'D', file: 'fonts/d.woff2' } }, logo: 'logo.svg' },
    { 'fonts/d.woff2': 'x', 'fonts/OFL.txt': 'licence', 'logo.svg': svg('') });
  result = await checkBrand(withFiles);
  assert.deepEqual([result.ok, result.warnings], [true, []]);
  const { stdout } = await cli(['--check', withFiles]);
  assert.equal(JSON.parse(stdout).ok, true);
});

test('brand check: upstream tokens resolve by name, mode and dotted path', () => {
  const tokens = { tokens: { 'deep.blue': { light: null, dark: '#0A0B0C' }, card: { light: '#FFFFFF', dark: '#222222' }, plain: '#ABC' }, nested: { gold: { $value: '#C0A030' } } };
  assert.deepEqual(resolveToken(tokens, 'deep.blue'), { value: '#0a0b0c' });
  assert.deepEqual(resolveToken(tokens, 'card(Dark)'), { value: '#222222' });
  assert.match(resolveToken(tokens, 'card').error, /several mode values/);
  assert.deepEqual(resolveToken(tokens, 'plain'), { value: '#aabbcc' });
  assert.deepEqual(resolveToken(tokens, 'nested.gold'), { value: '#c0a030' });
  assert.match(resolveToken(tokens, 'nope').error, /not found/);
  assert.ok(Math.abs(contrast('#000000', '#FFFFFF') - 21) < 1e-9);
});

test('brand examples: both pass with no warnings and describe the same brand', async () => {
  const single = await checkBrand(path.join(skill, 'references/brand.example.json'));
  const folder = await checkBrand(path.join(skill, 'references/brand-example'));
  for (const result of [single, folder]) assert.deepEqual([result.ok, result.schema, result.warnings], [true, SCHEMA_V2, []]);
  for (const key of ['display_name', 'palette', 'accent_rules', 'fonts', 'type_scale', 'motion', 'forbid']) {
    assert.deepEqual(single.brand[key], folder.brand[key], `${key} differs between brand.example.json and brand-example/brand.json`);
  }
  assert.ok(folder.files.some(f => f.field === 'endcard') && folder.files.some(f => f.field.startsWith('motifs[')));
});

test('brand sheet renders a PNG of the example pack and refuses a pack with errors', async t => {
  const out = await mkdtemp(path.join(tmpdir(), 'vi brand sheet '));
  t.after(() => rm(out, { recursive: true, force: true }));
  const png = path.join(out, 'sheet.png');
  const { stdout } = await cli(['--sheet', path.join(skill, 'references/brand-example'), '--out', png]);
  const result = JSON.parse(stdout);
  assert.equal(result.width, 1920);
  assert.ok(result.height >= 1200);
  const bytes = await readFile(png);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1920);
  const broken = await pack(t, ERROR_CASES.hex_invalid[0][0]);
  await assert.rejects(cli(['--sheet', broken, '--out', path.join(out, 'broken.png')]), /hex_invalid/);
  assert.ok(!(await readdir(out)).includes('broken.png'));
});

// The public package must never carry the author's private brand values. They are listed here
// only as truncated sha256 hashes so this test does not publish them either.
const PRIVATE_HEX = new Set(['023c4ecf400435f3', '04a2187397afbfb5', '0e684e516035b04c', '0f176030df855be5', '0fe27ce5ea83f679', '115e018f61071dd4', '13969980f5072d6f', '18d806c6ca01bc25', '1af21c77f83a7edf', '1c969b3999c4c9aa', '1d35b820cb2ae016', '251a7b8506a725c5', '2564b032f47fc718', '2718828c36f3a0e4', '274e12b70e79c579', '367909d8ceaa07ae', '3871da342003cbdb', '3b3e47a0c31f2671', '3c336bc375ff2b73', '3c5c1ab6c5fd2f50', '46461f86fde154d9', '4702b16c05573854', '47f67427412411b1', '5b218e748fdc039f', '64567864cb5dfa7c', '6b3d6d843dfe8b50', '6c1452dd7cd683f6', '6e24f0bb7a41796e', '79af1c5e3883384c', '7ddaced054c40c54', '833631aa325ef0ac', '8b8f7c3d45411fb7', '8fa525d47560b2b4', '9a23a4e9633d7bb1', '9f034e1f1a7709ba', 'a29db4df6d013f7d', 'ab070ae310d3cb61', 'abcaed7d2d373eb9', 'b035e56d5fc637e1', 'b18d2a8829e9e64d', 'b33776ade232bb13', 'b3e081ee5f59ad6b', 'b51de63d0eac0534', 'b5644f835cc8390b', 'b5e2bc59ff0f8c39', 'b7de66eef9225fd9', 'c18d4ec05ca9cda9', 'c36d4cdccdc9ca37', 'c3c303ac03971882', 'c94d0aaf943f4eb6', 'cc168c1102ac5ddf', 'cd095d85aa1779d2', 'd332d925afa0ec9b', 'd972e4a5b30e0040', 'dbd729b0a3fbcb8b', 'df9157ab4b12c275', 'e59f7a91cc64a4a9', 'ea981059a215bbf4', 'f9914777d45c7bae', 'ffe28db32eac7696']);
const PRIVATE_WORDS = new Set(['5f02adb12e800b57', '7cadc15d609c4ae9', 'ce3631a6a7b0b82b', '978566a30d7c0064', '9af44644b3f729be', '087e8d27f22996d7', '3997c1a5c704ab24']);
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 16);

async function textFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'videos', 'previews'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await textFiles(full));
    else if (/\.(md|json|mjs|js|html|svg|yaml|txt)$/.test(entry.name)) found.push(full);
  }
  return found;
}

function privateWords(text) {
  const lower = text.toLowerCase();
  const latin = lower.match(/[a-z]+/g) || [];
  const grams = [...latin, ...latin.slice(1).map((w, i) => `${latin[i]} ${w}`)];
  for (const run of lower.match(/\p{Script=Han}+/gu) || []) {
    for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= run.length; i++) grams.push(run.slice(i, i + n));
  }
  return grams.filter(gram => PRIVATE_WORDS.has(hash(gram)));
}

test('public package carries no private brand colour, and brand files no private names', async () => {
  for (const file of await textFiles(skill)) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
      const hex = match[1].length === 3 ? [...match[1]].map(c => c + c).join('') : match[1];
      assert.ok(!PRIVATE_HEX.has(hash('#' + hex.toLowerCase())), `${path.relative(skill, file)} contains a private brand colour (${match[0]})`);
    }
  }
  const brandFiles = [
    'references/brand.md', 'references/brand.example.json', 'scripts/brand.mjs', 'tests/brand.test.mjs',
    ...(await textFiles(path.join(skill, 'references/brand-example'))).map(f => path.relative(skill, f))
  ];
  for (const file of brandFiles) {
    const found = privateWords(await readFile(path.join(skill, file), 'utf8'));
    assert.deepEqual(found, [], `${file} names the author's private brand`);
  }
  // Words are matched whole: common English words that contain a listed word do not trip it.
  assert.equal(PRIVATE_WORDS.size, 7);
  assert.deepEqual(privateWords('Remember December, members'), []);
});
