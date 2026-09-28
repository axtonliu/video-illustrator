import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../scripts/beats.mjs';
import { synthesize, wavBytes, TYPES, SAMPLE_RATE } from '../scripts/sfx.mjs';
import { buildRequest, parseStream, detectFormat, CLIP_MODEL, PRO_MODEL } from '../scripts/music.mjs';

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
