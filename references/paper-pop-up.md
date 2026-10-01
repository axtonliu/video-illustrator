# Paper pop-up structures

A flat surface unfolds into a spatial explanation. Hinges, folds and connected planes
make the transformation legible. Read `directing.md` for shared narrative guidance.

## When it fits

Revealing layers, nested systems, growth, a journey through a book or an unfolding
story. Especially useful when flat-to-spatial change explains the subject itself.
Less suitable for continuous fluid movement or evidence that must retain its exact
surface. Not every topic benefits from putting a book on the screen.

## Construct the scene

Plan the fold relationships before shading. A panel rotates around an attached edge;
a bridge connects two supports; a tab anchors a moving piece. Preserve thickness,
edge treatment and lighting across the structure. Let overlaps clarify its depth.

Keep the major forms distinctive and labels on readable planes. Small decorative
cutouts should not hide the connection being explained. The final open structure
must be understandable without constant motion or a tour of every corner.

## Movement and camera

Animate deployment from the actual hinge or fold. A parent fold may lift a connected
child, but a disconnected object should not magically follow. The unfolding can
expose a new relationship or convert a flat diagram into a spatial scene.

Use camera angle to make the fold action readable. A gentle side view reveals depth;
a frontal hold may be best for the concluding labels. Page turns are a possibility,
not a compulsory transition between every statement. Keep orientation across turns.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 20–30 f / 14–20 f
- ease: cubic-bezier(0.34, 1.35, 0.55, 1.05) (in) / cubic-bezier(0.65, 0, 0.35, 1) (out)
- overshoot: ≤ 7%   squash-stretch: none
- reading hold: ≥ 0.9 s   end hold: ≥ 1.6 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Hinge-driven planes.** Every plane rotates about its fold line, with its angle a function of the page angle (for example plane = 2 × page − 90°); no plane animates on its own.
- **Fold shading.** A plane's brightness follows its angle to a fixed key light, between 60% and 100%; creases get a 1 px dark line.
- **Page opening.** 20–30 frames for 180°, passing the open angle by 3–6%, then 6–8 frames to settle.

## Sound and implementation

Optional creases or page contacts can emphasize real actions if audio is made.
A projected 2.5D construction or WebGL scene can implement the look. Do not describe
visually plausible folds as physically verified paper engineering. Complex mechanisms
may need simplified geometry; preserve their explanatory relation when simplifying.

## Failure modes

- Flat cards merely rise vertically and are labeled a pop-up book.
- The hinge moves independently of the surface it supposedly attaches to.
- Intersecting panels destroy the material illusion.
- A page turn replaces every opportunity for meaningful visual continuity.

## Transferable prompt

> Explain [source idea] as a foldable structure. Begin with [flat state], then let
> [connected planes] unfold to reveal [relationship]. Keep hinges and attachments
> visible, and finish with [readable spatial arrangement]. Use the material action
> because it explains the change, not merely to decorate a sequence of captions.
