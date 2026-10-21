# Research references and credits

This pack contains newly written directing guidance and prompts. It uses common
animation practices such as visual hierarchy, cause-and-effect staging, object
continuity, consistent projection, and material-based motion. The style names refer
to broad visual traditions, not to a claim of inventing those traditions.

Public projects that informed the product exploration:

- [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar), by Lemomo: an example of
  presenting code-made films alongside style, directing, and technical guidance.
  Its own documentation and assets remain governed by its published licenses.
- [onetake](https://github.com/feitangyuan/onetake), by feitangyuan: a reference for
  discussing visual continuity between beats. This pack does not require an
  unbroken shot or include that project's code, tests, prompts, or assets.
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills), by Jim Liu / Baoyu: an
  example of packaging creative workflows as discoverable, reusable agent Skills.

### Ideas adapted in 0.2.0

`cinematic.md` and the audio-first workflow in `rendering.md` adapt ideas, rewritten
in our own words, from:

- [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar), by Lemomo, informed the
  directing and audio-first ideas: sound accompanying visible action, planning on a music
  grid, a shared picture-and-sound timeline, reading-time holds, voice ducking and a
  −14 LUFS delivery target. This is an acknowledgement of ideas, not an import of its
  guides, code, prompts or media. The guidance and Node audio scripts here were written
  for this Skill's single-file `renderFrame(t)` renderer. For reuse of material from
  Lemo-Opuscar itself, consult that project's licence for the specific material and version.
- The treatment and engine notes of the “I'm Upping My P(doom)” music-video project,
  [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) by mexicat (its code is released under the MIT License): big changes landing on downbeats, strong eases with holds then snaps,
  and one recurring motif that escalates across the film. No code was copied.
- The hand-drawn-canvas-animation skill in
  [alesha-pro/tools](https://github.com/alesha-pro/tools/tree/98450c6386dac2502ac77d8548e2b9cbe76603cb/skills/hand-drawn-canvas-animation)
  (MIT License): whole-pose drawings, exposure tracks, held drawings keeping their marks,
  and tweening only stroke-compatible drawings, reflected in the “Hand-made motion” section
  of `directing.md`. Rewritten in our own words; no code was copied.

### Added in 0.3.0

- [three.js](https://github.com/mrdoob/three.js) (MIT License, © 2010–2026 three.js
  authors) is a runtime dependency of the 3D route, pinned to `0.186.1` in
  `package.json` and installed by `npm ci`; it is not copied into this package. The
  starter scene uses its `EffectComposer`, `RenderPass`, `BokehPass`, `UnrealBloomPass`,
  `TexturePass`, `OutputPass`, `ShaderPass` and `RoomEnvironment` examples as imports.
- The sub-frame motion blur in `three-template.html` (averaging renders spread over the
  shutter in a linear HDR buffer before bloom and grain, choosing more sub-frames only
  for frames with visible motion, and changing grain per frame rather than per
  sub-frame) follows the approach described in the engine notes of
  [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT License). The
  implementation here is our own, simpler version: a fixed or motion-scaled count with
  a pixel-per-sub-frame rule instead of that project's convergence test. No code was copied.

### Ideas adapted in 0.5.0

- [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Apache License 2.0)
  informed several 0.5 additions, rewritten in our own words for this Skill's `renderFrame(t)`
  renderer; no code or text was copied, and some starting values were re-derived or changed:
  aesthetic rules written as a rule, a real review case and a self-check question, with a
  clean-context review before delivery (`aesthetic-rules.md`, `review.md`); a transition
  vocabulary with frame counts and the “one seam, one form” rule (`transitions.md`); motion
  tokens (duration, entrance curve, overshoot, squash) that give a brand or style one motion
  voice (the Motion tokens blocks); numeric limits on full-frame impacts and light effects and
  “one technique leads once” (the restraint budget in `directing.md`); the riser → impact →
  sparkle phrase and limits on machine-gun repeats (`cinematic.md`); and aligning an effect's
  peak, not its file start, plus a measured AAC output offset (`sfx.mjs`, `rendering.md`).
- [anything2explainer](https://github.com/Vincentwei1021/anything2explainer) (PolyForm
  Noncommercial License 1.0.0): the general idea of measuring stillness and the final hold on
  the rendered film, and of refusing to add float to a still object just to satisfy that
  measure, informed the motion check in `contact.mjs`. Only the idea was used; no code, text or
  other material from that project is included in this package.

`scripts/beats.mjs`, `scripts/sfx.mjs` and `scripts/music.mjs` are independently written
for this package. Spectral-flux onset detection, autocorrelation tempo estimation and
dynamic-programming beat tracking are standard published techniques (for example
D. P. W. Ellis, "Beat Tracking by Dynamic Programming", 2007).

These links acknowledge research context. Apart from three.js above, they are not
runtime dependencies, and none imply endorsement. No prose, source code, videos, audio, images, or style files
from those projects are bundled in this reference pack. Any future imported asset
or adapted implementation needs its own attribution and license review.

### Showcase media

The Skill-made homepage samples (1–5, 7 and 8) use Google Lyria 3 clips generated through
the author's own OpenRouter account. Sample 9 is silent. The separate brick-world reference
(sample 6) uses generated music or music the author has rights to use, as confirmed by
the author. It is not attributed to a specific generator here. No audio file is distributed with this package. The
films, previews and posters are not covered by the MIT license; see
[showcase/SAMPLES.md](../showcase/SAMPLES.md).
