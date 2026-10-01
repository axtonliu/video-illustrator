# Local HTML rendering

Use this route for a fresh standalone clip. It is a small local renderer, not a video model or a remote service.

## Setup and one-pass dependency check

Requirements: Node.js 20+, FFmpeg, ffprobe, Playwright and its installed Chromium, and the pinned `three` package for the 3D route (both npm packages come from `npm ci`). This release does not fall back to a personal Chrome installation.

Run this check from the skill directory. It reports all missing requirements together, without installing anything:

```sh
node --version
ffmpeg -version
ffprobe -version
node --input-type=module <<'JS'
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const failures = [];
if (Number(process.versions.node.split('.')[0]) < 20) failures.push('Node.js 20+ required');
for (const command of ['ffmpeg', 'ffprobe']) {
  const result = spawnSync(command, ['-version'], {stdio: 'ignore'});
  if (result.error || result.status !== 0) failures.push(command + ' missing or not executable');
}
try {
  const {chromium} = await import('playwright');
  if (!existsSync(chromium.executablePath())) failures.push('Playwright Chromium missing');
} catch { failures.push('Playwright package missing'); }
console.log(failures.length ? failures.join('\n') : 'Dependency files present; browser launch still needs verification.');
process.exitCode = failures.length ? 1 : 0;
JS
```

If `node --version` fails, the JS check cannot run: still read both FFmpeg checks, and report Node missing plus Playwright/Chromium unverified. File existence does not prove browser launch permissions. Follow the host's installation permissions for actual missing dependencies. From the skill folder, the package/browser setup is `npm ci` followed by `npx playwright install chromium`. Do not run setup when already satisfied, and do not report a video as rendered when setup failed.

## Scene contract

Create a complete local `scene.html`. Use Canvas 2D, SVG, CSS or a combination for the 2D route, or three.js for the [3D route](#3d-route-threejs). No framework is required. Use local assets or system fonts when appropriate; avoid remote font/image dependencies that can change or fail during export.

The renderer serves the page from a private `http://127.0.0.1` server on a random port, closed after the render. By default it serves the current working directory when the scene is inside it, otherwise the scene's own folder; so running from `project/`, `scene/scene.html` can load `../inputs/assets/cover.png` without extra flags. Pass `--root <dir>` to choose the served folder explicitly (the scene must be inside it). The result JSON reports `root` and `root_source` (`cwd`, `scene` or `flag`). Files outside the root and path traversal are refused, and the filesystem root is never chosen implicitly. Because images come from the same origin, a canvas that draws them can still call `getImageData`; under `file://` Chromium taints such a canvas and `getImageData` throws. `--file-url` keeps the old `file://` loading for a scene that depends on it. Before scripts run, the page receives `window.videoIllustrator = {fps, width, height}`, and `--query "a=1&b=2"` appends a query string the scene can read.

Expose `window.renderFrame = async function (t) { ... }`, where `t` is absolute seconds. Each call must fully reconstruct the frame from `t`: no dependence on previously rendered frames, `Date.now()`, requestAnimationFrame clocks or unseeded per-frame random values. Reset the canvas/scene before drawing. Derive repeated texture randomness from stable object IDs. Async image readiness must complete before rendering. The renderer waits for fonts and awaits this function.

Use the requested aspect ratio with fixed defaults: 1280×720 for 16:9 or 720×1280 for 9:16, at 30 fps. Only explicit user technical overrides change those values; content does not change resolution or fps. Keep required text inside the frame, with readable hierarchy and enough dwell time. For a different aspect ratio, recompose the layout rather than stretching an existing frame. Real screenshots remain real assets; do not redraw a fictional interface and claim it proves a product operation.

## 3D route (three.js)

Start from [three-template.html](three-template.html): copy it next to the project as
`scene.html`, copy the real cover into `assets/`, set `ASSETS`, then edit the timeline
object `TL` and the `pose(t)` function. It keeps the `renderFrame(t)` contract: every
pose, light and focus distance is a function of `t`, randomness is seeded, and there is
no requestAnimationFrame clock. Its importmap loads the skill's pinned three.js from
`/__vi/three/` (`"three": "/__vi/three/build/three.module.js"`, addons under
`"three/addons/": "/__vi/three/examples/jsm/"`), so it only runs through `render.mjs`.

What the template contains:

- A 3D book: the cover image on the front face, width taken from its pixel aspect;
  spine and back images when supplied, otherwise a neutral material; generated page edges.
- Physically based materials; a warm key spot light that casts soft shadows, a cool rim
  light from behind, low image-based ambient light, one HDR practical.
- Post: depth of field (`BokehPass`), bloom limited to highlights above a linear
  threshold (`UnrealBloomPass`), ACES tone mapping, light grain and a vignette.
- **Sub-frame motion blur**: each frame averages several renders spread over the shutter
  (`shutter=0.5` of the frame interval by default) in an HDR buffer, before bloom and
  grain. With `adaptive` on (default) the count follows on-screen movement, about one
  sub-frame per 1.5 px, from 1 when still up to `subframes` (default 8). Query options:
  `subframes=N`, `shutter=0..1`, `adaptive=0`, `grain=0`.

Render with the hardware GPU:

```sh
node scripts/render.mjs --input /path/to/scene.html --output /path/to/frame.png --still 2 --width 640 --height 360 --gpu --query "subframes=1&grain=0"
node scripts/render.mjs --input /path/to/scene.html --output /path/to/clip.mp4 --duration 20 --gpu --query "subframes=16"
```

`--gpu` launches Chromium with `--enable-gpu` and, on macOS, `--use-angle=metal`. The
result JSON always carries `gl_renderer`, the WebGL `UNMASKED_RENDERER` string; with
`--gpu` on this Mac it reads `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, ...)`,
without it `... SwiftShader ...` (software rendering on the CPU). If `--gpu` still ends
up in software rendering, or Chromium will not start with the GPU flags, the render
continues in software and a warning appears on stderr and in `warnings`. Only macOS has
been verified; other platforms receive `--enable-gpu` alone.

Measured on an Apple M4 Pro, 1920×1080, template scene, fixed sub-frame count
(`adaptive=0`), milliseconds per frame after the first (the first frame also compiles
shaders and uploads textures: 0.15–0.5 s on the GPU, 3–7 s in software):

| Sub-frames | GPU, grain on | GPU, `grain=0` | SwiftShader, grain on |
|---:|---:|---:|---:|
| 1 | 323 | 85 | 671 |
| 8 | 329 | 94 | 2654 |
| 16 | 357 | 113 | 4893 |

On the GPU the sub-frames themselves are cheap (about 2 ms each here); most of the time
is the lossless PNG capture, and film grain makes that capture about four times slower
because noise does not compress. A full 6-second 1080p render of the template with
adaptive blur up to 16 sub-frames took about 62 s (180 frames, 342 ms each). In software
every sub-frame costs roughly 300 ms at 1080p. Hence the budget: stills and previews at
640×360 with `subframes=1&grain=0`, final render with the full settings and `--gpu`.

## Run renders in the foreground

Run every render command in the foreground and wait for it to finish before replying.
Do not start a render in the background and then end the turn: when a non-interactive
session ends, the host terminates its background processes and the MP4 never appears.
For a long render, raise the command timeout instead. If a render is interrupted
(SIGINT/SIGTERM or a crash), the CLI removes its `.video-illustrator-*` staging folder;
only a hard kill (SIGKILL) can leave one behind, which is safe to delete.

## Drafts and keyframes before the full render

For anything longer than about 15 seconds, first export 3–4 stills at the key moments
(`--still`), typically the first second, the turn, the payoff and the end card, and look
at them before a full render. While iterating, a draft may use half size (640×360 or
360×640), a lower fps such as 15, or only the section under revision (render a short
`--duration` of a scene whose timeline is offset). Drafts are for checking; the final
export returns to the fixed defaults.

## Commands

Replace the paths and numerical values with the actual brief. Run from the skill directory, or use the script's absolute path:

```sh
node scripts/render.mjs --input /path/to/scene.html --output /path/to/clip.mp4 --duration 20 --width 1280 --height 720 --fps 30
node scripts/render.mjs --input /path/to/scene.html --output /path/to/frame.png --duration 20 --width 1280 --height 720 --fps 30 --still 8
```

Before using narration, measure it:

```sh
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 /path/to/narration.wav
```

Use that measured duration for the scene and `--duration`, then add `--audio /path/to/narration.wav`. Align the scene to the recording; do not stretch spoken audio to force an arbitrary clip duration. The helper pads a short track or truncates a longer track to the declared render duration. A longer source emits an explicit stderr warning and a JSON `warnings` entry. Resolve that conflict unless the user intentionally requested trimming. Output files are protected by default; `--overwrite` is only for a deliberately chosen replacement.

## Audio-first workflow

For a promo or cinematic piece, sound comes before picture:

1. **Narration.** Use the user's recording from `inputs/voice/` and measure it with
   ffprobe. If `inputs/voice/` also holds a `words.json` with cue times
   (`{text, duration, cues:[{text, start, end}]}`; a cue can be a phrase, a word or a
   character, for example from an external forced-alignment tool), first snap the cue
   starts to the recording, then use only the snapped times:
   ```sh
   node scripts/onsets.mjs --audio /path/to/project/inputs/voice/narration.wav --words /path/to/project/inputs/voice/words.json --output /path/to/project/audio/words.onsets.json
   ```
   Speech-recognition times often start early (a measured case ran 0.05–0.44 s early at
   phrase starts while phrase ends were accurate). The script computes an RMS envelope
   (10 ms window, 2 ms hop) and moves each cue's `start` to the first quiet-to-loud onset
   within ±0.45 s (`--window`), never earlier than 50 ms before the previous cue's end and
   never after the cue's own end. `end` is not changed. Each cue gains `start_raw` and
   `snap_ms` (positive = moved later); a cue with no onset in its window keeps its time,
   gets `snap_ms: 0` and is listed in `onset_analysis.unsnapped`. Check those cues by ear or
   against `ffmpeg -af silencedetect`. Snapping works per cue, so it never shifts the whole
   file by one offset. With only an `.srt`, convert it to `words.json` cues first; with no
   times at all, align by listening points you can verify.
   Subtitle-in and every big on-screen word enter on the snapped start, within one frame.
2. **Keyframes.** Export 3–4 stills of the planned picture (opening, turn, payoff, end
   card) with `--still`, or pick the key images from `inputs/assets/`. They are checked
   as drafts (see [drafts and keyframes](#drafts-and-keyframes-before-the-full-render))
   and become the music's reference images.
3. **Music.** Use user-supplied music, or generate a bed when the user has authorized
   the paid call. `music.mjs` calls Google Lyria through OpenRouter by default
   (`OPENROUTER_API_KEY`; about US$0.04 per 30-second clip, longer requests use the Pro
   model, listed at US$0.08 per song) or the Gemini API with `--provider gemini`
   (`GEMINI_API_KEY`; same listed prices, longer requests use `lyria-3.5`). Pass the
   keyframes with `--ref` (repeatable, at most 10; PNG, JPEG or WebP) so the music takes
   its mood, colour temperature and texture from the picture. Check the request with
   `--dry-run` (image bytes are omitted from its output).
   ```sh
   node scripts/music.mjs --out /path/to/project/audio --style "felt piano, brushed snare, upright bass" --mood "warm, curious" --bpm 96 --duration 30 \
     --ref /path/to/project/keyframes/opening.jpg --ref /path/to/project/keyframes/turn.jpg --ref /path/to/project/keyframes/end.jpg
   ```
   It writes the returned file (MP3 from Lyria), a trimmed 48 kHz `music.wav` and
   `music.json` with provider, model, prompt, reference file names with sha256, time and
   the cost basis (OpenRouter reports `usage.cost`; Gemini returns no cost, so the listed
   price is recorded). References only shape style; they do not synchronise the music to
   picture changes, and the Gemini clip may come back slightly shorter than 30 s (a test
   returned 29.2 s; `music.json` warns). Picture timing comes from the next step.
4. **Beat grid.** Measure the actual music, never trust the requested tempo:
   ```sh
   node scripts/beats.mjs --input /path/to/project/audio/music.wav --output /path/to/project/audio/beats.json
   ```
   `beats.json` has `bpm`, `beats[]`, `downbeats[]` (meter assumed 4/4; treat the phase
   as a guess when `downbeat_confidence` is close to 1.0) and `strong_onsets[]`.
5. **Timeline.** Copy the beat times and the snapped cue starts from `words.onsets.json`
   (shifted by where the narration starts in the film) into the scene's timeline object and
   derive animation times from it; decide where narration starts so its key words sit on beats.
6. **Sound effects.** Generate starter effects, or measure the user's own recordings from
   `inputs/sfx/` (preferred when present), and place one per visible action:
   ```sh
   node scripts/sfx.mjs --out /path/to/project/audio/sfx
   node scripts/sfx.mjs --measure /path/to/project/inputs/sfx/door-slam.wav --out /path/to/project/audio/sfx
   node scripts/sfx.mjs --place whoosh.wav --at 1.741 --json /path/to/project/audio/sfx/sfx.json
   ```
   **The peak goes on the beat, not the file start.** `sfx.json` records for every file the
   time of its loudest sample (`peak_s`), read straight from the samples; user recordings get
   `"type": "user"` and are not copied or changed. The effect's delay is
   `adelay_ms = round((target_s − peak_s) × 1000)`. When that is negative (the target comes
   before the effect could reach its peak), never set a negative delay: trim the head instead,
   `atrim=start=<peak_s − target_s>,asetpts=PTS-STARTPTS` (without `asetpts` the trimmed audio
   keeps its old timestamps and lands late again). `--place` prints the right filter for one
   effect and target; with `--semitones` it pitches the effect and moves the peak with it.
   The procedural whoosh peaks at 0.35 s of its 0.7 s, so delaying it by the beat time itself
   (the 0.4 example) put its loudest moment about ten frames late.
   The AAC track that `render.mjs` writes stays in sync: a click placed at 1.000 s decodes at
   1.000 s with the MP4 edit list honored and at 1.021 s in a player that ignores it (the
   encoder's 1024 priming samples), under one frame either way, so no compensation is applied
   (measurement in [VALIDATION.md](../VALIDATION.md)).
7. **Mix**, then render the picture with `--audio mix.wav`.

   **Music level stays constant under the narration.** Do not duck the music with a
   sidechain compressor, and do not use single-pass (dynamic) `loudnorm` on the final
   mix: both make the music swell every time the voice pauses, which listeners find
   unpleasant (Axton's review of the first promo samples). Set one static music gain,
   low enough that the voice stays clearly on top everywhere, and keep it for the whole
   spoken part. The only planned rise is after the last spoken word, into the end card.

   **Music ends like music.** Never hard-cut a track. Request a length a few seconds
   longer than the film, end on a bar line after a resolving phrase, and use a fade of
   at least 2–3 s that starts on a bar; or extend the end card so the track's own
   ending fits. A clip that stops mid-phrase reads as broken.

   Example with narration starting at 0.5 s and ending at 18.0 s in a 20 s film, a fixed
   music bed, a 1.5 s rise into the end card, two effects whose peaks land on the beats at
   1.741 s and 3.738 s (`sfx.json`: whoosh `peak_s` 0.35 → `adelay=1391`; impact `peak_s`
   0.006 → `adelay=3732`), then static normalization:
   ```sh
   ffmpeg -hide_banner -loglevel error -n \
     -i voice.wav -i music.wav -i sfx/whoosh.wav -i sfx/impact.wav \
     -filter_complex "\
   [0:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=500:all=1,apad=whole_dur=20[voice];\
   [1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:20,\
   volume='0.22+0.28*clip((t-18.0)/1.5,0,1)':eval=frame[bed];\
   [2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=1391:all=1,volume=0.6[s1];\
   [3:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=3732:all=1,volume=0.8[s2];\
   [voice][bed][s1][s2]amix=inputs=4:duration=first:normalize=0,aresample=48000[mix]" \
     -map "[mix]" -c:a pcm_s16le mix_raw.wav
   ```
   Then normalize without dynamic gain: measure the integrated loudness of `mix_raw.wav`
   (`ffmpeg -i mix_raw.wav -af ebur128=peak=true -f null -`), apply one static
   `volume=<−14 − measured>dB`, and follow it with a fast peak limiter that only touches
   voice transients, for example `alimiter=limit=0.84:attack=2:release=50:level=disabled`.
   Do not rely on two-pass `loudnorm` with `linear=true`: when the target would push the
   true peak over the ceiling, ffmpeg silently falls back to dynamic mode (observed on
   all five homepage samples), which brings back the pumping. Check afterwards that the
   level change in a speech pause equals the static gain (a measured case: +3.4 dB in a
   pause, +3.3 dB during speech).
   Replace the numbers with the film's actual narration end, duration and beat times, and
   each effect's filter with the one `--place` prints for it.
   `0.22` is a starting bed level (about 13 dB under the music's own level); check that
   the narration is clearly on top during the loudest music passage. Verify the result:
   `ffmpeg -i mix.wav -af ebur128=peak=true -f null -` for loudness, and listen (or state
   that it was not auditioned) to confirm the bed does not change level in speech pauses.

Inspect metadata:

```sh
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,r_frame_rate -of json /path/to/clip.mp4
```

## Contact sheet self-check

After the motion preview, and again on the final, sample the rendered film instead of
relaunching Chromium for each still:

```sh
node scripts/contact.mjs --input /path/to/project/preview.mp4 --output-dir /path/to/project/qa/preview-1 \
  --beats /path/to/project/audio/beats.json --asset /path/to/project/assets/cover.png --scenes 10
```

- **Sampling.** With `--beats`, one frame from the middle of each bar (downbeats are taken as
  film time, so they must match where the music starts in the film); without it, one frame from
  the middle of every 2 s (`--interval`).
- **`contact.png`.** Thumbnails in time order, each labelled with its index, time, and either
  `NEW` or its distance to the closest earlier frame. A yellow box marks an estimated asset hit.
- **`contact.json`.** Per frame: `dhash` (256-bit dHash of the frame scaled to 17×16 grey),
  `min_distance` to every earlier sample and `nearest`, `new_scene`. `distinct_scenes` counts
  frames whose smallest distance is at least `--threshold` (default 64 of 256), so a camera move
  on the same picture is not a new scene. With `--asset` (repeatable), each frame gets the best
  normalized cross-correlation of the downscaled asset at 11 sizes, and `assets[].fraction` is the
  share of samples at or above `--asset-threshold` (default 0.55). This is an estimate, marked
  `estimate: true`: it finds the asset upright and facing the camera; a 3D book at an angle,
  heavy relighting or a partial crop scores lower, so read it as a lower bound and check the sheet.
- **Motion.** Separately from the sheet, the whole clip is read at 4 frames per second as
  96-pixel-wide grey thumbnails, and each pair of neighbouring samples gets its mean absolute grey
  difference. `contact.json` → `motion` holds `end_hold_s` (the final run in which the picture stays
  settled; a uniform fade to black on a held picture still counts as held), `longest_still_s` (the
  longest run before that final hold with differences under `--still-threshold`, default 1.0 of
  255, with its time range) and `dark_ratio` (share of samples whose mean grey level is under
  `--dark-threshold`, default 40). It catches “enters, then freezes” and “lands, then cuts
  away”, which the scene count cannot see. A small element moving inside a large still picture
  (under about 1% of the frame) counts as still; a camera drifting through one world for ten
  seconds counts as motion, and only the scene count and the sheet reveal it. Do not add a
  float or a breathing scale to a still object just to clear this number.
- **Warnings.** `--scenes N` (the number of scene-list rows) warns when `distinct_scenes` is below
  70% of N; any asset estimated in more than half the samples warns too. Motion warns when
  `longest_still_s` > 3 s (`--still-max`), `end_hold_s` < 1.0 s (`--end-hold-min`) or
  `dark_ratio` > 0.5 (`--dark-max`; a film meant to be dark, such as a low-key 3D piece, says so in
  `brief.md`). Warnings go to stderr and `warnings[]`, and the exit code stays 0. Copy them with
  the numbers into `brief.md`. They are proxy measures: evidence for review, never a gate.

Then look at the sheet. For each frame ask: would a stranger scrolling past stop here? Replace
the weakest one or two pictures and render a new preview, at most two rounds. Do not overwrite an
old sheet unintentionally; use a new `--output-dir` per round (the script refuses to overwrite
without `--overwrite`). Also inspect motion, including transitions and the ending; stills alone
do not validate animation. Keep preview/export dimensions and fps at the specified defaults
unless the user explicitly asks for a technical override. The presence of an MP4 and successful
ffprobe output does not replace watching the motion.
