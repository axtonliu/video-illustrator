# Low-poly worlds

Faceted objects inhabit a legible three-dimensional space. Geometry, silhouette and
light carry the look rather than detailed textures. Read `directing.md` alongside it.

## When it fits

World building, geography, simple environments, infrastructure and spatial systems.
It can make an abstract process tangible when a spatial model adds understanding.
Avoid using it to suggest photoreal evidence, detailed anatomical accuracy or a
precise physical result. A simple idea need not become a giant virtual landscape.

## Construct the scene

Use purposeful large forms before adding facets. Vary silhouettes so that a house,
a tree and a machine remain recognizable at the intended viewing size. Choose a
consistent scale and lighting direction. Plan where important objects will overlap.

Facets should clarify curvature and volume. Random triangulation and high contrast
on every face produce visual noise. A coherent ground plane and contact shadows
help the viewer understand distances and support. Labels belong in readable screen
space or on a stable surface, not tiny text on continuously rotating geometry.

## Movement and camera

Move objects through paths the viewer can follow. An arriving object can change the
state of a place rather than simply disappearing on contact. Grow or assemble a
world when the source describes development; keep earlier states recognizable.

Choose camera motion for spatial information: a parallax move reveals depth, a rise
reveals reach, a local approach inspects a mechanism. Hold when object motion is
already sufficient. Keep orientation through cuts with a landmark or direction.

## Sound and implementation

Optional spatial accents can support contact or arrivals. Silence is valid.
Use a suitable available WebGL stack or a deliberately stylized projected scene.
Do not install a large engine merely for faceted shapes; do not call 2D projections
photorealistic 3D. Rebuild the scene deterministically at each requested time.

## Failure modes

- Orbiting the camera continuously becomes the whole film.
- Facets flicker because geometry or lighting changes randomly by frame.
- Scene scale changes silently and makes comparisons misleading.
- Every topic becomes the same island growing out of the sea.

## Transferable prompt

> Build a faceted world around [subject]. Make [spatial relationship] clear through
> [objects and landmarks], and animate [meaningful event] with persistent state.
> Let camera changes reveal [specific information]. End on [legible consequence].
