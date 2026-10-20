import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveCandidates, clipArgs, commonsCandidates, fetchApproved, licenceClass, mergeCandidates, reviewHtml, youtubeCandidates } from '../scripts/footage.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/footage.mjs', import.meta.url));

async function tempdir(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'video illustrator footage '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('footage: licences are read as the source states them; YouTube is always unknown', () => {
  assert.equal(licenceClass('Public domain'), 'open');
  assert.equal(licenceClass('CC BY-SA 4.0'), 'open');
  assert.equal(licenceClass('', 'https://creativecommons.org/licenses/by-nc-nd/4.0/'), 'restricted');
  assert.equal(licenceClass('', ''), 'unknown');
  const commons = commonsCandidates({ query: { pages: { 7: { pageid: 7, index: 1, title: 'File:Landing.webm', imageinfo: [{ url: 'https://upload.example/Landing.webm?utm=x', descriptionurl: 'https://commons.example/File:Landing.webm', thumburl: 't.jpg', duration: 30.04, width: 1920, height: 1080,
    extmetadata: { LicenseShortName: { value: 'Public domain' }, Artist: { value: '<a href="x">U.S. Space Force</a>' } } }] } } } });
  assert.deepEqual(commons[0], { id: 'commons:7', source: 'commons', title: 'Landing.webm', page: 'https://commons.example/File:Landing.webm', media: 'https://upload.example/Landing.webm', thumb: 't.jpg', duration: 30.04, size: '1920x1080', creator: 'U.S. Space Force', credit: null, licence: { name: 'Public domain', url: null, class: 'open' } });
  const archive = archiveCandidates({ response: { docs: [{ identifier: 'old-reel', title: 'Old reel', licenseurl: 'http://creativecommons.org/publicdomain/mark/1.0/', creator: ['A', 'B'] }] } });
  assert.equal(archive[0].licence.class, 'open');
  assert.equal(archive[0].creator, 'A, B');
  const yt = youtubeCandidates([JSON.stringify({ id: 'abc', title: 'Clip', channel: 'Chan', duration: 12, webpage_url: 'https://www.youtube.com/watch?v=abc' }), '']);
  assert.equal(yt[0].licence.class, 'unknown');
  assert.equal(yt[0].creator, 'Chan');
  const merged = mergeCandidates({ items: [{ ...yt[0], approved: true }] }, [{ ...yt[0], approved: null }, { ...commons[0], approved: null }]);
  assert.deepEqual(merged.items.map(c => [c.id, c.approved]), [['youtube:abc', true], ['commons:7', null]]);
  const html = reviewHtml(merged);
  assert.match(html, /class="unknown"[\s\S]*youtube:abc[\s\S]*approved: <b>true<\/b>/);
  assert.ok(!html.includes('<script>alert'));
});

test('footage: fetch downloads only what a person approved, plus open licences when asked', async t => {
  const directory = await tempdir(t);
  const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'video/webm' }); res.end(`bytes of ${req.url}`); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const item = (id, cls, approved) => ({ id, title: id, page: `${base}/page/${id}`, media: `${base}/${id}.webm`, creator: 'C', licence: { name: cls, class: cls }, approved });
  const table = { items: [item('commons:1', 'unknown', true), item('commons:2', 'unknown', null), item('commons:3', 'open', null), item('commons:4', 'open', false), item('commons:5', 'restricted', null)] };
  const strict = await fetchApproved({ table, out: path.join(directory, 'a') });
  assert.deepEqual(strict.map(r => [r.id, r.why]), [['commons:1', 'approved by a person']]);
  assert.equal(await readFile(path.join(directory, 'a', strict[0].file), 'utf8'), 'bytes of /commons:1.webm');
  assert.match(strict[0].sha256, /^[0-9a-f]{64}$/);
  const open = await fetchApproved({ table, out: path.join(directory, 'b'), includeOpen: true });
  assert.deepEqual(open.map(r => r.id), ['commons:1', 'commons:3']);
});

test('footage clip letterboxes 4:3, burns the source label top right and keeps normalized sound', async t => {
  const directory = await tempdir(t);
  const source = path.join(directory, 'archive.mp4');
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x808080:size=640x480:rate=25:duration=6', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=6',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', source]);
  const out = path.join(directory, 'clip.mp4');
  await exec(process.execPath, [script, 'clip', '--input', source, '--from', '1', '--to', '3.5', '--label', 'Footage: archive reel', '--out', out]);
  const info = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', out])).stdout);
  const video = info.streams.find(s => s.codec_type === 'video');
  assert.deepEqual([video.width, video.height], [1280, 720]);
  assert.ok(info.streams.some(s => s.codec_type === 'audio'));
  assert.ok(Math.abs(Number(info.format.duration) - 2.5) < 0.1, info.format.duration);
  const pixel = async (x, y) => [...(await exec('ffmpeg', ['-v', 'error', '-ss', '1', '-i', out, '-frames:v', '1', '-vf', `crop=1:1:${x}:${y},format=rgb24`, '-f', 'rawvideo', '-'], { encoding: 'buffer' })).stdout];
  assert.ok((await pixel(20, 360)).every(v => v < 20), 'pillarbox bars stay black');
  assert.ok((await pixel(640, 600)).every(v => Math.abs(v - 128) < 20), 'the picture is not cropped or recoloured');
  const label = await exec('ffmpeg', ['-v', 'error', '-ss', '1', '-i', out, '-frames:v', '1', '-vf', 'crop=360:70:900:10,signalstats,metadata=print:key=lavfi.signalstats.YMAX:file=-', '-f', 'null', '-']);
  assert.ok(Number(label.stdout.match(/YMAX=(\d+)/)[1]) > 200, 'white label text in the top-right corner');
  await assert.rejects(exec(process.execPath, [script, 'clip', '--input', source, '--from', '1', '--to', '3.5', '--out', out]), /--overwrite/);
  const muted = clipArgs({ input: 'a', from: 0, to: 1, out: 'b', audio: 'mute' });
  assert.ok(muted.includes('-an') && !muted.includes('drawtext'));
});
