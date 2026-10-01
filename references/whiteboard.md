# Whiteboard

A drawing develops as the viewer follows a reason, a mechanism, or a correction.
Read `directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for causal explanations, dependencies, mental models, and working through a
misconception. It suits ideas where seeing how the diagram is built helps understanding.

Less useful for atmospheric scenes, fast spectacle, or detailed physical simulations.
Drawing a causal arrow does not establish that the claimed cause is true.

## Construct the scene

Plan the completed diagram before animating its construction. Leave room for the
parts that will arrive later. Favor distinctive sketches of the actual subject:
a valve with an opening, a wheel with an axle, a page with a recognizable folded edge.
Simple silhouettes should remain recognizable without reading every label.

Use a quiet surface, a legible primary stroke, and an accent for the current focus.
Keep slight contour irregularity stable over time; re-randomized lines create flicker.
Variation can suggest a drawing hand without making small words illegible.

Labels identify objects or relations; they need not be handwriting. Use readable
fonts for longer labels rather than simulating a pen that crawls through every letter.
An on-screen hand is optional. The changing line already indicates the drawing action.

## Movement grammar

Reveal a path along its length when the order matters. Build an object before sending
something through it. Connect the cause and effect after their roles are apparent.
Animate the modeled event as well as the drawing: a valve should change the stream,
not merely receive an arrow and a label.

Retain previous evidence while adding the next relation. De-emphasize finished areas
so the eye can follow the new part. When correcting an assumption, visibly change
the mistaken relation and preserve what remains valid.

A steady camera supports reasoning. Pan when the diagram genuinely extends beyond
the current space. A close view can explain a mechanism, followed by a wider view
that locates it within the full system. A cut to a separate comparison is welcome
when it removes needless camera travel.

The ending should let the viewer inspect the now-complete relationship. Do not rush
past the final causal connection just because the pen has finished drawing it.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s (marker travel is continuous; a drawing hand, if shown, moves on 2s)
- enter / exit: 18–30 f / 8–12 f
- ease: cubic-bezier(0.45, 0, 0.55, 1) (in) / cubic-bezier(0.4, 0, 1, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Draw-on stroke.** Animate `stroke-dashoffset` from the path length to 0 at 900–1400 px per second (a 300 px arrow takes 7–10 frames); split the path at corners and ease each segment, so the marker slows by about 30% into a corner.
- **Marker weights.** 5–6 px for structure, 3 px for annotation, one accent colour reserved for the relation that just changed.
- **Earlier marks stay.** Finished strokes stay at full opacity; a correction is a 3 px strike-through drawn over the old mark, never a fade.
- **Erase only for a real change.** An eraser pass takes 8–12 frames along the stroke direction and leaves a 6–10% grey ghost of the old mark.

## Sound

Optional short pen or chalk accents can signal construction. Use them sparingly;
continuous scratching can fight the narration. A change in the system may deserve
a distinct sound from the act of drawing it. Silence remains a valid treatment.

## Common failures

- A finished slide is exposed by a giant left-to-right wipe.
- A decorative hand draws unrelated marks while a paragraph does all the explanation.
- The board erases itself at every beat, forcing the viewer to rebuild the model.
- Arrows animate before their endpoints exist or point ambiguously between objects.
- Hand-drawn styling makes small labels unreadable.

## Transferable prompt

> Explain [source mechanism] as a developing whiteboard drawing. Establish [objects]
> and reveal how [cause] changes [effect]. Keep valid relationships visible as the
> explanation grows. Show the mechanism operating, using drawing reveals to guide
> attention rather than merely decorating labels. End with a readable view of
> [the complete relationship]. Use stable hand-drawn contours and concise labels;
> choose framing changes only when the diagram needs a closer or wider view.
