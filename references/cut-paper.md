# Cut paper

Layered shapes behave like lightweight physical pieces in a deliberately made world.
Read `directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for everyday metaphors, natural cycles, accumulation, separation, assembly,
and warm narrative explanations. Material changes can give a simple idea character.

Less useful for precise technical interfaces, dense data, or subtle facial acting.
When the subject depends on exact language, keep that language visible and readable
instead of replacing it with a whimsical but ambiguous scene.

## Construct the scene

Design distinctive silhouettes before adding texture. Give each object an intelligible
construction: folds, attached pieces, hinges, overlaps, or layers. A leaf, envelope,
and ladder should have different geometry and respond differently to movement.

Use stable paper grain or restrained procedural texture. Anchor texture to the object
so it travels with the material. Small contour imperfections can suggest cutting;
avoid changing those imperfections on every frame.

Choose a coherent family of materials and a consistent light direction. Contact
shadows anchor pieces to the surface. A lifted edge can cast a wider, softer shadow,
while an attached hinge stays in contact. Depth should be visible in overlaps and
shadow changes, not just a stack of arbitrary CSS drop shadows.

Keep text on flat, readable patches of space. Paper labels are an option, not an
excuse to put the whole explanation on a succession of cards.

## Movement grammar

Move pieces according to their construction: a flap pivots at its fold, a loose cutout
slides or tumbles, a linked part pulls its neighbor. Let contact or tension initiate
the next action. Different mass and stiffness can produce different settling motion.

Choose smooth puppetry or a deliberate stop-motion cadence and maintain it. If using
stop motion, sample pose timing consistently rather than adding random jitter to
all properties. Texture and lighting should not strobe between poses.

Transform through a visible material action when useful: fold, unfold, peel, layer,
join, separate, or turn over. Not every change needs an elaborate craft mechanism;
a cut may move the story forward more clearly.

A tabletop camera makes material relationships easy to read. A modest parallax move
can reveal layers. Avoid continuous floating zooms that make attached objects appear
weightless. Preserve a subject's identifying shape through framing changes.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s, or 12 fps stepped for a stop-motion feel
- enter / exit: 10–14 f / 8–10 f
- ease: cubic-bezier(0.3, 1.15, 0.45, 1.06) (in) / cubic-bezier(0.6, 0, 0.9, 0.5) (out)
- overshoot: ≤ 4%   squash-stretch: ≤ 4% (paper bends at its folds rather than stretching)
- reading hold: ≥ 0.8 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Cut or torn edge.** Contour jitter of 1.5–3 px at 1280, seeded per piece and fixed for the piece's life; a torn edge adds a 2–4 px lighter fibre rim.
- **Grain anchored to the piece.** Fibre grain 2–4 px in scale at 4–8% contrast, with texture coordinates in the piece's own space so it moves and rotates with the piece, never fixed to the screen.
- **Lift shadow.** At rest: 2 px offset, 3 px blur, 30% opacity. Lifted: up to 8 px offset, 12 px blur, 20% opacity, changing with the lift.
- **Stop-motion option.** Poses held on 12 fps steps, each new pose with a seeded ±0.5° rotation; nothing changes between steps.

## Sound

Optional dry taps, folds, or rustles can support contact and material behavior. Use
actual available or created audio when implementing them. Do not require a sound
library or downloaded music for a short silent illustration to be useful.

## Common failures

- Rounded cards with grain are called paper craft but no object has a construction.
- Every piece bounces identically, regardless of how it is attached or what it weighs.
- Shadows jump or remain fixed while a piece visibly lifts.
- Decorative fibers and rough edges obscure the meaning-bearing silhouette.
- An appealing metaphor changes the source's causal relationship.

## Transferable prompt

> Illustrate [source idea] using a layered paper world centered on [specific subject].
> Express [relationship or change] through [material action], with visible folds,
> attachments, overlap, and contact that explain how the pieces move. Keep textures
> stable and silhouettes readable. Use [smooth puppetry or stop-motion cadence] where
> it supports the tone. End with [meaningful final state], allowing the result to
> read. Use cuts when helpful and add sound only when audio is actually produced.
