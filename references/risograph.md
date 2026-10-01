# Risograph-inspired print

Separated ink layers, overprint intersections, and controlled registration make bold images.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for lively editorial explanations, participation, overlapping categories,
contrasts, and collective patterns. Printing layers can visibly demonstrate how
independent contributions combine into a shared result.
Less suited to photorealism, fine surface simulation, or charts needing many precise
color distinctions. Do not imply that visual overlap proves a statistical relationship.

## Construct the scene

Design intentional ink separations with different shapes and roles. Use a compact
palette of print-like colors selected for contrast and useful overlap. Let the paper
act as a real unprinted region rather than another opaque background layer.

Implement layers with masks, flat fills, and stable halftone or grain. Simulate
selected overlaps using authored composite colors or controlled blending. Test the
chosen colors together conceptually: arbitrary multiply effects can turn them muddy.

Slight authored registration offset can give the image character. Keep essential
labels, symbols, and comparisons aligned enough to read. Anchor grain to its ink
layer and distinguish a deliberate offset from an accidental layout mistake.

## Movement and camera

Treat a layer as a participant: it can slide into alignment, reveal another layer,
or separate to expose how an image was constructed. Let the overlap express the
source relationship instead of serving as constant decorative color interference.

A print can build through purposeful stamping, sweeping, or layer registration.
Once established, its depicted objects may act within the graphic world. Avoid
forcing every story to become a literal printing-press demonstration.

Use a fixed poster-like composition for strong comparisons. A hard cut or graphic
match can advance the argument cleanly. Small changes in registration can punctuate
an event; ongoing jitter makes both typography and print texture feel unstable.
Leave the composed image long enough to read after layers meet.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: 12 fps stepped (layers move on a quantised clock)
- enter / exit: 8–12 f / 6–8 f
- ease: cubic-bezier(0.34, 1.4, 0.64, 1) (in) / cubic-bezier(0.5, 0, 0.75, 0) (out)
- overshoot: ≤ 6%   squash-stretch: ≤ 6%
- reading hold: ≥ 0.7 s   end hold: ≥ 1.2 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Misregistration.** Each ink layer sits 1–3 px off register in a fixed direction per shot (seeded by the shot id). It may snap into register on a key moment; it never jitters per frame.
- **Spot inks.** Two or three inks at 85–95% alpha with multiply overprint (for example fluorescent pink, medium blue, yellow); the overlaps are the extra colours.
- **Layer grain.** Stochastic stipple at 15–30% density per layer, anchored to the layer, plus a 2–4% low-frequency density blotch.
- **Halftone tones.** Cells of 8–10 px at 1280, a different screen angle per ink (15°, 45°, 75°).

## Optional sound

If produced, a dry stamp, roller, or rhythmic contact can emphasize a layer arriving.
Use the event's rhythm rather than an automatic sound for every moving shape.
Supplied speech remains primary; the graphic treatment can also work silently.

## Common failures

- A grain overlay is the only distinction from a generic vector animation.
- Registration error affects text so strongly that the message becomes difficult.
- Every overlapping object darkens without a meaningful or attractive color plan.
- Random texture changes look like compression damage instead of print character.

## Transferable prompt

> Illustrate [source idea] with risograph-inspired ink separations. Assign [elements]
> distinct layers and let [alignment, overlap, or separation] express [relationship].
> Use bold silhouettes, stable print grain, and deliberate overprint colors. Keep
> exact labels readable. Time layer changes around the argument, using a graphic cut
> when clearer, and resolve into [meaningful final composition].
