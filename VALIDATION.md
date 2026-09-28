# Validation status — 0.3.0

Designed for Claude Code + Opus 5.5. Other hosts are unverified.
Style references, the cinematic treatment and the 3D starter scene are guidance, not
proof of quality.

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
`display_name`, the Pro music model and most visual styles remain unverified.
