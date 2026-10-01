# Watercolor

Transparent pigment layers, reserved paper, and soft-to-hard edges shape a luminous scene.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for growth, weather, gentle transformations, memory, and relationships whose
parts overlap without losing their identities. It supports an exploratory or intimate
tone without requiring a literal painting demonstration.
Less suited to strict technical diagrams, highly reflective machinery, or tiny labels.
Soft edges should not blur distinctions the source depends on.

## Construct the scene

Build large light shapes first, then local color and selective crisp details. Leave
paper visible as part of the lighting. Use transparent overlap where forms meet;
avoid coating the entire frame with the same translucent beige texture.

Distinguish a spreading wet edge from a dried boundary. A local bloom can suggest
pigment moving through damp paper, while a later fine mark remains controlled.
Canvas masks, translucent contour layers, and cached grain can approximate these
qualities without a physical paint simulation. Keep the approximation intentional.

Let important silhouettes remain readable through the washes. Place exact text on
quiet paper or in a clean overlay. Wet pigment need not distort typography.
Anchor granulation to the painted region; movement should carry its internal texture.

## Movement and camera

Reveal form through changes in pigment coverage or translucency, then animate the
subject itself where the content needs action. A growing plant can change geometry;
a passing cloud can change light. They need not remain static paintings being wiped on.

Overlapping washes can disclose a relationship; drying can stabilize a new state.
Use those events only when they serve the meaning. Do not imply that every process
is gradual or reversible merely because soft transitions suit the medium.

A still view allows subtle edge and color changes to read. A slow move can follow a
subject through its environment, while a cut can separate memories or stages cleanly.
Keep depth restrained enough that layers still feel painted rather than plastic.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s (washes spread continuously)
- enter / exit: 30–45 f / 20–30 f
- ease: cubic-bezier(0.25, 0.1, 0.25, 1) (in) / cubic-bezier(0.42, 0, 1, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.8 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Wash spread.** A wash reveals through a noisy radial mask that grows 60–120 px per second, with a 2–3 px pigment rim about 15% darker at the moving edge.
- **Granulation.** Static, paper-anchored speckle at 8–15% density, inside washes only.
- **Wet-in-wet bloom.** A second colour dropped into a wet wash spreads 20–40 px over 18–24 frames with a soft, scalloped edge; at most once per scene.
- **Glazing.** Layers combine with multiply at 40–70% alpha; no area takes more than three glazes.

## Optional sound

Light environmental detail or a restrained musical texture may support the scene.
A paint-water sound belongs to a visible painting action, not automatically to every
movement. Supplied narration takes priority; a silent watercolor clip is also valid.

## Common failures

- A blur filter replaces distinct pigment layers and silhouettes.
- A uniform fade reveals a complete illustration without any subject action.
- Saturation changes accidentally imply a categorical or emotional judgment.
- Animated noise makes dry paper and settled pigment shimmer continuously.

## Transferable prompt

> Explain [source idea] through [subject and visible event] in stylized watercolor.
> Build luminous transparent layers with reserved paper, deliberate wet and dry edges,
> and stable pigment texture. Show [meaningful change] through subject motion as well
> as selective paint development. Keep [critical distinction] legible. Let framing
> reveal the relationship, and leave a quiet readable view of [the resulting state].
