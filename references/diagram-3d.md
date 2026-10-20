# Diagram 3D / 图解立体

A few calm 3D models on a light cool paper, lit like a product studio, with one warm accent on
the single place that is changing. Read `directing.md` for the shared meaning and continuity
approach. This is the look [mechanism-template.html](mechanism-template.html) ships with, and the
default for explainer and episode modes when the user names no style.

## When to choose it

Useful for mechanisms: parts that persist and something that moves between them (a model and the
tools it calls, a request through services, money between accounts, a force through a structure),
an object taken apart, or one subject changing across several sentences. Depth and light make
parts read as things rather than boxes on a slide, while the paper keeps the frame as clean as a
diagram.

Less useful for a feeling, an argument without parts, or numbers (use a chart). It is quiet by
design: for a promo that must stop a stranger it needs the cinematic treatment or another style.

## Construct the scene

Colour has fixed roles: a light cool paper (`#F4F6F8` in the template), dark text, one structure
colour for the main parts, a light secondary for links and minor parts, and one warm accent that
marks only the single place changing now (the packet while it travels, or the one subject the
sentence is about once it arrives). No dark backgrounds, neon, glow or HUD.

The light, shadows and rounded edges carry the quality and stay fixed; keep the template's
defaults rather than rebuilding the lighting: a procedural studio environment whose softbox strips
draw the highlights, Neutral tone mapping with `paper()` so the background lands exactly on the
paper token, a soft key shadow, a blurred contact shadow under the subjects, and GTAO with MSAA in
the composer. Under Neutral tone mapping the paper sits in the compressed highlights, so a shadow
material needs about 0.5 opacity to read. `RoomEnvironment` with ACES reads flat and greys the paper.

The finish is chosen per subject with `paint()` and `FINISH`, not one colour and one material for
everything: abstract concept models default to satin or clay (calm, like a studio clay model, not
toy plastic); real objects get the real thing's materials (gloss clearcoat paint, glass, rubber,
satin metal); finishes can mix in one frame. A flat, cheap look comes from flat light, dirty
shadows and hard edges, not from a matte finish.

Arrows use `arrow()`, a lathed shaft with a filleted head; links get its head. A curved subject (a
car body, anything organic) needs a lofted smooth shell with seamless normals, or a licensed real
model, never boxes, cylinders and spheres stuck together. In the 2026-10 test the same shot rebuilt
this way in three.js beat a Blender render at about 30 ms a frame, some 600 times faster: for this
kind of shot the gap is craft, not the engine.

Labels are flat 2D cards facing the viewer, never 3D text: generous padding, a heavy title over a
lighter note, a soft shadow, the accent as a small dot before the title, never a stripe on one
side ([AR-17](aesthetic-rules.md#ar-17-cards-and-labels-without-the-ai-default-look)).

## Movement grammar

The camera holds still and moves only when a step needs it to reveal something (an exploded view,
a see-through, a part brought forward); it never moves to prove the scene is 3D. A subject in focus
lifts slightly; a packet eases along its link and the target lights only when it arrives. Nothing
moves for decoration: no idle spinning, no floating, no breathing scale.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s (models are rendered, not drawn)
- enter / exit: 10–15 f / 8–10 f
- ease: cubic-bezier(0.65, 0, 0.35, 1) (in) / cubic-bezier(0.65, 0, 0.35, 1) (out)
- overshoot: none (a lift, not a bounce)   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Fixed studio light.** Procedural PMREM softbox strips at environment intensity 0.9, a key light with a 2048 shadow map and shadow radius 5, Neutral tone mapping at exposure 1.0 with the background passed through `paper()`.
- **Grounding.** A contact shadow rendered from below (reach 1.2 units, two blur passes at 1.2 and 0.5) plus GTAO at radius 0.5 and blend 0.9 over a 4× MSAA target.
- **Finish by subject.** Satin (roughness 0.45, clearcoat 0.25) for concept models, clay (roughness 0.72) for a matte study model, gloss (clearcoat 0.8, clearcoat roughness 0.08) for real painted shells.
- **Rounded construction.** Rounded boxes with an edge radius near 18% of the smallest side; lathed arrows with a 0.13-unit head radius and a 0.3-unit head length.

## Common failures

- Every part the same colour and material, so the one changing place does not stand out.
- Two accents on screen at once, or the accent used for decoration.
- The camera orbiting to show off depth while the viewer is trying to follow a packet.
- A card covering its subject, the header or another card; text below the caption band.
- A real object built from primitives, which reads as a toy.

## Transferable prompt

> Show [mechanism] as a few calm 3D models on light cool paper: [subjects] stay on screen, [links]
> connect the ones the narration names, and one warm accent marks only the place changing at each
> sentence. Keep the studio light, contact shadows and rounded edges; pick each part's finish by
> what it is. Hold the camera still unless a step needs a reveal, and keep labels as flat cards.
