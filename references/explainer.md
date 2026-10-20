# Explainer mode

Use explainer mode when the user already has narration (a recorded talk, a finished video, a podcast segment) and wants one passage of it made visible: how a mechanism works, who does what, where something goes. The narration is fixed; the picture serves it. It follows the same spine as every mode (SKILL.md): pick the visual language, design the explanation, author, check, deliver. The result is an insert for the user's own edit, not a standalone promo, so it skips the promo machinery (hook, music bed, beat grid, scene density, contact-sheet density warnings) and keeps the rest of the workflow.

It is the right choice when the passage describes **parts that persist and something that moves between them**: a model and the tools it calls, a request travelling through services, money moving between accounts, a signal through a circuit. When the passage is mostly numbers, use a 2D chart; when the real thing can be filmed or screen-recorded, a recording is more honest than a model of it; when the passage is an argument or a feeling, it is not a mechanism, so use the normal workflow.

## Cut the window

Take the passage from the user's subtitles, not from guessed times:

```bash
node scripts/excerpt.mjs --srt final.srt --from 43 --to 68 --out inputs/ --media master.mp4
```

It writes `words.json` (cues re-timed to start at 0, in the format `scripts/onsets.mjs` reads), `narration.wav` and `excerpt.json` (source paths, SHA-256, what was clipped). A cue that crosses either edge is kept and marked `clipped`; tell the user which half sentences the window starts or ends on, and offer the nearest clean boundaries instead of silently moving the window. The audio is the source's audio as it is: a mixed master keeps its music.

## Fix the subjects before the steps

Write `brief.md` as usual, but replace the concept and scene list with:

- **Subjects** (two to five): the persistent parts the passage names, each a simple shape (orb, gear, folder, device, document, block) with a short title and a short note in the narration's own words. They stay on screen for the whole clip. A subject that only appears later spawns at its step and then stays.
- **Links**: which subjects talk to which, as curves. A link exists only if the narration says something travels along it.
- **Steps**: one visible change per step, each at the start time of the cue that says it (`words.json`, or `scripts/onsets.mjs` for snapped onsets). A change is a subject lighting up, a packet travelling a link, a device screen changing, or a subject spawning. A title per step paraphrases the cue; it never adds a claim the narration does not make.

Do not invent parts, data, file names or numbers to make the picture richer. A label on a packet names what the narration says is carried; if the narration does not name it, leave the packet unlabelled.

## Pick the look

One main style for the clip, chosen the same way as in every mode (SKILL.md, step 1): the user's named style or reference wins; otherwise use [diagram-3d](diagram-3d.md), the bright 3D diagram look. Read that style's file (palette logic, motion tokens, signature craft) and its row in [Carrying an explainer](styles.md#carrying-an-explainer--讲解承载), which says the route. A style marked not suited is not forced into a mechanism: say so and offer diagram-3d or a suited style. Write the choice and the route into `brief.md`.

## Author

Start from [mechanism-template.html](mechanism-template.html) on the 3D route or [mechanism-template-2d.html](mechanism-template-2d.html) on the 2D route. For the content, edit only section 1: `FILM`, `SUBJECTS`, `LINKS`, `STEPS` and, for the preview, `CUES` copied from `words.json`. The two starters read the same lists, so the content can move between them unchanged when the style changes.

Then apply the style. On the 3D route, diagram-3d is the template as shipped; for another 3D style change `PALETTE`, the finishes (`FINISH`, `paint()`) and the motion (durations and curves from the style's tokens), and for a look that is not lit solids (particles), keep the geometry, `tint()` and `spin()` and change how the meshes draw, as the style file describes. On the 2D route, replace `PALETTE`, `MOTION` and section 3 (the drawing functions) with the style's palette, tokens and signature craft; as shipped, section 3 is cut paper.

What stays the same in every style: both starters keep the subjects in a fitted safe area with room beside them for their cards, keep cards flat and readable, and avoid overlaps between cards, subjects, the header and the caption band. One scene renders both shapes: give each subject a landscape and a portrait position and label side, and compose each shape for its own frame rather than cropping one from the other. Keep everything inside a 5% margin. In portrait, every subject, label and moving thing stays above 75% of the height in every frame, because the user's editor puts their subtitles in the bottom quarter; in landscape, keep the bottom 18% plain. Whatever the palette, one structure colour carries the main parts, a lighter secondary carries links and minor parts, and one accent marks only the single place changing now (the packet while it travels, or the one subject the sentence is about once it arrives). Labels are flat 2D cards facing the viewer, styled as in [AR-17](aesthetic-rules.md#ar-17-cards-and-labels-without-the-ai-default-look): generous padding, a heavy title over a lighter note, a soft shadow or hairline, the accent on a small dot or the leader's end, never a stripe on one side. The camera holds still and moves only when a step needs it to reveal something. Nothing moves for decoration.

## Render and deliver

Render four files, all at the fixed defaults and the narration's exact duration:

```bash
node scripts/render.mjs --input scene.html --output clip-16x9.mp4 --duration 25 --gpu
node scripts/render.mjs --input scene.html --output clip-9x16.mp4 --duration 25 --width 720 --height 1280 --gpu
node scripts/render.mjs --input scene.html --output preview-16x9.mp4 --duration 25 --gpu --audio inputs/narration.wav --query captions=1
node scripts/render.mjs --input scene.html --output preview-9x16.mp4 --duration 25 --width 720 --height 1280 --gpu --audio inputs/narration.wav --query captions=1
```

The `clip-*` files are silent and caption-free, ready to drop onto the user's timeline at the window's start. The `preview-*` files carry the narration and burned captions so the user can judge timing without opening an editor; they are not for delivery.

Check stills at three or four step times in both shapes before the full render (`--still <t>`), then a contact sheet of the preview: every title readable, no card covering a subject or another card, the packet on the link the narration names at the moment it names it. Confirm both clips with ffprobe (size, frame count, duration equal to the window).

## Revisions

A revision is a new version folder (`v2/`) with its own scene and four files; earlier versions stay. Change the content in section 1, not the template. Record in `brief.md` what the user asked for and what changed.
