# Halftone comic

An illustrated page becomes a moving sequence of panels, ink marks, and printed tones. Read `directing.md` for
the shared meaning and continuity approach.

## When to choose it

Useful for a discovery, disagreement, cause and consequence, a surprising reversal, or a small story whose
important moments deserve distinct visual emphasis. A panel boundary can separate competing viewpoints or
events occurring in parallel.

Less useful for dense quantitative comparisons or an uninterrupted technical process whose continuity would be
lost in frequent panel changes. Comic exaggeration should express the source's tone without turning an
uncertain claim into a dramatic fact.

## Construct the scene

Develop original silhouettes with clear ink contours and intentional black masses. Use panel size, gutters,
and the direction of a pose to guide the reading order. Give a decisive event more room when appropriate;
equally sized panels are optional.

Build tone with halftone dots, crosshatching, or flat ink rather than photographic shading. Anchor texture to
its printed surface so dots do not crawl during motion. Set dot spacing for the final output size: very fine
patterns can shimmer or produce moiré after encoding. Prefer coherent tone patches over a global noisy
overlay.

SVG paths or Canvas shapes work well for panels and figures. Clip artwork to panel boundaries deliberately. A
character crossing a gutter should mean something rather than expose an accidental overflow. Keep lettering
independent of halftone masks.

## Movement grammar

Compose strong readable poses, then choose which changes need in-between motion. A held reaction can carry
more expression than a continuously floating character. Anticipation directs attention before an impact; the
changed scene carries its result.

Animate the page as well as its contents: expand a panel to reveal context, let a shared object connect
adjacent views, or replace a close-up with the consequence. Preserve reading order when panels open, close, or
overlap.

Use speed lines, an impact shape, or a brief exaggerated perspective to emphasize a specific event. Avoid
constant shaking and flashing that make every beat feel urgent. A cut between poses is valid when the missing
motion is easy to infer.

## Sound

Optional dry impacts, page turns, or short accents can support panel transitions. Onomatopoeia is a visual
choice, not proof that an audio effect exists in the export.

## Common failures

- A dot filter covers ordinary slides but panels and poses do no narrative work.
- Several balloons appear together without a clear speaker or reading order.
- Print texture flickers, hides faces, or becomes larger than important lettering.
- Impact effects obscure the cause or exaggerate the source beyond its meaning.

## Transferable prompt

> Explain [source idea] as an original moving comic centered on [subject]. Use panels to distinguish
> [viewpoints or moments], and make [decisive event] change the next visible state. Draw expressive ink
> silhouettes and stable printed tones. Let pose, panel scale, and reading order carry the story; use
> lettering for [necessary words]. Finish on [payoff] with enough stillness to read its consequence.
