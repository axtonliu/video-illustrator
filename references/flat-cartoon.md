# Flat cartoon

Expressive silhouettes and clear poses create a world with little dependence on shading. Read `directing.md`
for the shared meaning and continuity approach.

## When to choose it

Useful for everyday situations, social exchanges, competing intentions, learning, small mistakes, and
approachable explanations with identifiable actors or objects. Body language can make a cause, hesitation, or
reaction understandable before a label.

Less useful when exact machinery, photographic evidence, or subtle likeness is the subject. A friendly figure
should not replace the specific relationship being taught. A serious topic can use restraint rather than
exaggerated cheerful acting.

## Construct the scene

Design original subjects with distinct proportions and readable silhouettes. Choose an intentional contour
treatment: outlined shapes, unoutlined color masses, or a consistent combination that separates important
parts.

Use flat fills and selective shadow shapes. Different materials can have different edge behavior without
requiring realistic lighting. Give hands, faces, tools, and contact points enough definition to make the
intended action understandable.

Organize the scene around the actor's task. Background props should explain place, scale, or obstacles. Empty
space can support a gesture or establish the distance between two subjects; it does not need to be filled with
decorative shapes.

SVG paths are useful for articulated figures and props. Canvas suits many interacting objects. Place joints
where the illustrated body can plausibly bend, and distinguish rotation at a joint from a shape change needed
for a particular pose.

## Movement grammar

Start from intention: what does the subject notice, attempt, encounter, and change? Use a clear pose for the
action and another for its consequence. A look or a shift of weight can prepare an event more effectively than
an arbitrary entrance bounce.

Apply anticipation, follow-through, or squash and stretch where they clarify energy. Keep identifying
proportions recognizable. Hands should stay attached to held objects, and feet or supporting surfaces should
make contact at the relevant moments.

Frame the relation between actors before cutting closer to a decisive gesture. Use a wider view when the
consequence changes the surrounding world. Camera motion should help read the acting rather than compensate
for weak poses.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s for acting (the camera moves on 1s)
- enter / exit: 10–14 f / 8–10 f
- ease: cubic-bezier(0.34, 1.56, 0.64, 1) (in) / cubic-bezier(0.55, 0, 1, 0.45) (out)
- overshoot: ≤ 10%   squash-stretch: ≤ 12%
- reading hold: ≥ 0.7 s   end hold: ≥ 1.0 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Anticipation.** Before any big action, 3–6 frames in the opposite direction, 10–20% of the move's distance.
- **Follow-through.** Loose parts (hair, scarf, tail, a strap) lag the body by 2–4 frames and settle over 8–12 frames.
- **Line and fill.** 3–4 px constant outline, flat fills, one shadow tone 15–20% darker, no gradients.
- **Blinks.** Three frames closed, every 2–5 seconds, never on a cut.

## Sound

Optional light contact sounds or brief tonal reactions can support physical events. Avoid implying dialogue
unless speech is actually supplied or produced.

## Common failures

- Smiling generic figures decorate a text explanation without performing an action.
- Limbs drift through props or feet slide during a planted pose.
- Every reaction is an identical bounce or exaggerated facial expression.
- Simplification removes the specific tool, obstacle, or relationship from the source.

## Transferable prompt

> Illustrate [source idea] with original flat cartoon subjects in [setting]. Let [actor] attempt [action],
> respond to [visible cause], and reach [changed state]. Design expressive silhouettes and legible contact
> points. Use poses, gaze, and selective follow-through to carry intention, with readable supplied labels
> where needed. End on the consequence rather than an unrelated celebratory animation.
