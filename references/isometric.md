# Isometric process

An object or flow moves through a spatial model with a consistent viewing angle.
Read `directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for workflows, distribution, transformations, routing, and systems with parts
whose location or connections help explain their roles. A recurring tracked object
can make an abstract process concrete.

Less useful for wordplay, intimate performance, or relationships where depth adds
nothing. Use a simpler diagram if perspective obscures an exact comparison.

## Construct the scene

Choose a consistent projection and world coordinate system. Derive position, scale,
and depth ordering from that system; avoid independently eyeballing every block.
Orthographic projection preserves relative size while the camera moves.

Make stations recognizable by what they do. A splitter needs visible exits; a buffer
needs room to accumulate items; a processor should visibly change its input. Vary
silhouette and internal detail without introducing unrelated decoration.

Keep the tracked object identifiable through color, marking, or shape. Define which
features persist and which change as a result of processing. If objects split,
retain a visible family resemblance rather than silently spawning unrelated tokens.

Separate ground, paths, structures, moving subjects, and labels. Keep labels upright
in screen space where perspective would make reading difficult. Cast consistent
shadows if using them; do not let shadows conceal connections.

## Movement grammar

Move subjects along visible routes. Objects should arrive before a station reacts,
and departures should reflect the operation that just occurred. A queue accumulates
in available space, while a blocked route changes what can pass through it.

Use staging to expose hidden actions: lift a lid, separate a housing, or cut to an
interior view. The reveal must help explain the operation. Restore enough context
for the viewer to locate that operation in the broader process.

Track the object when its journey is the story. Hold a wide camera when comparing
flows is more useful. Avoid an orbit solely to advertise 3D; viewpoint changes cost
orientation. A clean cut between overview and detail can be clearer than a long flyby.

Keep speed changes meaningful. Moving everything constantly can hide the important
operation. Let a bottleneck, transformation, or branching choice receive the attention.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 12–18 f / 8–12 f
- ease: cubic-bezier(0.3, 1.1, 0.4, 1.05) (in) / cubic-bezier(0.5, 0, 0.75, 0) (out)
- overshoot: ≤ 3%   squash-stretch: ≤ 6%
- reading hold: ≥ 0.8 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Projection.** 2:1 dimetric (edges at 26.565°), tiles 64×32 px at 1280; every object stands on the tile grid.
- **Face lighting.** Top face 115%, left face 100%, right face 80% of the base value, unchanged for the whole film.
- **Drop-in build.** Objects fall 40–80 px onto their tile, squash up to 6% for 2–3 frames and kick up 4–6 dust pixels; neighbours stagger 3–4 frames along the path the viewer should follow.

## Sound

Optional contact, transport, or mechanism sounds can differentiate actions. Give an
operation a sound only when the event occurs. With speech, a quiet mechanical bed
should not obscure the explanation; supplied audio determines the available timing.

## Common failures

- Attractive miniature buildings function only as labels on an unchanged flowchart.
- Depth ordering makes objects jump in front of walls they should pass behind.
- Camera travel hides the item at the moment its state changes.
- Perspective makes unequal objects appear to be a trustworthy numeric comparison.
- An abstract process acquires unsupported real-world machinery or factual steps.

## Transferable prompt

> Show [source process] as a compact isometric world. Follow [tracked object or flow]
> through [the actual relevant stages], preserving [identity feature] while showing
> [state changes]. Make each stage visibly perform its role. Use consistent world
> coordinates, readable routes, and deliberate depth ordering. Choose an overview,
> tracking move, or detail cut according to what explains the process most clearly.
> End where [the source's result or bottleneck] is easy to see.
