# Chalkboard

A dark working surface, granular marks, and retained revisions support an unfolding lesson.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for mathematical reasoning, mechanisms, tradeoffs, dependencies, and correcting
a misconception. It can evoke a working classroom or workshop through the way marks
are added, revised, and compared, not merely through a dark background.
Less suited to photographic evidence or intricate scenes whose detail turns to dust.
Use real source equations and units; chalk does not legitimize invented notation.

## Construct the scene

Plan the spatial argument: keep premises, intermediate work, and the relevant result
close enough to connect. Use concise annotations and a clear reading direction.
Separate large form strokes from finer mathematical symbols and labels.

Canvas masks or SVG paths with cached granular edges can suggest chalk deposition.
Leave small gaps in broad marks but keep symbols unambiguous. Keep board grain fixed;
move residual chalk only when an eraser or another visible action disturbs it.

A partially erased region can preserve previous reasoning without competing with the
current step. An occasional colored mark can identify a changed variable or active
relation. Do not use color alone to distinguish states that viewers must compare.

## Movement and camera

Build an expression or diagram in the order needed to understand it. Animate the
represented mechanism where useful, then return the result to the surrounding work.
A highlighted term can connect to the part of the diagram it describes.

Use local erasure for a revised assumption or expired intermediate step. Show the
replacement clearly; clearing the entire board at each sentence discards context.
Erasure can leave a soft trace without turning the board into a ghosted mess.

Hold the camera during a delicate derivation. A pan can follow expanding work, and
a cut can juxtapose two solutions. A final wider view can reveal how earlier parts
support the result. Avoid zooms that make notation unreadable during a key step.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s
- enter / exit: 14–22 f / 10–14 f
- ease: cubic-bezier(0.4, 0, 0.2, 1) (in) / cubic-bezier(0.6, 0, 0.8, 0.4) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Chalk grain.** Stroke alpha is cut by a static, board-anchored noise so 25–40% of the stroke's pixels are missing, more at the edges.
- **Smudge erase.** An erased mark stays at 8–15% opacity, widened by a 4–8 px blur, for the rest of the scene.
- **Dust on emphasis.** An underline or circle drops 6–12 dust specks that fall 10–20 px over 10 frames; once per key point.

## Optional sound

Brief chalk and eraser accents may make a visible action tangible if actually made.
Avoid continuous squeaks or dust sounds. With supplied speech, marks should arrive
when their terms become relevant; leave pauses for the audience to inspect the work.

## Common failures

- A whiteboard scene receives a dark background and no change in mark behavior.
- Chalk grain destroys minus signs, decimal points, or distinctions between symbols.
- Erasing discards the premise needed to interpret the next conclusion.
- Decorative equations appear as scientific-looking filler without source support.

## Transferable prompt

> Explain [source relationship] on a working chalkboard. Establish [premises or
> objects], develop [reasoning or operation], and retain the marks needed to understand
> [result]. Use granular strokes, readable exact notation, and local revisions tied
> to actual changes. Animate the mechanism when useful. Keep framing steady during
> important reasoning and end with the relationship available for inspection.
