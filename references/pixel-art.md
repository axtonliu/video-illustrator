# Pixel art

A deliberately coarse image grid turns shape, pose, and light into readable clusters. Read `directing.md` for
the shared meaning and continuity approach.

## When to choose it

Useful for resource flows, small worlds, modular construction, journeys, repeated attempts, and systems whose
changing state can be shown through recognizable objects. An environment can retain evidence of earlier
actions as the subject travels.

Less useful for small photographic detail, subtle facial likeness, or dense prose. A game-like appearance does
not justify invented scores, success rates, or rewards. Use numerical displays only when they are supplied
facts or clearly illustrative.

## Construct the scene

Choose a logical drawing resolution that supports the important shapes. Design at that resolution, then
enlarge with nearest-neighbor scaling. A visible pixel should have a consistent role; avoid mixing crisp tiny
sprites with unrelated blurry images.

Build contours from purposeful clusters. Show form through silhouette and selective interior pixels before
adding surface detail. Use a considered palette with distinct value groups for subject, surroundings, and
emphasis rather than random color noise.

Sprites need recognizable proportions across their poses. Draw an object turning or bending instead of simply
rotating a low-resolution rectangle whenever that rotation would break its shape. Reuse structures where the
represented world is modular.

Canvas with image smoothing disabled is a practical baseline. SVG or CSS can work if their geometry respects
the chosen grid. Keep decorative dithering stable in object coordinates and avoid moving individual texture
pixels independently.

## Movement grammar

Select pose changes that make direction, weight, and intention readable at small size. A walk, push, fall, and
hesitation need different silhouettes and timing, even when they use few poses. Hold a pose long enough for
the viewer to recognize its action.

Use visible state changes: an empty slot fills, a path opens, a structure gains a piece, or a carried item
remains with its carrier. Do not reset the world between beats when accumulation is the point of the
explanation.

Camera scrolling can reveal a route or a larger system. Coordinate its sampling with the sprite grid to
prevent crawling edges. A fixed view often explains throughput or competing paths more clearly than a
continuously scrolling game scene.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: 12 fps stepped (sprites and camera snap to whole logical pixels)
- enter / exit: 6–10 f / 4–6 f
- ease: cubic-bezier(0.25, 0, 0.25, 1) (in) / cubic-bezier(0.5, 0, 1, 1) (out)
- overshoot: none (use a pose change instead)   squash-stretch: none
- reading hold: ≥ 0.8 s   end hold: ≥ 1.2 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Logical grid.** Draw at 320×180 for 1280×720 and scale 4× nearest-neighbour (`imageSmoothingEnabled = false`); round every position to a whole logical pixel on every frame, camera included.
- **Palette.** At most 16 colours, with 2–3 value steps per hue and no anti-aliased edges.
- **Ordered dither.** A 2×2 or 4×4 Bayer pattern anchored to world coordinates for gradients such as sky.
- **Pose cycles.** A walk has 4–6 poses, each held 2–3 steps at 12 fps; a jump has three poses (crouch, air, land) with the landing held 3 steps.

## Sound

Optional short synthesized tones can distinguish contact, receipt, or completion. They need not resemble a
particular game. Silence is a valid delivery choice.

## Common failures

- Pixelation is applied after drawing, destroying detail without creating good shapes.
- The subject changes apparent size or identity across poses.
- A decorative game interface competes with the actual explanation.
- Camera movement causes pixel edges or dither patterns to shimmer.

## Transferable prompt

> Illustrate [source idea] in an original pixel world at a deliberate logical resolution. Follow [recognizable
> subject] through [meaningful state changes]. Use clear clusters, consistent sprite proportions, and timed
> poses to express [action or relationship]. Preserve earlier changes in the environment, keep any supplied
> labels readable, and end with [visible consequence].
