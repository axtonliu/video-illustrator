# Shadow puppetry

Light, a translucent screen, and articulated silhouettes create a theatrical image. Read `directing.md` for
the shared meaning and continuity approach.

## When to choose it

Useful for encounters, journeys, hidden relationships, changing perspective, separation and reunion, or
stories that can be understood through gesture and outline. The relation between a body and its shadow can
reveal a difference in viewpoint.

Less useful for detailed interfaces, dense charts, subtle color distinctions, or mechanisms whose internal
parts cannot be made legible in silhouette. Do not turn technical uncertainty into a mystical explanation
merely to suit the atmosphere.

## Construct the scene

Design original silhouettes with distinctive heads, hands, tools, and directional poses. Test whether
important overlaps can still be understood as a single dark shape. Gaps and negative spaces often convey more
than small surface decoration.

Choose a screen and light arrangement that explains the image. A close puppet can cast a crisp silhouette;
changes in distance from the screen can alter softness and scale. If using this effect, maintain a coherent
relationship rather than varying blur and size independently for decoration.

Articulated flat shapes can rotate at visible or implied joints. Rods are optional: show them when the
performance apparatus matters, or omit them consistently for a stylized shadow world. A shadow should still
behave like a connected subject.

SVG masks, Canvas compositing, or layered HTML can create the screen and silhouettes. Use restrained stable
surface texture. Colored translucent inserts are optional; keep the central relationship readable without
relying on subtle hue differences.

## Movement grammar

Let articulation define movement: a wrist turns, an elbow opens, a head inclines, or a hinged object unfolds.
Gesture needs a readable profile and a moment to settle. Small changes in angle can carry intention without
detailed facial features.

Use overlap as an event. A subject can hide another, reveal an opening, separate from a group, or become
recognizable when the layers move apart. Show enough of the initial arrangement that the reveal explains a
relationship rather than a visual trick.

A deliberate side-on stage makes travel and encounters legible. Changes in apparent shadow size can convey
distance from the light or screen when that geometry is established. Do not confuse a change in shadow size
with a factual change in quantity.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s
- enter / exit: 16–24 f / 12–18 f
- ease: cubic-bezier(0.4, 1.08, 0.4, 1.02) (in) / cubic-bezier(0.55, 0, 0.85, 0.35) (out)
- overshoot: ≤ 1%   squash-stretch: none (rigid leather; joints rotate instead)
- reading hold: ≥ 1.0 s   end hold: ≥ 1.8 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Rivet joints.** Every limb rotates about a fixed rivet point, ±25–40°, with a 2–4 frame lag down the chain.
- **Screen distance.** Pressed to the screen, a puppet's edge is sharp; pulled back, its edge blurs 2–6 px and it grows 3–8%.
- **Lamp behind the screen.** Warm light falling off 10–15% from centre to corner; a 1–2% flicker at 4–8 Hz only when the scene has a flame.

## Sound

Optional soft contact or restrained instrumental accents can support the performance.

## Common failures

- A black cutout merely slides around without gesture or articulated construction.
- Overlapping limbs merge into an unreadable mass at the decisive moment.
- Shadow softness and scale change without a coherent light relationship.
- Exotic ornament substitutes for story or misattributes a specific cultural tradition.

## Transferable prompt

> Illustrate [source idea] as an original shadow performance centered on [subject]. Use articulated
> silhouettes, negative space, and [overlap or light relationship] to reveal [meaningful change]. Establish a
> coherent screen and light arrangement, keep decisive gestures readable in profile, and end with
> [understandable result]. Use ornament or audio only when it supports the scene rather than naming a
> tradition.
