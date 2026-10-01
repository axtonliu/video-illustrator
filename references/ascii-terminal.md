# ASCII terminal

A character grid becomes the drawing surface, with symbols doing visible spatial work. Read `directing.md` for
the shared meaning and continuity approach.

## When to choose it

Useful for computation, routing, queues, search, transformation, filtering, and abstract systems whose
relationships can be expressed through a symbolic map. It can make an invisible process inspectable without
simulating a full application.

Less useful for delicate human acting, organic material detail, or audiences who need unfamiliar symbols
explained before they can follow the idea. A terminal look is an illustration: do not present invented
commands or logs as recorded evidence.

## Construct the scene

Choose a monospace font and measure its actual cell width and line height. Lay out the scene in a stable grid
rather than spacing proportional text until it looks right. Account for character height when drawing circles,
angles, and diagonal movement.

Define a small visual vocabulary suited to the idea: a symbol for the moving item, a line for a route, a
bracket for a boundary, or a repeated glyph for stored material. Explain ambiguous symbols through their first
use or a readable label.

Choose glyphs for their density and shape, not their supposed technical credibility. ASCII alone offers lines,
blocks, and punctuation; extended box-drawing or Unicode characters are optional and need font support. Keep
alignment stable if using them.

A DOM preformatted block, Canvas text grid, or SVG text can provide the drawing surface. Preserve spaces and
line breaks. Use separate layers for readable labels and changing character art when a single text grid would
make both hard to follow.

## Movement grammar

Animate changes to the grid as transformations with consequences: packets advance, a queue fills, a route
branches, a pattern resolves, or a boundary admits some items. Let the viewer track a particular item through
those changes.

Cell-by-cell motion makes discrete processing tangible. A cursor can reveal where an operation is happening,
but it should not type every visible sentence by default. Hold meaningful results while other activity
continues around them.

Scrolling can express history or incoming work. Keep the current process in a stable region when constant
scrolling would erase the context needed to understand it. Use an abrupt grid replacement only for a clear
change of view or stage.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s, one character cell per frame while typing; the cursor blinks 530 ms on, 530 ms off
- enter / exit: 6–10 f / 3–5 f (typing itself runs at one character per frame)
- ease: cubic-bezier(0, 0, 1, 1) (in) / cubic-bezier(0, 0, 1, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 0.8 s   end hold: ≥ 1.5 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Cell grid.** 16×32 px cells at 1280×720 (an 80×22 grid); every glyph snaps to a cell, including moving ones.
- **Typing.** One character per frame with a 4–8 frame pause after punctuation; the cursor stays solid while typing and blinks only while idle.
- **Phosphor (optional).** 1 px scanlines at 8–12% darkening and a one-frame 20% trail on changed cells; nothing flickers on text that must be read.

## Sound

Optional restrained keystrokes or electronic pulses may mark real visual operations. A silent clip does not
need fake typing sound, terminal music, or simulated narration.

## Common failures

- Tiny code fills the screen while the actual mechanism remains unexplained.
- Invented logs or benchmark counters look like verified machine output.
- Wide characters, fallback fonts, or wrapped lines break the grid.
- Every character flickers, so viewers cannot track a stable object or result.

## Transferable prompt

> Explain [source idea] using an original character-grid illustration. Represent [objects and relationships]
> with a legible symbolic vocabulary, then show [process] changing the grid over time. Keep [tracked item or
> location] identifiable and let [payoff] remain visible. Use readable labels where symbols are ambiguous; do
> not fabricate commands, logs, measurements, or evidence to create a technical mood.
