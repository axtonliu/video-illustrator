# Particles / 粒子光轨

Structures form out of points of light on a dark ground, and things travel as streams. Read
`directing.md` for the shared meaning and continuity approach. Showcase sample 4 was made in this
style before it had an atlas entry; its notes, and a 2026-10 three-shot test, are where the limits
below come from.

## When to choose it

Useful for flow, accumulation and abstraction: data gathered into a record, many inputs settling
into one structure, details falling away from a clean diagram, a signal crossing a gap. "Scatter,
then form" reads immediately.

Less useful when the point needs a recognisable object or person: they collapse into pictograms (an
engineer becomes a glowing sign figure, an app a generic wireframe). It cannot carry tension or a
"why", and it makes every abstraction look equally elegant, which can flatter a messy reality the
narration is criticising. The dark ground sits darker than talking-head footage around it.

## Construct the scene

Start from solid geometry and draw it as points sampled from its surface, so shapes keep their
construction (a gear still has teeth, a folder still has a tab). Use the three.js route: points with
a soft round sprite and additive blending on a dark ground give the glow without a bloom pass.

Colour roles: a dark ground that is not pure black (around `#060B14`, with faint layering), cold
structure light (a cyan near `#4DB8C7`) for parts and paths, a paler ice tone for the part currently
active, and one amber accent (near `#FF9A40`) only on the subject or action of the sentence. Short
labels in paper white on flat dark cards with a hairline edge all round (the accent a small dot,
never a stripe on one side). Keep subjects bright and large: a
small glow in a black frame is the most common failure.

Points are seeded and fixed to their parent object, so a part that rotates carries its points with
it. Nothing shimmers between frames unless it is moving.

## Movement grammar

Entrances gather: points travel from a seeded scatter into the shape. Exits disperse or dim. A link
is a dotted stream; only the one carrying something flows, and the carried thing is a dense amber
cluster with a short trail. Accumulation is shown by points staying where they landed. The camera
holds still or pushes in slowly to reveal; it does not drift to show the depth.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s (points flow; stepping them reads as flicker)
- enter / exit: 18–24 f / 12–16 f
- ease: cubic-bezier(0.16, 1, 0.3, 1) (in) / cubic-bezier(0.55, 0, 0.75, 0.2) (out)
- overshoot: none (points settle, they do not bounce)   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Surface-sampled points.** 2,000–3,000 points per square world unit, area weighted and seeded, sprite size 0.05–0.06 units, additive blending, no bloom pass.
- **Scatter to form.** An entrance gathers points from a seeded scatter of about ±1.5 units over 18–24 frames; nothing re-scatters for decoration.
- **Streams and packets.** A link is about 5,000 points per square unit of its tube; the carried packet is an amber cluster with a 30–40 point trail spaced along the last fifth of its path.
- **Dark ground with layers.** Background near `#060B14`, structure light at about 55% intensity so the amber accent stays the brightest thing in frame.

## Common failures

- A small glow in a huge black frame, or the whole film too dark beside the narrator.
- Every part glowing at full strength, so the accent has nowhere to stand out.
- Constant drifting particles that move for decoration.
- A person or product reduced to an unreadable cloud when the point was who or what it is.

## Transferable prompt

> Show [process] as structures that form out of points of light on a dark, layered ground: [subjects]
> gather from a scatter, links are dotted streams, and only the stream carrying [thing] flows, as an
> amber cluster with a short trail. Keep subjects large and bright, cold structure light, one amber
> accent on the sentence's subject, labels on flat dark cards. Hold the camera unless a reveal needs it.
