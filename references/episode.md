# Episode mode: a whole narrated explainer

Use episode mode for a complete science or tech explainer of two to ten minutes: researched facts, one narration, a 3D or 2D scene that carries the explanation, real footage for the demonstrations, captions and a publish-ready master. It is the same spine as every mode (SKILL.md), at full length: it adds research, footage and one narration take, and strings the tools together in a fixed order. Each step leaves a file the next one reads, so the work can stop and resume anywhere.

The first worked run is the Tesla Roadster episode (2026-10, 3 min 4 s, six segments, Chinese, 16:9).

## Folder

```
<episode>/
  research/        facts.json, sources, transcripts of primary footage, structure frames
  explain.json     the explanation plan (step 3)
  script.md        segments and spoken lines, {f:id} citations, picture notes
  clips/           cut footage, one file per use
  scene/           the scene file, its modules, timing.js
  voice/           the narration take and its alignment log
  audio/           one wav per segment, cut from the take
  episode.json     segments, footage plan, render settings
  out/             segments, the clean master, captions, the final master
  stage-log.md     what each step used and where it got stuck
```

## Steps

1. **Angle.** One sentence the episode argues, not the topic. "Hanging upside down and jumping are two answers to one question" is an angle; "the new Roadster" is a topic.
2. **Research and facts.** Follow [research-and-footage.md](research-and-footage.md). Every number on screen comes from `facts.json` (`scripts/facts.mjs --check`). Go to primary sources: transcribe the official livestream with Whisper and read gauges from frames; fetch official pages, and when a page cannot be fetched, save it to a read-later service and read it there. Secondary reports drift from what was actually said; in the Roadster run four of them did.
3. **Explanation design.** Follow [explanation-design.md](explanation-design.md): one signature idea for the episode, and an explanation plus a demonstration for every concept, each chosen from many candidates, then challenged by a clean-context reviewer. Write `explain.json` and run `scripts/explain.mjs --check explain.json`. This step decides whether the episode has character; do not skip it to save time.
4. **Script.** `## <segment id> <title>` per segment, one spoken line per line, `> ` picture notes naming the device chosen for that line, `{f:id}` on every line that uses a fact. Check both: `scripts/facts.mjs --check facts.json --script script.md` and `scripts/explain.mjs --check explain.json --script script.md`. Read it aloud: no silent beats. A picture that needs the viewer's attention gets a sentence that talks about it; a held picture under silence confuses.
5. **Footage.** `scripts/footage.mjs` search, review, fetch, clip. Use the subject's own official channels (verify the channel id) or footage the user approved; never news outlets or other people's channels. Plan footage per line in `episode.json`:
   - **Full frame with a step tag** for demonstrations, where the real event is the point. Order matters: the footage must show what the line says at the moment it says it.
   - **Cards** (`rect`, `label`) for the real-picture-and-diagram split: footage on the left, the 3D on the right saying the same thing.
   - Footage that flashes by for a frame (an X-ray shot in a promo) can be frozen into a slow push-in still; crop to the subject at native resolution rather than upscaling.
6. **Scene.** First pick one main style for the whole episode, as in every mode (SKILL.md, step 1): the user's named style or reference wins, otherwise [diagram-3d](diagram-3d.md). Check its row in [Carrying an explainer](styles.md#carrying-an-explainer--讲解承载) for the route; a style that cannot carry the mechanism segments is not the main style (it can still serve a cold open or a scene between mechanisms). Read the style file and take its palette logic, motion tokens and signature craft into one shared module, so every segment draws in the same voice; mixing two styles' tokens reads as two films. Mechanism segments follow the explainer contract (`SUBJECTS`, `LINKS`, `STEPS`, one change per cue, the safe area and caption-band rules in [explainer.md](explainer.md)) on the style's route, starting from [mechanism-template.html](mechanism-template.html) or [mechanism-template-2d.html](mechanism-template-2d.html). Then one scene file, a function per segment that reads `window.TIMING` and draws the line's device at the line's start. Build the subject model once as a module with the operations the explanations need (explode, see-through, focus a part, fade a part, squat, spin wheels). Write the style and route into `stage-log.md`. Export stills at each chosen device before any full render.
7. **Narration.** The user's own recording, or their cloned voice. Record the whole script as one take after the script is final; a take recorded before script edits forces the picture to cover for missing words. When a host pipeline makes the voice, take the narration file it hands over as the take. Save the exact narration text the take was made from (for example `voice/narration.txt`): captions are proofread against it.
8. **Split and align.** `scripts/align.mjs --config episode.json --script script.md --out scene/timing.js --master voice/take.mp3` transcribes the take once, aligns it to the full script, cuts it in the pauses between segments into each segment's `audio`, then times every line. Lines with a low match are usually numbers written differently by the recogniser; listen to the rest.
9. **Test render.** Before the full render, render the segments that carry cards and animation (a temporary config with only those segments and its own `out`), and look at a contact sheet: is anything cut off by the frame, covered by a card, or invisible on the background?
10. **Render.** `scripts/episode.mjs --config episode.json --no-captions` when the host burns its own captions, otherwise without the flag for the built-in karaoke captions. Unchanged segments are reused by hash.
11. **Captions.** The built-in captions light the word being said and switch to light text over footage. A host with its own caption style burns its own on `episode-clean.mp4`. When a host pipeline finishes the film (captions, highlighted lines, a channel outro), render with `--no-captions` and hand it `out/episode-clean.mp4` with the narration text; its own documentation names the entries. Then do not burn captions or highlighted lines here, do not add a corner logo or an end card to the master, and do not use a one-off caption script.
12. **Check.** A contact sheet every three seconds; full-size frames at every card, every device and every signature caption; loudness near −16 LUFS; duration and size with ffprobe. For each concept in `explain.json`, look at a frame on its lines: is the chosen device actually on screen?
13. **Cover and publish notes.** A frame from the strongest real footage usually beats a frame of the diagram. Chapters from the segment offsets in `out/episode.json`; sources from `scripts/facts.mjs --sources`; footage sources by channel. When a host pipeline runs the final review and the publish package, prepare these notes so that step has them.
14. **Stage log.** One row per step: what was used, where it got stuck, how it was solved. It is the material for improving this workflow.

When a background step finishes (a render, an alignment), start the next step straight away; the work should not wait on anyone unless the next step needs a decision or money.

## Scene craft that cost a round

- `visible` must be a boolean; `0` does not hide a three.js object.
- `Box3.setFromObject` does not update parent matrices: call `group.updateMatrixWorld(true)` after moving the parent and before reading world positions for labels.
- With a card on the left, back the camera off and shift the view right with `setViewOffset`, and do it after the camera is placed for the frame; keep labels out of the card (labels centred with `translate(-50%)` need half their width added).
- On a light background additive blending washes out: draw jets and glows with normal blending and a saturated colour.
- A curved subject (a car body, an organic shape) needs a lofted smooth shell, with seamless normals and panel lines drawn on it, or a licensed real model; faceted primitives read as cheap. Give it per-part materials (clearcoat paint, glass, rubber, satin metal), not one colour; abstract concept models default to satin or clay instead (see diagram-3d.md).
- In diagram-3d, start the 3D look from the template's defaults (studio PMREM, Neutral tone mapping with `paper()`, contact shadow, GTAO with MSAA); `RoomEnvironment` with ACES reads flat and greys the paper. Another 3D style keeps the template's construction and changes the look as its style file says. In the 2026-10 test three.js with these defaults beat Blender for this kind of shot at about 600 times the speed (around 30 ms a frame).
- Under Neutral tone mapping the paper sits in the compressed highlights, so a `ShadowMaterial` needs about 0.5 opacity to read as a shadow.
- Sideways forces read best with the camera inside the turn, so the arrow points at the viewer.
