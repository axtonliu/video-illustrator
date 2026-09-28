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

The renderer serves the page from a private `http://127.0.0.1` server on a random port, closed after the render. It serves the scene's folder, or `--root <dir>` when the scene references files above its folder (for example `--root project/` so `scene/scene.html` can load `../inputs/assets/cover.png`). Files outside that root are refused. Because images come from the same origin, a canvas that draws them can still call `getImageData`; under `file://` Chromium taints such a canvas and `getImageData` throws. `--file-url` keeps the old `file://` loading for a scene that depends on it. Before scripts run, the page receives `window.videoIllustrator = {fps, width, height}`, and `--query "a=1&b=2"` appends a query string the scene can read.

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
   ffprobe. If `inputs/voice/` also holds an `.srt` or `words.json` with word times,
   use those times for text hits; otherwise align by listening points you can verify.
2. **Music.** Use user-supplied music, or generate a bed when the user has authorized
   the paid call. `music.mjs` calls Google Lyria 3 through OpenRouter (about US$0.04 per
   30-second clip; longer requests use the Pro model, listed at US$0.08 per song) and
   reads `OPENROUTER_API_KEY` from the environment. Check the request with `--dry-run`.
   ```sh
   node scripts/music.mjs --out /path/to/project/audio --style "felt piano, brushed snare, upright bass" --mood "warm, curious" --bpm 96 --duration 30
   ```
   It writes the returned file (MP3 from Lyria), a trimmed 48 kHz `music.wav` and
   `music.json` with model, prompt, time and the cost OpenRouter reported.
3. **Beat grid.** Measure the actual music, never trust the requested tempo:
   ```sh
   node scripts/beats.mjs --input /path/to/project/audio/music.wav --output /path/to/project/audio/beats.json
   ```
   `beats.json` has `bpm`, `beats[]`, `downbeats[]` (meter assumed 4/4; treat the phase
   as a guess when `downbeat_confidence` is close to 1.0) and `strong_onsets[]`.
4. **Timeline.** Copy the beat times you use into the scene's timeline object and derive
   animation times from it; decide where narration starts so its key words sit on beats.
5. **Sound effects.** Generate starter effects and place one per visible action:
   ```sh
   node scripts/sfx.mjs --out /path/to/project/audio/sfx
   ```
6. **Mix**, then render the picture with `--audio mix.wav`. Example with narration
   starting at 0.5 s, music ducked under the voice, two effects on beats, and loudness
   normalized to about −14 LUFS:
   ```sh
   ffmpeg -hide_banner -loglevel error -n \
     -i voice.wav -i music.wav -i sfx/whoosh.wav -i sfx/impact.wav \
     -filter_complex "\
   [0:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=500:all=1,apad=whole_dur=20,asplit=2[voice][key];\
   [1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:20,volume=0.45[music];\
   [music][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[bed];\
   [2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=1741:all=1,volume=0.6[s1];\
   [3:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=3738:all=1,volume=0.8[s2];\
   [voice][bed][s1][s2]amix=inputs=4:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[mix]" \
     -map "[mix]" -c:a pcm_s16le mix.wav
   ```
   Replace `20` with the film duration and the `adelay` values (milliseconds) with the
   actual beat times. `apad=whole_dur` makes the voice branch define the mix length.
   Tune the music `volume` and the compressor threshold by ear; the narration must stay
   clearly on top. Single-pass `loudnorm` lands near the target (a test mix measured
   −15.6 LUFS, −1.5 dBFS peak); check with `ffmpeg -i mix.wav -af ebur128=peak=true -f null -`.

Inspect metadata:

```sh
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,r_frame_rate -of json /path/to/clip.mp4
```

Inspect representative frames from the already rendered preview, using one FFmpeg pass rather than relaunching Chromium for each still:

```sh
ffmpeg -hide_banner -loglevel error -n -i /path/to/clip.mp4 -vf "fps=1/2,scale=480:-1,tile=5x2" -frames:v 1 /path/to/contact-sheet.png
```

For the 20-second starting clip this gives up to ten views; adapt sampling to the actual duration and transitions. Do not overwrite an old sheet unintentionally. Inspect the sheet and motion, including transitions and the ending; stills alone do not validate animation. Keep preview/export dimensions and fps at the specified defaults unless the user explicitly asks for a technical override. The presence of an MP4 and successful ffprobe output does not replace watching the motion.
