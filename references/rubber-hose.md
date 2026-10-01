# Rubber hose

Elastic limbs and rhythmic silhouettes turn effort, resistance, and consequence into physical comedy. Read
`directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for stubborn obstacles, repeated attempts, competing forces, overload, feedback loops, and playful
explanations where a subject's effort is central. Elasticity can make an invisible force visible through
stretch, compression, and recoil.

Less useful for precise anatomy, realistic machinery, or sensitive human situations where comic distortion
would undermine the meaning. Exaggerated force remains an illustration and should not masquerade as a physical
measurement.

## Construct the scene

Invent distinctive characters or personified objects with strong silhouettes and simple facial features. Use
flexible curves for limbs, clear attachment points, and readable hands or feet. Familiar historical motifs are
optional, not a costume kit to reproduce; avoid recognizable characters and signature combinations.

Choose a coherent line weight and fill treatment. Monochrome can emphasize form, while a limited color family
can distinguish roles. A vintage filter is unnecessary: the identity comes from shape, rhythm, and behavior.

Use curved paths whose control points can change with the pose. Keep the body's mass readable as limbs
lengthen or bend. Scale, taper, and attachment need to cooperate so a stretched arm still belongs to the same
subject.

SVG curves or Canvas paths are a practical baseline. Construct props with specific contact surfaces: a handle
can be gripped, a spring can compress, and a heavy load can pull the body away from its planted feet.

## Movement grammar

Make elasticity respond to a cause. A limb stretches while reaching or resisting, a body compresses on impact,
and recoil follows release. Do not stretch every object simply because the visual style permits it.

Establish effort through anticipation, a clear line of action, and changing tension. Maintain contact during
the hold: a planted foot stays planted, a grip stays on the handle, and the held object follows the force
until visibly released.

A stable stage makes deformation easy to follow. Track or cut when the subject moves into a new situation;
avoid constant camera wobble on top of elastic motion. Let the final pose reveal whether the effort worked and
what it cost.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s
- enter / exit: 8–12 f / 6–10 f
- ease: cubic-bezier(0.3, 1.8, 0.5, 1) (in) / cubic-bezier(0.6, -0.4, 0.8, 0.2) (out)
- overshoot: ≤ 18%   squash-stretch: ≤ 25%
- reading hold: ≥ 0.6 s   end hold: ≥ 1.0 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Hose limbs.** Each limb is one quadratic curve from shoulder to hand at a constant 6–10 px width; bend follows the joint angle, no elbows.
- **Beat bounce.** Idle characters bob 4–8 px on every beat, on 2s, landing on the beat.
- **Volume-preserving squash.** scaleX = 1 / scaleY; stretch to 1.25 on fast moves and squash to 0.8 on landing for 2–4 frames.
- **Pie-cut eyes.** Blink for 3 frames every 2–4 seconds; a double take is two blinks 6 frames apart.

## Sound

Optional squeaks, soft impacts, or rhythmic accents can underline tension and release. Keep the visual action
understandable without a synchronized music track.

## Common failures

- Every part bounces continuously, so effort and release become indistinguishable.
- Hands detach from props during stretching or feet slide during resistance.
- Vintage grain stands in for expressive posing and purposeful deformation.
- A comic payoff changes the source's causal claim or trivializes its subject.

## Transferable prompt

> Explain [source idea] through an original elastic character interacting with [specific obstacle or force].
> Make [cause] produce visible tension, show [attempt] through readable stretch and compression, and let
> release lead to [consequence]. Preserve attachments and contact points. Use rhythm and silhouette for
> expression, with a final pose that makes the mechanism clear rather than adding an unrelated gag.
