# Woodcut-inspired relief print

Carved negative marks and printed solid masses produce a forceful, graphic world.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for nature, machinery, collective effort, conflict, and transformations that
benefit from strong silhouettes and visible direction of force.
Less suited to delicate translucent surfaces, dense interface detail, or nuanced
photographic identity. Choose motifs from the source instead of adding unrelated
historical symbols merely to signal a print tradition.

## Construct the scene

Begin with solid printed masses and carve light out of them. Use cuts to describe
volume, direction, and tension: curved gouges can follow a trunk, while compressed
marks can emphasize a contact zone. Keep the negative spaces structurally coherent.

Canvas masks or SVG boolean-like layering can suggest relief carving. Cache an
object's hatch and edge patterns so they remain attached as it moves. Use a restrained
ink/paper relationship; additional colors can be separate print regions with purpose.
This is a stylized print construction, not a simulation of a real carving tool.

Preserve large recognizable silhouettes before adding small cuts. Place important
text in quiet regions with deliberate letterforms. Rough edges should not confuse
source labels or make an intended opening look like an accidental tear.

## Movement and camera

Use decisive articulated motion, directional force, and readable contact. A limb can
pivot, a gear can engage, and a current can bend around a solid form. Animate the
subject's structure while keeping its carved surface attached to that structure.

Negative space can reveal a change: open a channel, expose a passage, or remove a
barrier where the source supports that action. Do not turn every transition into a
full-screen scratch reveal; carving is one available event, not the whole narrative.

A fixed or lateral framing often preserves graphic force. A close cut can reveal an
interaction, followed by a wider scene showing its effect. Use changes of depth
sparingly when the flattened composition is doing the explanatory work.
A deliberate pose cadence can add impact, but random frame jitter weakens the print.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: 12 fps stepped
- enter / exit: 12–18 f / 8–12 f
- ease: cubic-bezier(0.7, 0, 0.3, 1) (in) / cubic-bezier(0.8, 0, 1, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 0.9 s   end hold: ≥ 1.6 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Gouge marks.** Negative wedges 3–8 px wide tapering to a point, following the form; cached per object so they travel with it.
- **Two values only.** Ink and paper; tone comes from how much is carved away (0–60% of an area), never from gradients.
- **Pressed ink edge.** 1–2 px of seeded roughness on every ink edge and 5–10% missing-ink speckle, anchored to the object.
- **Carving reveal.** Marks appear in carving order, 3–6 marks per 12 fps step.

## Optional sound

Available or produced impacts, mechanical contacts, or restrained environmental sound
can reinforce visible events. Use scraping only for an actual carving action.
A silent scene can remain forceful through timing and shape alone.

## Common failures

- Generic dark outlines replace the interplay of printed mass and carved space.
- Fine hatching overwhelms the silhouette or shimmers as the subject moves.
- Unrelated ornamental motifs substitute for the actual content.
- Smooth glossy lighting contradicts the intended flat ink construction.

## Transferable prompt

> Show [source idea] as a woodcut-inspired animated relief print. Build [subjects]
> from bold ink masses and carved negative marks that follow their structure. Let
> [force or action] visibly produce [consequence], preserving [important distinction].
> Keep hatch patterns attached to moving forms. Use decisive staging, clear contact,
> and purposeful changes of framing, resolving into [readable final state].
