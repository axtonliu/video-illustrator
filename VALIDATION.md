# Validation status — 0.9.0

Designed for Claude Code + Opus 5.5. Other hosts are unverified.
Style references, the cinematic treatment and the 3D starter scene are guidance, not
proof of quality.

## 0.9.0: one system, styles in every mode, macOS, 2026-10-20 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0, three 0.186.1)

`npm test`: **78 pass, 0 fail, 0 skipped** (the 72 tests before this release, six new: one in
`tests/styles.test.mjs`, two in `tests/mechanism.test.mjs`, and three in `tests/brand.test.mjs`: the
user's default pack, its rules documents, and a package check that no text file names an absolute
path on the author's machine, a private folder or internal tool, an e-mail address or a key). Two expectations changed on purpose:
the atlas counts went from 24 to 26 styles (`diagram-3d` and `particles` added), and the style-name
pattern now allows a digit.

What changed: SKILL.md runs every mode through one five-step spine; the style atlas registers the
explainer look as `diagram-3d` and the showcase particles look as `particles`, and says for each of
the 26 styles whether and how it carries a mechanism (the new test checks one row per style);
explainer and episode modes pick one main style from the atlas; `references/mechanism-template-2d.html`
is a 2D starter that reads the same `SUBJECTS`, `LINKS` and `STEPS` as the 3D template (a test
compares the three lists byte for byte) and ships with cut-paper craft.

The same example mechanism (the 3D template's three subjects, three links and five steps) was
rendered in three looks with `--gpu`: `diagram-3d` (the 3D template as shipped), `particles` (the 3D
template with its meshes drawn as surface-sampled points, links as dotted streams, the packet as an
amber cluster) and `cut-paper` (the 2D starter as shipped). Each has 16:9 stills at 3, 5 and 7.2 s
and a 9:16 still at 7.2 s, looked at one by one and as a contact image: titles and
cards readable, no card on a subject, nothing in either caption band, the packet on the named link.
The 2D test checks the landscape bottom 18% and the portrait lower quarter stay plain paper, that
captions change only the band, and that the same t gives the same pixels.

Faults found on those frames and fixed in the starters: in the 3D template, a side card at the frame
edge was pushed back over its subject (the planner in landscape, the worker and storage cards in
portrait); the camera fit now measures the cards and leaves room for them inside the 5% margin
(compared on before and after stills). In the 2D starter, an early
cut edge was too rough on small pieces, side cards shrank the portrait subjects too far, and a card's
tilt and shadow reached one or two pixels into the landscape band.

Not checked: a real narrated passage in a style other than `diagram-3d`; a whole episode in
`particles` or `cut-paper`; a full-length motion render of the two new looks (stills only); the other
atlas styles the fit table marks as suited; a host pipeline's own 3D author on the changed template.

## 0.8: episode mode, macOS, 2026-10-19 to 20 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0, three 0.186.1)

Episode mode was built after 0.7.0 and first published as part of 0.9.0; there was no separate
0.8.0 package.

`npm test` at the last episode-mode change: **72 pass, 0 fail, 0 skipped** (the forty-eight 0.7.0
tests, twenty-four new; re-run on 2026-10-20 from that state with the same result). No 0.7 test
changed its expectation.

- `tests/facts.test.mjs` (3): a clean fact table passes and a script may cite only facts that exist;
  each kind (claim, measured, reported, estimate, unknown) demands what the picture may say about
  it; the exports for review, for scenes and for the publish notes' source list.
- `tests/footage.test.mjs` (3): licences are read as the source states them, and YouTube is always
  `unknown`; `fetch` downloads only what a person approved, plus open licences when asked; a clip
  letterboxes 4:3, burns its source label top right and keeps normalized sound.
- `tests/explain.test.mjs` (5): the explanation-plan check passes a worked plan and counts only
  spoken lines; fails a plan that skipped the divergent step; makes a concept with no possible
  demonstration say why; the markdown table names the chosen devices; the import-free checker gives
  another tool the same verdict with its own line references.
- `tests/episode.test.mjs` (13): caption units (Latin words and numbers whole, Chinese by
  character) and lighting only the unit being said; alignment (the script's wording wins, the
  speech gives the timing, misses are interpolated); one take cut halfway through the pause between
  segments; segments rendered once and reused when unchanged, with narration laid under and
  captions burnt in; footage covering its lines and holding its last frame; footage at another
  frame rate keeps its speed, and only that changes the segment hash; light captions over footage;
  footage as a rounded card beside the scene; a step tag on full-frame footage. Two of these come
  from faults in the real run below: a millisecond-rounded duration keeps its whole frame count,
  and two footage windows that meet between frames leave no scene frame between them.

**One real episode.** A Chinese, 16:9 science explainer on the second-generation Tesla Roadster,
made with these steps by Claude Code + Opus 5.5 in the author's environment: angle, research into
a fact table (33 entries), a primary-source check, a script with every number cited from the
table, footage from the maker's own verified channel only, a three.js scene, one narration take,
alignment, render and captions. The narration was a generated voice produced outside this Skill;
the last finishing pass (the author's caption style, channel outro) was also done outside it.

- Primary sources changed the facts. The official 23-minute livestream was transcribed locally with
  Whisper and gauges were read off its frames; four statements in secondary reports did not match
  what was said (for example a grip figure reported as 1.26 g is 1.6 g in the livestream). Step 2
  of `references/episode.md` now sends every number to a primary source first.
- First cut: seven segments, per-segment alignment 97–100%, 189.7 s rendered in 4 min 48 s. The
  author rejected the first car model as too crude; a smooth lofted body then read as soft and was
  replaced by a faceted one, and the fourth version moved to a lofted shell with panel lines and
  per-part materials, which is now the guidance in `references/episode.md`.
- The narration had been generated before three script edits, so the second version had to hold
  the picture in silence where a line had been cut. The third version re-voiced the whole script
  after the author's six notes (the two demonstrations told separately, the exploded view narrated, the closing
  reminders dropped, official footage beside the 3D, suction, downforce, cornering and thrust
  animated, captions in the author's style). `align.mjs --master` was added there and checked on
  the earlier take: all seven cut points matched the hand cuts. Six segments, 1080p, 183.7 s,
  rendered in about 7 minutes, −16.8 LUFS integrated, −1.2 dBFS peak.
- A fourth version kept script, voice and footage and rebuilt the scene on the 3D template's new
  defaults (studio environment, Neutral tone mapping, contact shadow, GTAO with MSAA, clearcoat
  materials), with a 9:16 version from the same scene file; it was later re-voiced once more after a
  script rewrite. Overview frames every 3–4 s and zoomed key frames caught labels covering arrows
  and cards covering the car; a frame-by-frame scan in the finishing pass caught a one-frame flash of the
  scene where two clips met between frames and a bare frame at the end of a segment whose length
  was rounded up. Both are fixed in `scripts/episode.mjs` and `scripts/render.mjs`, each
  with a test. A timer frozen at 01:00 inside a sped-up livestream clip contradicted an on-screen figure and
  was only visible in a zoomed single frame; the clip was re-cut.

Not checked: a second topic, or a mechanism that is not a vehicle; English narration; a vertical
episode built from scratch rather than from a 16:9 scene; anyone other than the author running it
from a one-sentence request; captions and finishing done only with this Skill's own tools on the
final version; Linux and Windows.

## 0.7.0: explainer mode, macOS, 2026-10-18 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0, three 0.186.1)

`npm test`: **48 pass, 0 fail, 0 skipped** (the forty-three 0.6.0 tests, three new in
`tests/excerpt.test.mjs`, two in `tests/mechanism.test.mjs`). No 0.6 test changed its expectation.

`scripts/excerpt.mjs`: tested with a synthetic SRT (CRLF and BOM, a two-line cue) and a
synthetic 12 s video. Cues crossing either edge are kept, cut and marked `clipped`; cues
outside are dropped; the WAV is 48 kHz stereo PCM within 30 ms of the window; existing files
are refused without `--overwrite`; a window with no cue is an error.

`references/mechanism-template.html`: the example renders in both shapes from one file;
frames keep changing; with `captions=1` the caption appears in the portrait lower quarter,
which the delivered picture leaves plain, and nothing above it changes.

**One real passage.** A 25 s window (43–68 s) of the author's own published talking-head
video, from its final SRT and its mixed master (the narration audio keeps the music bed; no
isolated voice track was used). The window starts and ends on half sentences, which the
excerpt marks; the clean boundaries would be 40.43–68.14 s. Five subjects, three links,
eleven steps, each at the start of the cue that says it. v1 and one substantive revision (v2:
each packet carries a label in the narration's own words, so "the instruction" and "the
result" read differently; an earlier v2 attempt, a dashed "local" zone, was dropped because
its tag sat on the tools in landscape). Each version rendered silent 16:9 and 9:16 plus
narrated, captioned previews: 750 frames, 25.000 s, with `--gpu` (ANGLE Metal) at 37–43 ms per
frame, so about 30 s per file. Contact sheets of both shapes were looked at: titles readable,
no card covering a subject, header or another card, packets on the named link at the named
time. A first draft printed file names the narration never says; they were replaced with its
words, and explainer.md now forbids it.

A later pass (v3, same content) aligned the template with the author's own production rules
for bright mechanism 3D: fixed colour roles with one warm accent on screen at a time, a still
camera, no idle spinning, a 5% margin, nothing below 75% of the height in portrait and nothing
in the bottom 18% in landscape. Measured on the delivered 9:16 clip: every frame's band below
75% is a single flat luma value (YMIN = YMAX = 227). A test now checks the landscape band too
and fails when the safe area is widened.

Not checked: a second real passage or a different kind of mechanism; a person other than the
author using it from a one-sentence request; a clean-context review of the clips (the
aesthetic rules were written for promos and were not applied); dropping the inserts into a
real edit; Linux and Windows.

## 0.6.0: brand pack v2, check and brand sheet, macOS, 2026-10-01 (Apple M4 Pro, Node 24.3, Playwright 1.63.0)

`npm test`: **43 pass, 0 fail, 0 skipped** (the thirty-six 0.5.0 tests, seven new in
`tests/brand.test.mjs`). No 0.5 test changed its expectation.

`scripts/brand.mjs --check`:

- Each of the six error codes (`json_parse`, `schema_unknown`, `file_missing`, `hex_invalid`,
  `film_palette_incomplete`, `accent_max_area_range`) has at least one failing pack; the CLI
  exits 1 and prints the code. Each of the 31 warning codes has a pack that produces it while
  `ok` stays true. A further assertion reads every `error(...)`/`warn(...)` code from the script
  and fails if one has no case.
- v1: the 0.5 `brand.example.json` content (no `schema`) passes with no errors; its only
  warning is new, `contrast_low` (gold accent on cream, 2.18:1, under the 3:1 non-text limit).
  A v1 file with a font file, a licence beside it and a logo passes with no warnings.
- `--tokens`: names, `name(mode)` and dotted paths resolve against an upstream token JSON;
  mismatches and unresolved names are warnings. A private pack with six `palette_sources`
  checked against its upstream token file: 0 errors, 0 warnings.
- The neutral examples (`references/brand.example.json`, `references/brand-example/`) pass with
  no warnings, and a test keeps their shared fields identical.

`--sheet`: the example pack renders a 1920 × 3236 PNG in about 1 s (one measuring pass, then
`render.mjs --still`); a pack with an error is refused and no PNG is written. The sheet was
looked at for the example pack and for a private dark pack (19 MB of fonts linked, not
copied); text, swatches, motifs, the end card iframe and the motion curves all render.

Private-value guard: the test hashes every hex colour in the package's text files and every
word in the brand files and compares them with truncated sha256 hashes of the author's private
token values and names, so neither the package nor the test lists them. Tried by hand: each
listed private value is recognised; "Remember December, members" is not.

Not checked: AR-16 with a real film and a clean-context reviewer (the rule and the reviewer
inputs are in place; no film has been made with a v2 pack yet); Linux and Windows (the sheet
links the pack with a symlink, a junction on Windows); font family names are not read from the
font files.

## 0.5.0: peak-aligned sound effects, motion check, tokens, transitions and review, macOS, 2026-09-30 (Apple M4 Pro, Node 24.3, FFmpeg 7.1.1, Playwright 1.63.0)

`npm test`: **36 pass, 0 fail, 0 skipped** (the twenty-five 0.4.0 tests, eleven new). One 0.4
test changed its expectation: the synthetic contact clip (two 4 s held pictures, then a pan to
the last frame) now also produces the two new motion warnings, so it expects three warnings
instead of one.

`scripts/sfx.mjs` (`tests/audio.test.mjs`, three new tests):

- `sfx.json` records each file's `peak_s`, the time of its largest 16-bit sample as written.
  With seed 1: whoosh 0.350 s of 0.7 s, paper 0.268 of 0.45, impact 0.006, tick 0.004, riser
  1.508 of 1.6, sparkle 0.099. The 0.4 mix example delayed the whoosh by the beat time
  itself, so its loudest moment sounded about 10 frames late (the research note measured
  0.291 s with a 10 ms RMS window; the sample maximum is 0.350 s; either way it was late).
- Placement through FFmpeg on a generated whoosh: targets 1.0 s (adelay), 0.1 s (head trimmed
  with `atrim` + `asetpts`), 0.12 s at +2 semitones and 0.9 s at −2 semitones all put the
  loudest decoded sample within 2 ms of the target. Without `asetpts` the trimmed effect keeps
  its old timestamps and lands late again; the helper always adds it.
- `--measure` on a stereo 44.1 kHz user file: `type: "user"`, `peak_s` within 1 ms of the
  decoded maximum, file hash unchanged, entries merged with the synthesized ones.

AAC offset of `render.mjs` (click test, `tests/render.test.mjs`, new test; also run by hand
at 320×180): a 0.5 ms click at 1.000 s in the source and a white flash from frame 30.

| Source audio | Decoded click, edit list honoured | Edit list ignored | Offset in frames (30 fps) |
|---|---:|---:|---:|
| 48 kHz WAV | 0.99998 s (−0.02 ms) | 1.0213 s (+21.3 ms) | 0.001 / 0.64 |
| 44.1 kHz WAV | 0.99998 s (−0.02 ms) | 1.0232 s (+23.2 ms) | 0.001 / 0.70 |

The extra 21–23 ms is the AAC encoder's 1024 priming samples; the MP4 edit list hides them
and both streams report `start_time` 0. Under one frame either way, so `render.mjs` does not
compensate (the 0.5 design rule). The test fails if a future FFmpeg pushes it past one frame.
Not checked: QuickTime, browsers, or platform transcodes (YouTube, Bilibili) individually.

`scripts/contact.mjs` motion (`tests/contact.test.mjs`, two new tests): an FFmpeg-generated
10 s clip (2 s moving, 4 s frozen, 3.5 s moving and dark, 0.5 s frozen) measured exactly
`longest_still_s` 4.0 (2.0–6.0 s), `end_hold_s` 0.5 and `dark_ratio` 0.35; default limits warned
on the first two only, `--dark-max 0.3` added the third, exit code 0 throughout. Unit cases
cover run lengths, a fade to black after a held picture (counted as held) and a clip that
never moves.

Baseline on earlier films (not in the suite; defaults: still threshold 1.0 of 255 on
96×54 grey thumbnails at 4 fps, dark below grey 40):

| Film | `longest_still_s` | `end_hold_s` | `dark_ratio` | Warnings |
|---|---:|---:|---:|---|
| `1-cut-paper.mp4` | 1.25 | 2.75 | 0 | none |
| `2-ink-wash.mp4` | 2.75 | 1.75 | 0 | none |
| `3-pixel-retro.mp4` | 2.5 | 2.25 | 0.302 | none |
| `4-particles.mp4` | 4.75 (17.25–22.0 s) | 2.25 | 0.951 | still, dark |
| `5-cinematic-3d.mp4` (0.3) | 1.75 | 4.5 | 0.375 | none |
| `7-editorial-tech.mp4` (0.4) | 1.25 | 4.0 | 0.055 | none |
| `8-cinematic-3d-v04.mp4` (0.4 rerun) | 0.5 | 3.5 | 0.476 | none |
| 0.4 cinematic, first run | 1.0 | 3.5 | 0.451 | none |

By eye, the particle film's 4.75 s is a held layout in which small lines draw themselves (a
question mark, a graph): under about 1% of the frame changes, which the check counts as
still, as documented. The first 0.4 cinematic run, criticised for ten seconds on book pages,
does not warn: the camera kept moving, so that problem belongs to the scene count and the
sheet, not to the motion check. Three films end on a fade to black after a hold; before the
fade-tolerant end hold they measured 0 s. A first threshold of 0.6 split the 0.3 cinematic
film's held end card (grain and a slow push, differences 0.5–0.9) into pieces; 1.0 does not.

`tests/styles.test.mjs` (five new tests, document checks): all 25 atlas entries (24 styles and
the cinematic look) have Motion tokens that parse; each declared overshoot equals what its
entrance curve does (a curve marked `none` never passes 1; a curve with overshoot stays within
its declared percentage); every end hold is at least the 1.0 s `contact.mjs` limit; no two
styles share a token set (24 distinct entrance curves among the 25). Every style has 2–4 Signature craft
items, each with a number, none copied between styles. transitions.md has nine forms, each with
use, frames (with numbers), a Canvas and a three.js recipe, and where not to use it.
aesthetic-rules.md rules are numbered in order and each cites a quote or an external benchmark.
Examples in SKILL.md and references/ contain none of the showcase films' themes.

Not yet validated: no film has been made with 0.5.0. The tokens, transitions, craft cards,
acting subject and the independent review are guidance whose effect on a film is untested;
the planned check is a cut-paper rerun of the same narration and cover at 1920×1080 beside the
0.3 sample. (Later: four 0.5 films were made; see "Showcase samples with 0.5" below.)

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

## Showcase samples with 0.5 (2026-09-30)

Four films made with Skill 0.5.0 (commit `fe9c9b9`) replaced the earlier cut-paper, ink-wash,
pixel-retro and particle samples on the showcase grid. Each was one pass of a one-sentence
request with 0 revisions, on the same narration and book cover, reusing the earlier sample's
Lyria music from `inputs/music/` (no new Lyria call). The independent review ran in every film:
pixel retro passed AR-01, AR-02 and AR-06 in round 1; the other three went to round 2 and still
had at least one ✗ there, which the run fixed once more without a further review. A first
cut-paper pass on `3aa99e4`, with only one review fix round, was not adopted and led to the
second-round rule. These films show the 0.5 rules producing a film the author accepted in
these four styles; they do not separate the effect of each rule. Inputs, time, cost and review
rounds are in [showcase/SAMPLES.md](showcase/SAMPLES.md); the earlier versions stay listed there.

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
hosts, Windows/Linux, automatic style selection, a v2 brand pack used in a
real film (only the check and the brand sheet are tested), the Pro and `lyria-3.5` music models, whether reference images audibly
improve the fit, and most visual styles remain unverified.
