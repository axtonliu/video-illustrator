# Research and footage

Two steps before any picture for an explainer about something real: a fact table that every number comes from, and real footage whose rights are recorded before it is used.

## Fact table

Read first-hand sources (the party's own announcement, paper, documentation, event recording); use secondary reports only to find leads. Write `facts.json`:

```json
{
  "sources": [{ "id": "s-event", "title": "Roadster event", "publisher": "Tesla", "date": "2026-10-15", "url": "https://…", "kind": "primary" }],
  "facts": [
    { "id": "f-thrust", "text": "Thrust above 80 kN", "value": 80, "unit": "kN", "kind": "claim", "by": "Tesla", "source": "s-event", "quote": "…" },
    { "id": "f-flow", "text": "About 145 kg of air per second", "value": 145, "unit": "kg/s", "kind": "estimate", "inputs": ["f-thrust", "f-exhaust"], "formula": "80,000 N ÷ 550 m/s" },
    { "id": "f-hover", "text": "Hover time not published", "kind": "unknown" }
  ]
}
```

`kind` is how far the number can be trusted, and the picture says it too: `claim` (a party about itself: label it as their claim), `measured`, `reported`, `estimate` (our rough math: label it as rough math and show the arithmetic), `unknown` (not published: say so instead of inventing one). Write `simplified` when the script rounds or simplifies.

In the script, cite each number where it is used: `That is {f:f-flow} every second.` Then:

```bash
node scripts/facts.mjs --check facts.json --script script.md   # errors stop the run
node scripts/facts.mjs --js facts.json --out scene/facts.js     # scenes read window.FACTS, never retype a number
node scripts/facts.mjs --md facts.json --out facts.md           # for review
node scripts/facts.mjs --sources facts.json --out sources.md    # for the end card and publish notes
```

## Footage

Real footage proves something happened; the animation explains why. Prefer, in order: the user's own material, the party's official release, sources that state an open licence (Wikimedia Commons, Internet Archive items with a licence). Check that an "official" channel really is the party's (`channel_id`, `channel_verified`) before calling it official. News outlets and other people's commentary or re-upload channels are not footage sources: leave them unapproved.

```bash
node scripts/footage.mjs search --query "Falcon 9 landing" --candidates footage/candidates.json
node scripts/footage.mjs review --candidates footage/candidates.json --out footage/candidates.html
```

`search` only lists candidates with their stated licence; it downloads nothing. Every YouTube result is `unknown`: copyright stays with the uploader. Show the user the review page (or a still of it rendered with `scripts/render.mjs --still 0`) and let them set `"approved": true` for footage they may use. Never approve on their behalf. Then:

```bash
node scripts/footage.mjs fetch --candidates footage/candidates.json --out footage/ [--include-open]
node scripts/footage.mjs clip --input footage/<file> --from 12 --to 19.5 --label "Footage: <source>" --out clips/<name>.mp4
```

`--include-open` does not auto-select NC (noncommercial) or ND (no derivatives) material:
these are `restricted` and need an explicit `"approved": true` after checking the intended use.
ND allows sharing under its terms but does not permit distributing adaptations; downloading
alone is not an adaptation. See the [CC BY-ND terms](https://creativecommons.org/licenses/by-nd/4.0/).
`open` is a selection category, not a waiver of attribution, ShareAlike or other licence terms.
Older candidates labelled `open` are rechecked for NC/ND before automatic selection.

`fetch` records file, SHA-256, licence and attribution in `footage/footage.json`; list them in the delivery and the publish notes. `clip` keeps archive 4:3 letterboxed instead of cropping, burns the source label in the top-right corner in the film's language, and keeps the original sound at -17 LUFS (`--audio mute` drops it). Do not cut footage so that it changes what happened (a demo presented as a test, a plan as a result).
