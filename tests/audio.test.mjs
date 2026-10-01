import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../scripts/beats.mjs';
import { synthesize, wavBytes, TYPES, SAMPLE_RATE, placeSfx, peakSeconds } from '../scripts/sfx.mjs';
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

// Loudest sample of a 16-bit mono WAV written by sfx.mjs (44-byte header), in seconds.
async function wavPeak(file) {
  const bytes = await readFile(file);
  const pcm = new Int16Array(bytes.buffer.slice(bytes.byteOffset + 44, bytes.byteOffset + bytes.length));
  return peakSeconds(pcm);
}

// Decode a filtered effect to mono 48 kHz float and return the time of its loudest sample.
async function peakAfter(input, filter, pad = 3) {
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', input, '-af', `aformat=sample_rates=48000:channel_layouts=mono,${filter},apad=whole_dur=${pad}`, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], { encoding: 'buffer', maxBuffer: 64 << 20 });
  return peakSeconds(new Float32Array(stdout.buffer, stdout.byteOffset, stdout.length / 4));
}

test('sfx.json: peak_s of every generated file is the time of its loudest sample', async t => {
  const directory = await tempdir(t);
  await exec(process.execPath, [script('sfx.mjs'), '--out', directory, '--seed', '7']);
  const manifest = JSON.parse(await readFile(path.join(directory, 'sfx.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.files).sort(), TYPES.map(type => `${type}.wav`).sort());
  for (const type of TYPES) {
    const entry = manifest.files[`${type}.wav`];
    const truth = await wavPeak(path.join(directory, `${type}.wav`));
    assert.ok(Math.abs(entry.peak_s - truth) <= 0.0005, `${type}: peak_s ${entry.peak_s} vs sample maximum at ${truth}`);
    assert.equal(entry.type, type);
    assert.equal(entry.seed, 7);
    assert.ok(entry.peak_s >= 0 && entry.peak_s < entry.duration_s);
  }
  // The 0.4 mix example delayed a whoosh by the beat time itself; its peak is far from the file head.
  assert.ok(manifest.files['whoosh.wav'].peak_s > 0.2, `whoosh peak ${manifest.files['whoosh.wav'].peak_s}`);
  assert.ok(manifest.files['riser.wav'].peak_s > 0.8 * manifest.files['riser.wav'].duration_s, 'a riser peaks near its end');
});

test('sfx placement: adelay when the peak comes after the file start, atrim (never a negative delay) otherwise', async t => {
  assert.deepEqual(placeSfx({ target_s: 1.741, peak_s: 0.35 }), { target_s: 1.741, peak_s: 0.35, adelay_ms: 1391, atrim_s: 0, filter: 'adelay=1391:all=1' });
  const early = placeSfx({ target_s: 0.1, peak_s: 0.35 });
  assert.equal(early.adelay_ms, 0);
  assert.equal(early.atrim_s, 0.25);
  assert.match(early.filter, /^atrim=start=0\.25,asetpts=PTS-STARTPTS,afade=t=in:d=0\.004$/);
  assert.equal(placeSfx({ target_s: 0.35, peak_s: 0.35 }).filter, 'anull');
  assert.doesNotMatch(placeSfx({ target_s: 0, peak_s: 0.35 }).filter, /adelay|afade/);
  assert.throws(() => placeSfx({ target_s: -1, peak_s: 0.1 }), /nonnegative/);
  const up = placeSfx({ target_s: 2, peak_s: 0.35, semitones: 12 });
  assert.equal(up.peak_s, 0.175);                                     // an octave up plays twice as fast
  assert.equal(up.adelay_ms, 1825);

  // Real FFmpeg check on a generated whoosh: the loudest sample lands on the target.
  const directory = await tempdir(t);
  await exec(process.execPath, [script('sfx.mjs'), '--out', directory, '--type', 'whoosh']);
  const whoosh = path.join(directory, 'whoosh.wav');
  const { peak_s } = JSON.parse(await readFile(path.join(directory, 'sfx.json'), 'utf8')).files['whoosh.wav'];
  for (const [target_s, semitones] of [[1.0, 0], [0.1, 0], [0.12, 2], [0.9, -2]]) {
    const placement = placeSfx({ target_s, peak_s, semitones });
    if (target_s < peak_s && !semitones) assert.ok(placement.atrim_s > 0 && placement.adelay_ms === 0);
    const landed = await peakAfter(whoosh, placement.filter);
    assert.ok(Math.abs(landed - target_s) <= 0.002, `target ${target_s} (${semitones} st): peak at ${landed} with ${placement.filter}`);
  }
});

test('sfx --measure records a user recording as type user without changing it; --place reads it back', async t => {
  const directory = await tempdir(t);
  const inputs = path.join(directory, 'inputs', 'sfx'), out = path.join(directory, 'audio sfx');
  await mkdir(inputs, { recursive: true });
  const hit = path.join(inputs, 'door hit.wav');
  // Stereo 44.1 kHz: a quiet tone, then a loud decaying burst starting at 0.62 s.
  await exec('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', "aevalsrc='0.2*sin(2*PI*330*t)*lt(t\\,0.5)+0.9*gte(t\\,0.62)*exp(-(t-0.62)*30)*sin(2*PI*180*t)':s=44100:c=stereo:d=1.2", hit]);
  const before = createHash('sha256').update(await readFile(hit)).digest('hex');
  await exec(process.execPath, [script('sfx.mjs'), '--out', out, '--type', 'tick']);
  const { stdout } = await exec(process.execPath, [script('sfx.mjs'), '--measure', hit, '--out', out]);
  assert.equal(JSON.parse(stdout).measured[0].type, 'user');
  const manifest = JSON.parse(await readFile(path.join(out, 'sfx.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.files).sort(), ['door hit.wav', 'tick.wav']);   // merged, not replaced
  const entry = manifest.files['door hit.wav'];
  assert.equal(entry.type, 'user');
  assert.equal(entry.seed, null);
  assert.equal(path.resolve(out, entry.path), hit);
  const truth = await peakAfter(hit, 'anull', 1.2);
  assert.ok(Math.abs(entry.peak_s - truth) <= 0.001, `peak_s ${entry.peak_s} vs ${truth}`);
  assert.ok(entry.peak_s > 0.6 && entry.peak_s < 0.7);
  assert.equal(createHash('sha256').update(await readFile(hit)).digest('hex'), before);
  const placed = JSON.parse((await exec(process.execPath, [script('sfx.mjs'), '--place', 'door hit.wav', '--at', '0.3', '--json', path.join(out, 'sfx.json')])).stdout);
  assert.equal(placed.adelay_ms, 0);
  assert.equal(placed.atrim_s, Math.round((entry.peak_s - 0.3) * 1000) / 1000);
  await assert.rejects(exec(process.execPath, [script('sfx.mjs'), '--place', 'missing.wav', '--at', '1', '--json', path.join(out, 'sfx.json')]), /no peak_s/);
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
