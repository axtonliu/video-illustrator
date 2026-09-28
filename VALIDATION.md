# Validation status — 0.4.0

Designed for Claude Code + Opus 5.5. Other hosts are unverified.
Style references, the cinematic treatment and the 3D starter scene are guidance, not
proof of quality.

## 0.4.0: concept step, onset snapping and contact-sheet self-check, macOS, 2026-09-28 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1)

`npm test`: **25 pass, 0 fail, 0 skipped** (the twenty 0.3.2 tests unchanged, five new).
`beats.mjs` now exports its FFmpeg decoder for reuse; its behaviour and tests are unchanged.

`scripts/onsets.mjs` (`tests/onsets.test.mjs`, three tests):

- Synthetic narration (48 kHz, noise floor about −60 dBFS, voiced bursts with a 3 ms attack at
  0.8, 2.0, 3.3 and 5.7 s). Cues starting 200 ms early, 250 ms late and 300 ms early snapped to
  0.801, 2.001 and 3.301 s (1 ms error each; the test allows 10 ms). A cue whose only onset is
  700 ms away kept its start, got `snap_ms: 0` and was listed as unsnapped; with `--window 0.8`
  it reached the onset. `end`, `text` and a `chars` array pass through unchanged.
- The search window does not reach back past the previous cue's end (minus 50 ms) or forward
  past the cue's own end.
- CLI: one-line stdout summary, `start_raw` and `snap_ms` on every cue, refuses to overwrite,
  rejects a cue without numeric `start <= end`.

Real run (not in the suite): the 20.86 s showcase narration with its speech-recognition
`words.json` (12 phrase cues). All 12 cues snapped, all later than the recognized start, by
437, 253, 151, 369, 118, 240, 276, 94, 281, 77, 283 and 45 ms. This matches the direction and
size of the earlier manual check (phrase starts 0.05–0.44 s early). An independent
`ffmpeg -af silencedetect=n=-36dB:d=0.04` pass put the same speech starts 5–30 ms earlier
than the snapped times; silencedetect reacts to single samples, the script to a 10 ms RMS
window. A short breath at 15.50 s was not taken as the start of the next phrase (it never
reached the loud level). Not auditioned.

`scripts/contact.mjs` (`tests/contact.test.mjs`, two tests):

- Synthetic 12 s clip generated with FFmpeg: 4 s of picture P, 4 s of a different picture Q
  with a textured 96×136 "asset" on it, 4 s of a 20 px/s pan across P. Sampled every 2 s:
  `distinct_scenes` = 2; Q's distance to P was at least 64 of 256; the pan frames stayed under
  64. The asset was found in exactly the two Q samples (score 0.96, box within 3% of the true
  position) and nowhere else (0.44); `fraction` 0.333 marked `estimate: true`. `--scenes 4`
  produced one warning on stderr and in `warnings[]` with exit code 0. The sheet is a 5×2 grid.
- Bar sampling from `downbeats`, extension before the first and after the last downbeat,
  interval sampling, dHash bits and hex, distance bookkeeping, and exact template location.

Baseline on the 0.3.x showcase films (not in the suite; 2 s sampling, no beats file, asset =
the book cover). These are the numbers v0.4 samples should be compared with:

| Film | Samples | `distinct_scenes` | Cover estimate | Cover by eye on the same sheet |
|---|---:|---:|---:|---|
| `5-cinematic-3d.mp4` (30.0 s) | 15 | 7 | 4 of 15 (0.267) | front-facing in 6 of 15, at an angle in 2 more |
| `1-cut-paper.mp4` (25.5 s) | 13 | 9 | 4 of 13 (0.308) | 4 of 13 |

The estimate missed the cinematic cover where a bright light washed over it or the book stood
at an angle; it is a lower bound. Scores on frames without the cover reached 0.54 (a close-up
of the cover's own title lettering), which is why the default threshold is 0.55. By eye the
cinematic film has 8–9 different pictures in 15 samples; the dHash count of 7 missed the cut
from the cover close-up to the open book (distance 54): both frames are a centred rectangle
on a dark ground, which dHash at 17×16 barely separates. Each run took about 16 s.

Document checks: SKILL.md now reads concept → scene list → keyframes → music → beats →
onsets → timeline → preview → contact self-check → final. `brand.json` gained the optional
`making_of` line. These are document checks; no film has been made with 0.4.0 yet.

## 0.3.2: served-root default and music reference images, macOS, 2026-09-27 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0)

`npm test`: **20 pass, 0 fail, 0 skipped** (the seventeen 0.3.0 tests unchanged, three new).

Renderer default root (`tests/render.test.mjs`, new test):

- Run from `project/` with `--input scene/scene.html` and no `--root`, a scene loading
  `../inputs/assets/green.png` renders; the sampled pixel is the asset's green and the
  result JSON reports `root_source: "cwd"`. Run from an unrelated folder, the root falls
  back to the scene's folder and the same image fails to decode. An implicit root is never
  the filesystem root.
- Manual: an earlier pixel-retro scene that loads `../../inputs/book-cover.png` rendered
  a still from its run folder without `--root`; with the 0.3.1 default (scene folder) it
  failed with the same decode error.

Music reference images (`tests/audio.test.mjs`, two new offline tests): image type read
from file bytes (PNG, JPEG, WebP; other files refused), sha256 recorded, at most 10;
OpenRouter body carries `image_url` data URLs after the text, Gemini body carries
`{type: "image", mime_type, data}` blocks; without references both keep the plain text
prompt; `--dry-run` omits image bytes; Gemini response parsing; missing `GEMINI_API_KEY`
and `--seed` with Gemini fail clearly.

Request shapes were taken from the providers' documentation on 2026-09-27, not guessed:
OpenRouter `/api/v1/models` lists `input_modalities: ["text", "image"]` for
`google/lyria-3-clip-preview` and `google/lyria-3-pro-preview`, and its image-input guide
gives the `image_url` content part; the Gemini music-generation guide documents
`POST /v1beta/interactions` with up to 10 images in `input` and audio in
`steps[].content[]`.

Three paid calls, same text (cinematic underscore for a short book promo, confident and
building, 100 BPM, 30 s), references = three 1280×720 JPEG frames from the cinematic 3D
showcase film at 3, 13 and 24 s:

| Run | Provider / model | References | Returned | Measured tempo | Integrated loudness | Cost |
|---|---|---|---|---:|---:|---|
| A | OpenRouter `google/lyria-3-clip-preview`, seed 7 | none | 30.77 s MP3 | 99.91 BPM | −11.5 LUFS | US$0.0396 reported |
| B | OpenRouter `google/lyria-3-clip-preview`, seed 7 | 3 | 30.77 s MP3 | 100.01 BPM | −11.9 LUFS | US$0.0396 reported |
| C | Gemini API `lyria-3-clip-preview` | 3 | 29.20 s MP3 | 99.99 BPM | −12.0 LUFS | US$0.04 listed (no cost in response) |

The images reached the model: OpenRouter's prompt tokens rose from 73 (A) to 4448 (B) at
the same cost, and Gemini's usage reported 774 image input tokens (C). The three files
differ. Run C came back 0.8 s short of 30 s; `music.json` recorded the warning and the WAV
was not padded. Each `music.json` names the provider, model, prompt and each reference
file with its sha256.

Not auditioned: nobody listened to A, B or C for this validation. Whether references make
the music fit the picture better is a listening judgment, and one call per condition
cannot separate the effect of the images from run-to-run variation.

## Showcase samples with 0.4 (2026-09-28)

Two more films were accepted by the author and now lead the showcase grid: editorial tech
(Skill `d539341`, one pass, no revision) and cinematic 3D (Skill `a280c85`, one pass, no
revision; its request carried a director's note on scale and pacing). Same narration and
book cover as the earlier five. A first cinematic pass on 0.4 without the director's note
stayed on a desk and was not accepted; that review produced the scale rules in
`references/cinematic.md`. Both films were judged by the author on viewing; the
contact-sheet counts in `scripts/contact.mjs` were recorded but under-count dark 3D scenes
and are not the acceptance criterion. Inputs, time, cost and music sources are in
[showcase/SAMPLES.md](showcase/SAMPLES.md).

## Showcase samples (2026-09-27)

Five films made by this Skill were accepted by the author for the showcase: cut paper,
ink wash, pixel retro, particles (made with 0.1.1, then one credit-line revision each)
and cinematic 3D (made with 0.3.0, no revision). All use the same narration and book
cover. They show that these five treatments produced a film the author would publish
from a one-sentence request in the author's environment; they do not show that other
styles, content, hosts or machines will do the same. A sixth reference film in the
showcase was made outside this Skill. Inputs, time, cost and music sources are in
[showcase/SAMPLES.md](showcase/SAMPLES.md).

## 0.3.0: 3D route, verified on macOS on 2026-09-27 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0 / Chromium 153, three 0.186.1)

`npm test` ran seventeen tests against actual Chromium and FFmpeg: **17 pass, 0 fail,
0 skipped**. The twelve tests listed under 0.2.0 below ran unchanged against the new
renderer (which now serves scenes over a local HTTP server by default). New in
`tests/three.test.mjs`:

- The three.js starter (`references/three-template.html`, with an FFmpeg test-pattern
  image as the cover) renders a 1-second 320×180 MP4 through the local server in
  software GL: 10 frames, at least 8 distinct frame hashes, `served: "http"`, a
  non-empty `gl_renderer` in the result JSON, no staging folder left behind.
- A scene in `project/scene/` loads `../inputs/assets/green.png` with `--root project/`,
  draws it on a canvas and calls `getImageData`; the captured pixel is exactly
  (0, 255, 0). The same scene with `--file-url` fails with the tainted-canvas error,
  and an `--input` outside `--root` is refused.
- The static server binds `127.0.0.1` on a random port, serves a file with a space in its
  name, answers `/__vi/three/build/three.module.js` with JavaScript, refuses
  `%2e%2e` and `..%2f` traversal, and names `npm ci` when three is missing.
- `--gpu` reports the renderer. On this machine it returned
  `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)` with no
  warning; the test also accepts a software result only when the warning is present.
- Motion blur keeps exposure: 8 accumulated sub-frames and 1 sub-frame give the same mean
  brightness within 5 % (both 57/255 in a manual check). With the accumulation bug found
  during development (auto-clear wiping earlier sub-frames) the same test failed at
  57.19 vs 8.07.

GPU flags were chosen by probing, not guessed: Playwright 1.63 adds
`--enable-unsafe-swiftshader` on macOS and the default headless shell reported
SwiftShader; `--enable-gpu` alone or `--use-angle=metal` alone switched it to ANGLE Metal;
`--ignore-gpu-blocklist` alone did not. `--gpu` passes `--enable-gpu --use-angle=metal`.
A render through the `~/.claude/skills/video-illustrator` symlink also resolved three.js
and the GPU.

Timing, 1920×1080, template scene, fixed sub-frame count, 12 frames (6 in software),
milliseconds per frame after the first:

| Sub-frames | GPU, grain on | GPU, `grain=0` | SwiftShader, grain on |
|---:|---:|---:|---:|
| 1 | 323 | 85 | 671 |
| 8 | 329 | 94 | 2654 |
| 16 | 357 | 113 | 4893 |

First frames took 0.15–0.5 s on the GPU and 3–7 s in software. A full 6-second 1080p
template render on the GPU with adaptive blur (at most 16) took 180 frames at 342 ms
each. Reference points: a flat 2D canvas frame at 1080p captured in 70 ms, a cleared
WebGL canvas in 34 ms; the difference to 323 ms is PNG encoding of grain.

Looked at, not measured: stills at 0.2, 1.4, 2.4 and 5.1 s (1280×720) show the cover on
the book's front face without distortion, the foreground block out of focus, the focus
moving from a background block to the book, the key light pool travelling, and bloom only
on the practical and on speculars; a 1 vs 16 sub-frame comparison at the whip shows
horizontal blur on the background blocks and equal exposure. These are checks of the
starter scene, not of a finished film.

Not verified at the time of this test: a cinematic piece made end to end on the 3D route
(one was made later the same day; see Showcase samples above), spine/back images on the
book (only the neutral fallback ran), GPU rendering on Windows/Linux, and other GPUs.

## 0.2.0: verified on macOS on 2026-09-27 (Node 24.3, FFmpeg 7.1.1)

`npm test` then ran twelve tests against actual Chromium and FFmpeg: **12 pass, 0 fail,
0 skipped**.

Renderer (`tests/render.test.mjs`, carried over from 0.1.1 plus one new test):

- One-second MP4: expected dimensions/frame count, changing frame hashes, adjacent
  SVG asset, short supplied audio padded to the video; no trim warning.
- Refusing an existing output and preserving it when an authorized replacement fails.
- PNG capture at a specified absolute timestamp, verified by pixel data.
- Absolute symlink CLI help works while module import stays inert.
- MP4 export through an absolute symlink at the 1280×720 / 30 fps defaults, with an
  explicit warning before trimming longer source audio.
- **New:** SIGINT and SIGTERM sent mid-render (after frames were written) remove the
  `.video-illustrator-*` staging folder, leave no partial MP4, and exit with 130 / 143.
  Against the 0.1.1 renderer this test fails.

Audio (`tests/audio.test.mjs`, new):

- `beats.mjs` on FFmpeg-generated click tracks at 128 and 93 BPM with an accented bar
  start: tempo within 2 % (measured 127.99 and 93.00), every beat within 30 ms, and
  downbeats on the accented beat. A manual run at 150 and 75 BPM measured 150.00 and
  75.01.
- `sfx.mjs`: all four types (whoosh, impact, tick, paper) are non-silent, normalized
  to about −1 dBFS, have the requested length and are deterministic per seed; the CLI
  writes 48 kHz mono WAV readable by ffprobe and refuses to overwrite.
- `music.mjs` offline: request shape and model choice, SSE audio reassembly, format
  detection, stream error surfacing, `--dry-run` without a key, and a clear error when
  the key is absent.

Real runs outside the test suite:

- `music.mjs`, one paid call to `google/lyria-3-clip-preview` via OpenRouter (prompt:
  cinematic hybrid, 120 BPM, 30 s). It returned a 30.77 s MP3 (48 kHz stereo) and
  `<instrumental>` as text; the script wrote a 30.00 s WAV with a tail fade and
  `music.json`. OpenRouter reported a cost of US$0.0396.
- `beats.mjs` on that track measured **120.01 BPM** (requested 120; the requested
  value is a prompt, not ground truth), 62 beats with inter-beat intervals of
  0.499–0.511 s. Downbeat confidence was 1.02, so the bar phase there is a guess.
- `sfx.mjs` default set: whoosh 0.70 s, impact 1.20 s, tick 0.06 s, paper 0.45 s, all
  peaking at −1.0 dBFS.
- The documented mix command in `rendering.md`, run verbatim on a macOS `say`
  narration, the Lyria track and two effects, produced a 20.00 s 48 kHz stereo WAV at
  −15.6 LUFS integrated with −1.5 dBFS peak. A separate measurement showed the music
  bed ducked by about 7.5 dB under the voice and unchanged after it.

Not auditioned: nobody listened to the generated music, the effects or the mix for
this validation; the checks above are measurements, not taste.

Skill frontmatter and local Markdown links validate. SKILL.md read-back confirms the
input-folder convention, `display_name`, the color-follows-style rule, foreground
rendering, keyframes-before-full-render, the cinematic entry point and the paid-call
disclosure. These are document checks, not proof that a model will follow them.

## Pending

One cinematic piece has been made end to end (voice + real assets + generated music +
effects, 0.3.0, the cinematic 3D showcase sample). Installation on another machine, other
hosts, Windows/Linux, automatic style selection, `brand.json` fields beyond
`display_name`, the Pro and `lyria-3.5` music models, whether reference images audibly
improve the fit, and most visual styles remain unverified.
