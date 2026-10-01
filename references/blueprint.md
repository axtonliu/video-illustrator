# Blueprint / technical drawing

An explanation unfolds through construction lines, sections and fitted parts.
Use `directing.md` for meaning and continuity. This is illustrative engineering
language, not a claim that the drawing is a manufacturable specification.

## When it fits

Mechanisms, components, architecture, assembly and cause-and-effect inside objects.
A section can expose an otherwise hidden relationship; an exploded view can explain
how parts depend on each other. Less suitable for personal emotion or abstract claims
with no useful spatial analogy. Do not force software concepts into fake machinery.

## Construct the scene

Establish a stable projection and distinguish visible geometry, guides and annotations.
Give parts identifiable outlines and connectors. Use section hatching to distinguish
cut surfaces; do not scatter hatching as decoration. Dimension lines only carry real
provided measurements, or omit quantities entirely. A familiar blueprint palette is
optional: line hierarchy, projection and construction logic create the identity.

Keep labels tied to their parts through the animation. Leave room for annotations
before composing the main subject. A detailed part needs a local inspection view,
not a block of tiny labels around an overcrowded whole.

## Movement and camera

Draw a guide where it helps the next part become understandable, then construct the
part on that guide. Separate components along intelligible axes and preserve their
alignment. A connecting shaft, arrow or highlighted channel can transmit an action.

Move between overall assembly and sectional detail with a traceable spatial relation.
Rotate to reveal a previously hidden surface; hold the view during a precise claim.
Reassemble when understanding the final relationship is the payoff. Not every film
needs a full exploded view or the same draw-explode-assemble sequence.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 16–24 f / 10–14 f
- ease: cubic-bezier(0.25, 0, 0.1, 1) (in) / cubic-bezier(0.55, 0, 1, 0.45) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Construction order.** Centre lines (1 px, dash 12/4/2/4) → outlines (2 px) → dimensions (1 px, 8 px arrowheads), each layer starting 6–10 frames after the previous one.
- **Sheet grid.** 32 px major and 8 px minor lines at 12% and 5% opacity, fixed to the sheet, not to the camera.
- **Callout leaders.** A leader line grows from the part at 0° or 45° in 8–12 frames; its label types in only after the line arrives.

## Sound and implementation

Optional dry ticks can mark fitting or alignment if sound is actually produced.
Canvas/SVG can illustrate orthographic structures; code-authored 3D is optional.
Do not promise CAD accuracy, physical simulation or automatic engineering validation.

## Failure modes

- Meaningless rulers and fabricated dimensions imply scientific precision.
- Parts fly apart without revealing how they connect or work.
- Moving labels lose their association with the part being described.
- Camera rotation hides the very relationship the narration explains.

## Transferable prompt

> Explain [mechanism] as an annotated technical drawing. Construct [main parts] in
> [projection], expose [hidden relationship] through [section or separation], and
> show [action] traveling through the structure. Preserve part identity and real
> provided measurements. Finish on [meaningful assembled or sectional state].
