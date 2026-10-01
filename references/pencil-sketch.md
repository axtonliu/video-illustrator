# Pencil sketch

Searching lines, directional hatching, and selective erasure make thinking visible.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for invention, mechanisms, alternatives, observation, and an idea taking shape.
Unlike a clean whiteboard, this treatment can retain tentative construction and show
how a form or decision becomes more definite.
Less suited to luxury surface rendering or a source that requires polished documentary
evidence. Sketchiness must not make established facts appear uncertain by accident.

## Construct the scene

Choose contours that describe the actual subject's construction. Use light guide
lines to locate joints, axes, or volumes; strengthen only the contours that matter.
Vary hatching direction with the surface it describes instead of filling every region
with identical diagonal lines. Leave highlights as untouched paper.

Canvas paths and clipped hatch groups are sufficient for a stylized graphite surface.
Anchor grain and small contour variations to the object. Model authored pressure and
stroke order; avoid frame-wise random wobble as a substitute for drawing character.

Keep handwritten annotations short if used. Set longer explanations in readable type.
Use an accent only when it has a purpose, such as distinguishing a chosen route.
A believable drawing can contain deliberate incompleteness without looking unfinished.

## Movement and camera

Let tentative lines propose a shape or path, then strengthen, revise, or erase them
when the source's reasoning changes. Erasure should affect the relevant marks rather
than bleaching the whole frame. Residual traces can help the viewer compare versions.

Animate joints around their actual pivots, and connect moving parts through the
mechanism they represent. A drawn lever that operates explains more than a sequence
of increasingly detailed static pictures. Keep reference points stable for comparisons.

Use close views for a meaningful detail and pull back when the larger construction
explains its purpose. A cut between candidate solutions may communicate better than
morphing one design into another and hiding the distinction.
Choose smooth movement or a deliberate drawn cadence based on tone, not by default.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s (a held drawing keeps its marks; boiling is a chosen mood, not the default)
- enter / exit: 10–16 f / 6–10 f (per stroke group)
- ease: cubic-bezier(0.3, 0, 0.2, 1) (in) / cubic-bezier(0.5, 0, 0.9, 0.5) (out)
- overshoot: none   squash-stretch: ≤ 4%
- reading hold: ≥ 0.8 s   end hold: ≥ 1.2 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Construction first.** Light guide lines at 20–30% opacity appear 4–8 frames before the committed contour, and stay.
- **Pressure taper.** Each stroke's width runs 0.4 → 1.0 → 0.5 of its base (1.5–2.5 px) from start to end, drawn on with `stroke-dashoffset`.
- **Hatching.** Parallel lines 4–6 px apart that follow the surface; cross-hatch at +90° only for the darkest value.
- **Line boil, when chosen.** Redraw on 2s with a seeded 1–2 px jitter, seed = floor(t × 15); objects that should read as still keep one seed. Not the default (see [hand-made motion](directing.md#hand-made-motion-poses-and-exposure)).

## Optional sound

Short graphite, eraser, or mechanism accents can support visible actions if produced.
Avoid continuous scratching under supplied speech. Mechanical movement can remain
silent; a sketch aesthetic does not require an artificial drawing-hand soundtrack.

## Common failures

- Global jitter obscures a mechanism that should be easy to follow.
- Hatching becomes a decorative moving wallpaper unrelated to form.
- Construction lines imply alternatives that the source never considered.
- Every new beat replaces the whole sheet instead of developing the drawing.

## Transferable prompt

> Develop [source idea] as a pencil-sketch animation of [specific subject]. Use light
> construction, directional hatching, and selective reinforcement to reveal [meaning].
> Make [mechanism or revision] happen visibly while keeping [reference point] stable.
> Use erasure only for an actual correction or change. Frame the detail and the whole
> to clarify their relationship, with stable graphite texture and readable labels.
