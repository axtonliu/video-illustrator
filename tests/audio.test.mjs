import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../scripts/beats.mjs';
import { synthesize, wavBytes, TYPES, SAMPLE_RATE } from '../scripts/sfx.mjs';
import { buildRequest, buildGeminiRequest, requestFor, parseStream, parseInteraction, detectFormat, imageMime, loadReferences, redactBody, CLIP_MODEL, PRO_MODEL, GEMINI_ENDPOINT, GEMINI_CLIP_MODEL, GEMINI_FULL_MODEL, MAX_REFS } from '../scripts/music.mjs';

const exec = promisify(execFile);
const script = name => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));

async function tempdir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator audio '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

// Click track with an accented, lower-pitched first beat of every 4-beat bar.
async function clickTrack(directory, bpm, seconds = 20) {
  const p = 60 / bpm, file = path.join(directory, `click ${bpm}.wav`);
  const accent = `lt(mod(t\\,${4 * p})\\,0.05)`;
  const expr = `if(${accent}\\,1\\,0.45)*exp(-mod(t\\,${p})*40)*sin(2*PI*if(${accent}\\,600\\,1500)*t)`;
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${seconds}`, file]);
  return file;
}

for (const bpm of [128, 93]) {
  test(`beats: synthetic ${bpm} BPM click track within 2% tempo, 30 ms beat and bar phase`, async t => {
    const file = await clickTrack(await tempdir(t), bpm);
    const result = await analyze(file);
    assert.ok(Math.abs(result.bpm - bpm) / bpm <= 0.02, `bpm ${result.bpm}`);
    const p = 60 / bpm;
    const offset = (x, period) => { const d = ((x % period) + period) % period; return Math.min(d, period - d); };
    assert.ok(result.beats.length >= Math.floor(20 / p) - 2);
    for (const beat of result.beats) assert.ok(offset(beat, p) < 0.03, `beat ${beat}`);
    for (const down of result.downbeats) assert.ok(offset(down, 4 * p) < 0.03, `downbeat ${down}`);
    assert.ok(result.strong_onsets.length > 0);
  });
}

test('sfx: every type is non-silent, peak-normalized, correct length and deterministic per seed', async () => {
  for (const type of TYPES) {
    const a = synthesize(type, { seed: 3 }), b = synthesize(type, { seed: 3 }), c = synthesize(type, { seed: 4 });
    const peak = Math.max(...a.map(Math.abs));
    assert.ok(peak > 0.85 && peak <= 0.9, `${type} peak ${peak}`);
    const hash = s => createHash('sha1').update(wavBytes(s)).digest('hex');
    assert.equal(hash(a), hash(b));
    assert.notEqual(hash(a), hash(c));
    assert.equal(synthesize(type, { duration: 0.5 }).length, SAMPLE_RATE / 2);
  }
});

test('sfx CLI writes WAV files that ffprobe reads and refuses to overwrite by default', async t => {
  const directory = await tempdir(t);
  const { stdout } = await exec(process.execPath, [script('sfx.mjs'), '--out', directory, '--type', 'whoosh,tick']);
  assert.deepEqual(JSON.parse(stdout).written.map(w => w.type), ['whoosh', 'tick']);
  const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(directory, 'whoosh.wav')])).stdout);
  assert.equal(Number(probe.streams[0].sample_rate), 48000);
  assert.equal(Number(probe.streams[0].duration), 0.7);
  await assert.rejects(exec(process.execPath, [script('sfx.mjs'), '--out', directory, '--type', 'tick']), /already exists/);
});

test('music: request shape, model choice, SSE audio decoding and format detection (offline)', async () => {
  const short = buildRequest({ style: 'taiko', bpm: 100, duration: 20 });
  assert.equal(short.model, CLIP_MODEL);
  assert.deepEqual(short.modalities, ['text', 'audio']);
  assert.equal(short.stream, true);
  assert.match(short.messages[0].content, /no vocals.*taiko.*100 BPM.*20 seconds/);
  assert.equal(buildRequest({ duration: 45 }).model, PRO_MODEL);
  assert.doesNotMatch(buildRequest({ vocals: true }).messages[0].content, /no vocals/);
  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 7)]);
  const b64 = mp3.toString('base64');
  const sse = [
    ': OPENROUTER PROCESSING',
    `data: ${JSON.stringify({ id: 'gen-1', choices: [{ delta: { content: '<instrumental>' } }] })}`,
    `data: ${JSON.stringify({ id: 'gen-1', choices: [{ delta: { audio: { data: b64.slice(0, 40) } } }] })}`,
    `data: ${JSON.stringify({ id: 'gen-1', choices: [{ delta: { audio: { data: b64.slice(40) } } }], usage: { cost: 0.04 } })}`,
    'data: [DONE]'
  ].join('\n');
  const parsed = parseStream(sse);
  assert.deepEqual(parsed.bytes, mp3);
  assert.equal(parsed.text, '<instrumental>');
  assert.equal(parsed.usage.cost, 0.04);
  assert.equal(parsed.id, 'gen-1');
  assert.equal(detectFormat(mp3), 'mp3');
  assert.equal(detectFormat(Buffer.from('RIFF....')), 'wav');
  assert.equal(detectFormat(Buffer.from('nope')), null);
  assert.match(parseStream(`data: ${JSON.stringify({ error: { message: 'bad' } })}`).error, /bad/);
});

test('music CLI --dry-run needs no key and sends nothing; a real run without a key fails clearly', async t => {
  const env = { ...process.env };
  delete env.OPENROUTER_API_KEY;
  const { stdout } = await exec(process.execPath, [script('music.mjs'), '--dry-run', '--duration', '30'], { env });
  assert.equal(JSON.parse(stdout).dry_run, true);
  await assert.rejects(exec(process.execPath, [script('music.mjs'), '--out', await tempdir(t)], { env }), /OPENROUTER_API_KEY is not set/);
});

test('music: reference images are read by content, hashed, and sent in each provider\'s documented shape (offline)', async t => {
  const directory = await tempdir(t);
  const jpg = path.join(directory, 'frame one.jpg'), png = path.join(directory, 'frame-two.png');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=32x18', '-frames:v', '1', jpg]);
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=32x18', '-frames:v', '1', png]);
  const bytes = await readFile(jpg);
  const refs = await loadReferences([jpg, png]);
  assert.deepEqual(refs.map(r => [r.file, r.mime]), [['frame one.jpg', 'image/jpeg'], ['frame-two.png', 'image/png']]);
  assert.equal(refs[0].sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(refs[0].data, bytes.toString('base64'));
  assert.equal(imageMime(Buffer.from('RIFF\0\0\0\0WEBPVP8 ')), 'image/webp');
  const fake = path.join(directory, 'not-image.jpg');
  await writeFile(fake, 'hello');
  await assert.rejects(loadReferences([fake]), /not a PNG, JPEG or WebP/);
  await assert.rejects(loadReferences(Array(MAX_REFS + 1).fill(jpg)), /At most 10/);

  const opts = { style: 'felt piano', bpm: 96, duration: 30 };
  // Without references both providers keep a plain text prompt (the pre-0.3.2 request shape).
  assert.equal(typeof buildRequest(opts).messages[0].content, 'string');
  assert.equal(typeof buildGeminiRequest(opts).input, 'string');
  const or = buildRequest(opts, refs);
  assert.equal(or.model, CLIP_MODEL);
  const content = or.messages[0].content;
  assert.equal(content[0].type, 'text');
  assert.match(content[0].text, /felt piano.*attached 2 images are frames/);
  assert.deepEqual(content.slice(1).map(c => c.type), ['image_url', 'image_url']);
  assert.equal(content[1].image_url.url, `data:image/jpeg;base64,${refs[0].data}`);
  const gm = buildGeminiRequest(opts, refs);
  assert.equal(gm.model, GEMINI_CLIP_MODEL);
  assert.equal(buildGeminiRequest({ duration: 60 }).model, GEMINI_FULL_MODEL);
  assert.deepEqual(gm.input[1], { type: 'image', mime_type: 'image/jpeg', data: refs[0].data });
  assert.equal(gm.input[2].mime_type, 'image/png');
  const request = requestFor({ ...opts, provider: 'gemini' }, refs);
  assert.equal(request.endpoint, GEMINI_ENDPOINT);
  assert.equal(request.keyEnv, 'GEMINI_API_KEY');
  assert.throws(() => requestFor({ provider: 'suno' }), /openrouter or gemini/);
  // Dry-run output never carries the image bytes.
  const redacted = JSON.stringify(redactBody(or));
  assert.ok(!redacted.includes(refs[0].data));
  assert.match(redacted, /data:image\/jpeg;base64,\d+ base64 chars omitted/);

  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 3)]);
  const parsed = parseInteraction({ id: 'int-1', status: 'completed', steps: [
    { type: 'user_input', content: [{ type: 'text', text: 'prompt' }] },
    { type: 'model_output', content: [{ type: 'text', text: '[Intro]' }, { type: 'audio', mime_type: 'audio/mpeg', data: mp3.toString('base64') }] }
  ] });
  assert.deepEqual(parsed.bytes, mp3);
  assert.equal(parsed.text, '[Intro]');
  assert.equal(parsed.id, 'int-1');
  assert.match(parseInteraction({ error: { message: 'quota' } }).error, /quota/);
});

test('music CLI --dry-run with --ref and --provider gemini sends nothing, redacts images and records hashes', async t => {
  const directory = await tempdir(t);
  const jpg = path.join(directory, 'key.jpg');
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=green:s=32x18', '-frames:v', '1', jpg]);
  const env = { ...process.env };
  delete env.GEMINI_API_KEY;
  const { stdout } = await exec(process.execPath, [script('music.mjs'), '--dry-run', '--provider', 'gemini', '--ref', jpg, '--duration', '30'], { env });
  const dry = JSON.parse(stdout);
  assert.equal(dry.provider, 'gemini');
  assert.equal(dry.key_env, 'GEMINI_API_KEY');
  assert.equal(dry.references[0].file, 'key.jpg');
  assert.match(dry.references[0].sha256, /^[0-9a-f]{64}$/);
  assert.match(dry.body.input[1].data, /base64 chars omitted/);
  assert.match(dry.listed_price, /0\.04/);
  await assert.rejects(exec(process.execPath, [script('music.mjs'), '--out', directory, '--provider', 'gemini'], { env }), /GEMINI_API_KEY is not set/);
  await assert.rejects(exec(process.execPath, [script('music.mjs'), '--dry-run', '--provider', 'gemini', '--seed', '3'], { env }), /--seed is not part/);
});
