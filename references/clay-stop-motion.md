# Clay / stop-motion

Soft sculpted forms move through intentionally authored poses. Weight, contact and
material response distinguish the style. Read `directing.md` for content choices.

## When it fits

Everyday mechanisms, approachable stories, transformations, joining and separating.
Clay makes a process feel tangible and can turn an abstract change into an action.
Avoid this treatment when precise text, geometry or a real product surface is the
central evidence. A handmade look must not imply actual physical filming.

## Construct the scene

Start with a convincing silhouette and a small set of material behaviors. Use rounded
volumes, visible joins, restrained surface marks and contact shadows. Texture stays
attached to the object. Do not overlay moving noise and call it fingerprints.

Shape deformation should preserve recognizable features. If something compresses,
show where material moves; a lump should not change volume arbitrarily unless that
transformation itself is an intentional visual metaphor. Keep text on stable labels.

## Movement and camera

Author poses for anticipation, effort, contact and settling. A stop-motion cadence
uses deliberate held poses; it is not a random low-frame-rate export. Sample pose
states from absolute time while preserving smooth reading of the important action.

When a piece pushes another, show the contact and resulting response. A joint or
attachment constrains how a part moves. Avoid applying the same spring to everything.
A steady tabletop view often gives these actions room; a cut can reveal a useful
new scale without wobbling the camera throughout the explanation.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: 12 fps stepped (each pose held 2–4 steps)
- enter / exit: 12–20 f / 10–14 f
- ease: cubic-bezier(0.35, 1.1, 0.4, 1.03) (in) / cubic-bezier(0.55, 0, 0.85, 0.3) (out)
- overshoot: ≤ 2%   squash-stretch: ≤ 15% (volume preserved)
- reading hold: ≥ 0.8 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Contact squash.** On landing, 10–15% squash with volume kept (scaleX = 1 / scaleY) for 2 steps, one step of 5% stretch, then rest.
- **Sculpted poses on 12 fps.** Every step is a new pose with a seeded ±0.5 px surface shift (the thumbprint boil); during a hold the surface does not move.
- **Fingerprints.** 3–6 shallow dents per object, lit by the fixed key light, anchored to the object.

## Sound and implementation

Optional soft contacts or material sounds support the performance when available.
Code can approximate clay using shaded shapes or procedural meshes; this is a stylized
render, not a guarantee of physically accurate material simulation. Complex expression
or photoreal sculpting may require user-provided assets or a different chosen route.

## Failure modes

- A generic sphere squash is used for every object and every event.
- Uncontrolled jitter makes intentional stop-motion look like an export defect.
- Material shifts between rigid plastic and soft clay without a reason.
- Cute acting delays or distorts the source's main point.

## Transferable prompt

> Show [idea] through [sculpted subjects] made of pliable clay. Use [material action]
> to explain [relationship]. Pose anticipation, contact and aftermath deliberately,
> with stable surface detail and a consistent stop-motion cadence. Hold [payoff].
