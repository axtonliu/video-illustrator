# Independent review

The author of a film is the worst judge of it: having built every shot, the author sees the
intention rather than the frame. Before the final render, someone who has not seen the scene
source or the conversation looks at the film's evidence against
[aesthetic-rules.md](aesthetic-rules.md). The review advises; it never blocks delivery.

## When

After the motion preview and its contact-sheet self-check (SKILL.md step 3), before the final
render. Once per film, plus one fix round; a second round only for the three rules below.

## Who

**The host has a subagent tool** (in Claude Code, the Agent / Task tool): dispatch one
reviewer with a clean context. Give it only these files, by path:

- `brief.md`
- the latest contact sheet and its data: `qa/<round>/contact.png`, `qa/<round>/contact.json`
- the keyframe stills (opening, turn, payoff, end card) and, if useful, a still at the middle of
  each scene-list row exported from the preview with `--still`
- `aesthetic-rules.md` (from this skill's `references/`)
- the brand pack, if the film uses one (the project's `inputs/brand/` or the user's default,
  `scripts/brand.mjs --which .`): its `brand.json`, its brand sheet
  (`node scripts/brand.mjs --sheet <pack> --out qa/brand-sheet.png`) and every document its
  `rules_docs` lists, for AR-16 and AR-17; see [brand.md](brand.md#in-the-review)

Do not give it the scene source, the timeline code, the conversation, or your own opinion of
the film. It judges what a viewer can see.

**No subagent tool:** review it yourself as a separate pass. Finish the preview work first,
then read only the files above, without opening the scene source during the pass, and write
`self-review (no clean context)` as the first line of `qa/review.md`, so a reader knows the
review is not independent.

## Reviewer instruction

Adapt the paths; keep the rest.

> You are reviewing a short film you did not make. Read `aesthetic-rules.md`, then look at
> `brief.md`, the contact sheet `contact.png` with its data `contact.json`, and the stills
> listed below. Do not ask for the source code. For every rule write one line in this form:
> `AR-NN ✓|✗|– · frames or time · what you see · how to fix it` (`–` when these inputs cannot
> answer the rule, for example audio; also `–` for AR-16 when no brand pack is given). Name
> frames by the index and time printed on the sheet. With a brand pack, judge AR-16 against its
> `accent_rules`, `forbid`, `fonts`, `type_scale` and its rules documents, using the brand sheet
> as the reference.
> Be specific: “#04 (8.1 s) the cover sits centred on a desk again, same as #01” is useful;
> “could be more dynamic” is not. After the rules, name the single frame a stranger would
> screenshot, and the weakest frame. Write the result to `qa/review.md`. Do not edit any other
> file.

## qa/review.md

```md
independent review (clean context)          ← or: self-review (no clean context)
inputs: brief.md, qa/preview-2/contact.png, qa/preview-2/contact.json, keyframes/*.png, inputs/brand/brand.json, qa/brand-sheet.png

AR-01 ✗ · #06 (12.5 s) · a grey wall behind the title, nothing to stop on · open the wall onto the frozen lake from #03
AR-02 ✓ · #02 / #09 · widest: figure under the arch (#09); closest: key teeth (#02) · –
AR-03 ✓ · #00 (0.5 s) · the lock snaps open in the first second · –
AR-08 – · audio · not answerable from stills · –
AR-16 ✗ · #05 (10.4 s) · the gold underline and the gold numerals share one frame; brand allows one accent per frame · drop the underline, keep the numerals
…
screenshot frame: #09 (18.5 s) figure under the arch
weakest frame: #06 (12.5 s)
```

## After the review

- Fix the ✗ lines: edit the scene, render a new motion preview, and run `contact.mjs` again
  into a new `qa/<round>/` folder.
- **The three rules that decide whether a stranger stops**: AR-01 (would a stranger stop),
  AR-02 (enough pictures, a jump in scale) and AR-06 (leave the desk). A ✗ on any of them
  must be fixed in the picture, not kept with a reason; continuity, the chosen style or the
  scene list is not an excuse. The only exception is an explicit instruction from the user
  that the fix would break; name that instruction in `brief.md`.
- **Second round, for those three only.** If AR-01, AR-02 or AR-06 was ✗, dispatch a new
  clean-context reviewer (not the first one) on the fixed preview with the same inputs, and
  ask it to judge only AR-01, AR-02, AR-06 plus a one-line check that no earlier ✓ has turned
  into ✗. Append its lines to `qa/review.md` under `## Round 2`. Fix what it still marks ✗
  once more, render a new preview, and stop: there is no third round. Without a subagent
  tool, do round 2 as a marked self-review.
- Every other rule gets one fix round only. Copy every ✗ that remains, with its rule number
  and the reason it stays, into `brief.md` under `## Review`. For the other rules, one the
  author disagrees with stays listed with the reason.
- Then render the final film. The review is advice, not a gate: a remaining ✗ is reported to
  the user, not a reason to withhold the film.
