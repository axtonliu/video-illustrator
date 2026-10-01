# Compose a video illustration

Choose what the animation explains before choosing how it looks. This is a creative
worksheet for the agent, not another configuration system the user must learn.

## Read the supplied content

Keep the source passage beside the working brief. Identify its central claim,
important nouns, causal relationships and qualifications that change the meaning.
An opinion may be illustrated as an opinion; animation must not make it look like
measured evidence. Preserve the user's wording where a distinction depends on it.

For an article, look for places where time adds understanding: a change, mechanism,
comparison, evolution, accumulation or interaction. A beautiful picture alone does
not justify a video. Select a passage with enough context to stand on its own. If
making several clips, record each source heading or exact excerpt and its intended
placement. Do not invent a clip for every heading just to make the set uniform.

Choose the task the user actually asked for:
- **Illustrative insert:** one point understood visually, often silent, leaving room
  for surrounding narration or article text.
- **Self-contained short:** an opening situation, meaningful development and payoff;
  enough labels or requested narration to make sense outside the original article.
- **Article set:** selected complementary clips with consistent visual language,
  each mapped back to the passage it helps explain.

These are output situations, not extra named modes or required CLI flags.

## Keep independent choices independent

| Choice | Decide from | Examples |
|---|---|---|
| Meaning | The source's relationship | Cause, comparison, process, uncertainty |
| Visible structure | What changes over time | Build, transform, trace, accumulate, reveal |
| Art direction | Tone, subject, reference | Whiteboard, editorial motion, isometric, cut paper, custom |
| Movement | Object construction and intended emphasis | Draw, slide, rotate, fold, snap, flow, hold |
| Framing and rhythm | Viewing size and reading needs | Local inspection, wider relation, a cut, a pause |
| Sound | User request and available input | Silent, supplied narration, authorized voice or music |

For example, a feedback loop can use a drawn relation, a spatial path, or a tactile
chain of linked objects. Preserve the loop's actual causal relationships across
these treatments. Do not translate every concept into a conveyor or every contrast
into two labeled cards.

Useful structures, chosen for fit rather than quota:
- **Build and reveal:** add a relationship, then show what it changes in the whole.
- **Trace:** follow the same object through steps; retain relevant state changes.
- **Transform:** show an object changing form or role without losing its identity.
- **Compare:** align comparable conditions; make the difference visible rather than
  changing both layout and subject at once.
- **Accumulate or disperse:** let a repeated event create an observable consequence.
- **Inspect and reconnect:** focus on a detail, then return it to the larger context.

## Style combinations

Select a primary art direction and adapt compatible dimensions. Whiteboard drawing
can use an editorial type hierarchy; an isometric process can use paper materials.
Explain how the pieces belong together through shared light, projection, scale,
color roles and motion behavior. Do not load and obey every style reference at once.
When rules conflict, resolve the visual choice deliberately in the brief. A custom
reference can override these defaults; extract its transferable properties instead
of claiming to recreate its creator's exact work.

Use the user's `inputs/brand/brand.json` when supplied, for the film's own typography,
credits and end card (the whole film when a v2 pack sets `palette_scope: "film"`, see
[brand.md](brand.md)); the public skill does not impose a personal brand palette.
Otherwise the chosen style governs color: echo a real asset's colors as an accent if
useful, but do not let the asset's dominant colors take over every style. Choose a
light, legible ground as an ordinary starting point unless the style, subject or
reference calls for another treatment.

## Production-detail type

Small type can add a layer of craft to the frame: a scene number in a corner, a section mark,
the measured tempo of the music (`♩ = 104`, from `beats.json`), the book's title and year, a
take number that is the organizing device. Use it as a typographic detail at 1.5–2.5% of the
frame height, in the film's own typography, aligned to the grid, never competing with the
subject.

It may only carry information that is **true of this film**: the actual scene number, the
measured BPM, the title and year printed on the supplied asset, a date the source states.
Never invent production facts or statistics to decorate the frame (fake take counts, render
times, file sizes, coordinates, percentages). A `making_of` line appears only when
`brand.json` supplies it, on the end card, exactly as written (see SKILL.md, brand fields).

## A usable authoring brief

Save a compact brief with: source/placement; audience and takeaway; source facts to
preserve; visual subject and its changes; style and movement; size/duration/audio;
and required deliverables. Its sequence should describe events, not lists of nouns.

Weak: "Show cache, request, database. Add smooth transitions."
Useful: "Keep one request token recognizable as it reaches the calculation, deposits
a result in storage, then follows the shorter retrieval route on repetition. When
source data changes, visibly mark the old stored result as stale before replacing it."

This describes one source-specific example, not a required layout for all topics.

## Revisions

Find the smallest change that answers the user's feedback. A wording correction may
only need a label change; a different metaphor may need a new scene. Preserve source
facts, unaffected assets and explicitly accepted choices. Save a new version when
replacing a meaningful artifact. If duration or narration changes, update the shared
timeline and recheck the affected transitions. Never call an old MP4 the new revision.
