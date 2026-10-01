# Editorial motion

Graphic shapes and precise typography make an argument through arrangement and change.
Read `directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for comparisons, language, priorities, quantities, constraints, and product
ideas whose relationships can be expressed spatially. Particularly useful when the
source's exact words matter.

Less useful for tactile material processes, lived human scenes, or claims requiring
real footage. Do not turn unsupported quantities into authoritative-looking charts.

## Construct the scene

Choose a strong typographic hierarchy and a deliberate alignment system. Vary scale
for rhetorical emphasis; keep explanatory copy quiet enough to support the event.
Use a background, text, and accent palette with distinct jobs rather than assigning
a new color to every item. Follow a user palette when one is supplied.

Represent the central relationship geometrically: a boundary, a shared baseline,
a gap, a container, an overlap, or a changing proportion. Give shapes a role beyond
filling empty space. Let the focal word or object have room to move and settle.

Use font metrics to place and wrap text. Keep masks from clipping ascenders,
descenders, or punctuation. Design the vertical version as its own composition
when simply cropping the horizontal frame would break the relationship.

## Movement grammar

- Reflow expresses reprioritization: retain items while their positions change.
- A moving boundary expresses a changing constraint; let objects respond to it.
- Masked reveals express discovery; reveal in the direction attention should travel.
- A change in scale expresses attention or perspective, not an unexplained data change.
- Split or merge shapes only when the source contains a corresponding distinction
  or combination; carry identifiers through the transformation.

Use decisive movement followed by readable stillness. A quick correction and a slow
accumulation should feel different. Overshoot can provide character but is not a
requirement. Coordinate related movements rather than staggering every element.

A fixed camera often works best. A crop or push can isolate the decisive detail;
return to the larger relationship when the comparison needs it. A match cut may
carry an outline or word into a new context without requiring literal morphing.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 10–14 f / 6–9 f
- ease: cubic-bezier(0.2, 1, 0.3, 1.06) (in) / cubic-bezier(0.7, 0, 0.84, 0) (out)
- overshoot: ≤ 2%   squash-stretch: none
- reading hold: ≥ 0.6 s plus the line-length reading time in cinematic.md   end hold: ≥ 1.2 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Masked line reveal.** Each line slides up 100% of its own height behind a mask in 10–14 frames; lines stagger 3 frames, and a word that must land on its onset does not stagger.
- **Grid.** 12 columns with 64 px outer margins at 1280; every type block sits on an 8 px baseline.
- **Tracking snap.** A key word enters at +0.2 em tracking and closes to 0 over 12 frames.
- **Rules draw first.** 2 px hairlines cross the grid in 16–20 frames with `stroke-dashoffset` and arrive before the text they separate.

## Sound

If audio is desired, sparse clicks, ticks, and restrained tonal changes can support
alignment, collision, or discovery. Avoid adding a sound to every word. With supplied
speech, finish important word reveals before the phrase has moved to its next idea.

## Common failures

- Headlines that only slide in while the explanation remains off screen.
- Every frame becomes a new card with no inherited state.
- Decorative grids, chart lines, or counters imply evidence that was never supplied.
- Long sentences shrink to fit instead of selecting the meaningful words.
- All items use the same spring, making serious comparisons look weightless.

## Transferable prompt

> Make a short editorial animation about [source idea]. Express [key relationship]
> through the arrangement and transformation of [specific words or graphic objects].
> Begin with [legible initial state], let [meaningful event] disturb it, and end on
> [understandable result]. Preserve exact supplied labels. Use a deliberate type
> hierarchy and restrained palette, with motion timed for the viewer to follow the
> change. Choose cuts or camera movement only where they clarify that relationship.
