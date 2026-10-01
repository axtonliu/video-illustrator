# Ink wash

Pressure-shaped marks and open space carry the subject; washes suggest atmosphere.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for flowing systems, natural processes, restraint, emergence, and contrasts
between a concentrated action and its wider consequence. Negative space can give
an unresolved idea room to remain unresolved.
Less suited to dense dashboards, exact spatial measurements, or fine product detail.
Ink styling does not require historical or cultural motifs unrelated to the subject.

## Construct the scene

Build a recognizable silhouette from directional strokes rather than outlining every
edge. Vary stroke width with an authored pressure curve; taper ends where the gesture
lifts. Use dry broken marks for structure and dilute overlapping shapes for distance.
Reserve unpainted areas intentionally: they can represent light, water, air, or silence.

Canvas paths, clipped grain, and translucent masks can suggest ink on absorbent paper.
Use seeded irregularity anchored to each stroke. A few coherent edge variations often
read better than expensive fluid simulation. Describe this as stylized ink behavior.
Keep important labels sharp and separate from the spreading wash.

## Movement and camera

Let a stroke establish a route, force, or silhouette. Reveal it along its gesture,
then let a localized wash spread or soften where that event affects its surroundings.
A brush appearing on screen is optional; the changing mark can express the action.

Keep atmospheric movement distinct from the subject's movement. Mist can drift while
a branch bends around a fixed attachment. Do not dissolve every object into ink just
because a dissolve is easy to implement. Preserve whatever identity the explanation
needs, even when its contour becomes less explicit.

Use a quiet frame when a gesture changes the scene. A lateral camera move can reveal
how an action extends through a landscape; a closer view can expose pressure or flow.
Cuts and changes of scale are useful when empty-space travel delays understanding.
Let the final arrangement remain visible beyond the last stroke.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s (ink spreads continuously; a living subject acts on 2s)
- enter / exit: 24–40 f / 18–30 f
- ease: cubic-bezier(0.22, 0.61, 0.36, 1) (in) / cubic-bezier(0.33, 0, 0.67, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.2 s   end hold: ≥ 2.0 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Pressure-shaped stroke.** Width along the stroke = base × (0.35 + 0.65 × sin(π·u)^0.7), u from 0 to 1; base 14–28 px for trunks and ridges, 3–6 px for twigs and grass.
- **Dry brush.** Where the pressure term falls below 0.3, break the stroke with seeded gaps covering 20–35% of that stretch; the seed belongs to the stroke and never changes.
- **Bleed after contact.** After a stroke lands, its edge blur grows from 0 to 3–6 px over 12–20 frames, then freezes; the paper never keeps crawling.
- **Value ladder.** Four ink values (about 100%, 60%, 30%, 12%) on warm paper, and at least 40% of the frame left unpainted.

## Optional sound

A sparse breath, liquid movement, or brush contact may accompany a real event.
Use only audio actually available or produced. Silence can support this treatment;
do not assume a cultural instrument is appropriate solely because the image uses ink.

## Common failures

- A generic black splash hides a scene change without carrying any meaning.
- Uniform opacity and width make every stroke look like a marker diagram.
- Noise regenerates per frame, making the paper crawl beneath a still subject.
- Decorative calligraphy invents or distorts meaningful source text.

## Transferable prompt

> Render [source idea] as a stylized ink-wash animation centered on [subject]. Use
> pressure-shaped strokes to establish [structure] and localized washes to reveal
> [change or consequence]. Let open space clarify [relationship]. Preserve subject
> identity and exact labels. Choose camera movement for discovery, with stable paper
> texture and deliberate contrast between decisive gestures and quieter atmosphere.
