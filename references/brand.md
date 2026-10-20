# Brand pack

A brand pack is the user's aesthetic contract first and a folder of files second: which colours,
type and motion are theirs, how the accent colour may appear, what the brand never does, and
what it learns from. The user puts it in `inputs/brand/` (or symlinks a folder there).

## The user's default pack

A project without `inputs/brand/` uses the user's default pack, in every mode and every style:
the folder named by `$VIDEO_ILLUSTRATOR_BRAND` if it is set, else
`~/.config/video-illustrator/brand/` if it exists. A project's own `inputs/brand/` replaces the
default entirely (list the same `rules_docs` in it to keep them). `node scripts/brand.mjs --which
<project>` prints which pack applies (`project`, `env`, `user` or `none`); check that pack and
say in `brief.md` which one was used. No pack anywhere: work from the style alone.

## Rules documents

`rules_docs` lists the user's own design rules (a visual system, a do-and-don't list), as
absolute, `~/` or pack-relative paths. They stay where the user keeps them and are read live
before step 1 designs anything; never copy them into the pack, the scene or the brief, so they
cannot go stale. Read every listed document in full. `forbid` stays for the short phrases a
reviewer can check frame by frame; a document holds the reasons and the boundaries.

Two shapes are valid:

- **v1:** a single `brand.json` without `"schema"`: `display_name`, optional `palette`
  (`primary`, `accent`, `ground`, `ink`), `fonts` (`display`, `body`), `logo`, `making_of`.
  It keeps working exactly as in 0.5.
- **v2:** `"schema": "video-illustrator.brand.v2"`, as a single file
  ([brand.example.json](brand.example.json)) or a folder with fonts, motifs, sound notes and an
  end card ([brand-example/](brand-example/)).

Every path in `brand.json` is relative to the folder that holds it. Every value is already
resolved (hex colours, fractions, frames); nothing is looked up at render time.

## Fields (v2)

| Field | What it holds | Notes |
|---|---|---|
| `display_name` | The only name used where an author or credit stands alone | v1 rule, unchanged |
| `making_of` | One line of small type on the end card | v1 rule; never invent production facts |
| `palette` | `ground`, `surface`, `ink`, `ink_secondary`, `primary`, `accent` as hex | `#rgb` or `#rrggbb` |
| `palette_sources` | Optional: the upstream token each colour was copied from | Provenance only; `--check --tokens` compares |
| `palette_scope` | `"credits"` (default, the v1 behaviour) or `"film"` | See precedence below |
| `accent_rules` | `max_area` (share of the frame, (0, 1]), `per_frame`, `forms` (allowed shapes), `never` (forbidden treatments) | How the accent colour may appear |
| `fonts` | `display`, `body`, `mono`: `{family, file?, license?}` | Ship a licence file next to each font file |
| `type_scale` | `hero`, `title`, `body`, `micro` as shares of the frame height | Below 0.03 is texture only (AR-15) |
| `motion` | The style-card token fields, see below | Numbers go straight into the timeline |
| `motifs` | `[{id, what, use_when, file}]`, usually SVG | Reusable visual signatures of the brand |
| `sound` | `logo` (may stay empty), `music_prompt` (a prompt template file), `sfx_dir` | `sfx_dir` follows the `inputs/sfx/` rules |
| `endcard` | An HTML end card that renders on its own | Starting point, not a locked template |
| `forbid` | Short, checkable phrases: what this brand never does | The reviewer checks frames against them |
| `references` | `[{url, learn, avoid}]` | What to take from each reference, and what not |
| `rules_docs` | Paths to the user's own rule documents | Read live, never copied; see above |

`motion` uses the same fields as a style's `## Motion tokens` ([styles.md](styles.md#motion-tokens)),
written as JSON:

```json
"motion": { "cadence": "on 1s", "enter": [14, 20], "exit": [10, 14],
  "ease": { "in": [0.3, 0.1, 0.2, 1], "out": [0.5, 0, 0.9, 0.6] },
  "overshoot": "none", "squash": "none", "reading_hold": 1.0, "end_hold": 2.0 }
```

`cadence` is `"on 1s"`, `"on 2s"`, `"on 3s"` or `"N fps stepped"`; `enter` and `exit` are whole
frames at 30 fps; `ease` curves are CSS cubic-bezier values; `overshoot` and `squash` are
`"none"` or a share; holds are seconds. They map one to one onto the `MOTION` object in
styles.md.

### Motifs and the end card read the palette from CSS custom properties

Brand SVGs and the end card carry no colour of their own. When a motif is inlined into a scene
(inline SVG, not `<img>`), set these on a parent element and the motif follows the palette:

```css
--brand-ground  --brand-surface  --brand-ink  --brand-ink-secondary  --brand-primary  --brand-accent
--brand-font-display  --brand-font-body  --brand-font-mono
```

Opened on its own a motif falls back to `currentColor`. The end card template sits in
`templates/` and fetches `../brand.json` for palette, fonts, `display_name`, `making_of`,
`type_scale` and `motion`; render it with `scripts/render.mjs --still <t>` or copy its markup
and timeline into the film. It sets `window.endcardTiming.settled` (seconds until it rests). In a film with a named style,
swap its `motion` for the style's tokens (precedence rule 4).

Build a role's font stack from the other brand fonts too (display → body → system), so a Latin
display face paired with a CJK body face still covers both scripts.

## Precedence

1. **The user's explicit instruction wins.** "Use the ink-wash colours for this one" means
   exactly that, whatever the pack says. Name the instruction in `brief.md`.
2. **`forbid` and the `rules_docs` beat the style.** When the style card asks for a technique the
   brand forbids (a halo, a gradient, a glow, a coloured stripe on one side of a card), the brand
   wins and the brief says so. The documents govern what they speak to: what never appears, and
   how the film's own type, cards, labels and accent look; the world's colour follows
   `palette_scope` (rule 3) unless a document sets it for that medium.
3. **`palette_scope: "film"` with a named style: the brand decides colour; the style decides
   material, motion and craft.** Ground, ink and accent come from the palette; the style's
   textures, construction, motion tokens and signature craft stay. Write this split into the
   brief. With `"credits"` (or v1), the palette covers only the film's own typography, credits
   and end card, and the style governs the world, as in [styles.md](styles.md#color-follows-the-style--配色跟随风格).
4. **`motion`:** when the user names a style, its motion tokens govern the whole film, end card
   included (one set of tokens per film). The brand's `motion` is the film's motion when no style
   is named and the brand's own look is the treatment.
5. **`fonts` and `type_scale`** apply to the film's own typography in both scopes.
6. **`accent_rules`** apply to the whole film with `"film"` and to the brand's own elements
   (credits, end card, lower thirds) with `"credits"`.

Record the result in `brief.md` under `## Brand`: the pack used, its scope, and every conflict
above with how it was resolved.

## Contradictions the check refuses or reports

- `palette_scope: "film"` without `ground`, `ink` or `accent`: **error**, the film cannot be
  coloured from the pack.
- `accent_rules.max_area` outside (0, 1], a missing file (a `rules_docs` entry included), an
  invalid hex, an unknown `schema`, JSON that does not parse: **error**.
- `rules_docs` that is not a list: warning. A rules document outside the pack is expected: no
  warning.
- A v2 field in a file without `"schema"`: warning; the file is read as v1 and the field ignored.
- An unknown `palette_scope`: warning, read as `"credits"`.
- The same phrase in `accent_rules.forms` and `accent_rules.never`: warning.
- A motif SVG using a gradient or filter that `accent_rules.never` forbids: warning.

## Check and brand sheet

```bash
node scripts/brand.mjs --check inputs/brand [--tokens upstream-tokens.json]
node scripts/brand.mjs --sheet inputs/brand --out qa/brand-sheet.png
```

`--check` prints `{ok, schema, errors, warnings, rules_docs}` (the documents to read) and exits 1
only on an error. Errors are kept
for input that cannot be used safely (the list above). Everything else is a warning: unknown
fields, shapes authors will ignore, contrast under 4.5:1 for ink (3:1 for secondary ink and the
accent), a font file with no licence file beside it, motion numbers that disagree with each
other, and `palette_sources` that do not match the upstream token file passed with `--tokens`
(a JSON whose entries are hex strings or objects with `value`, `$value` or per-mode keys; a
source is `"name"` or `"name(mode)"`).

`--sheet` refuses a pack with errors, then renders one PNG: two 16:9 frames (a title frame
built from palette, fonts and type scale, and the pack's end card at rest), the palette with
contrast and sources, the type scale at real size for a 1080p frame, every motif on the ground,
the accent forms next to every `never` treatment and the area and count limits, the motion
curves and numbers, and the forbid list. Use it to judge the pack before any film is made; the
user approves the pack from this sheet.

## In the review

Whether a film keeps the accent rules or the forbid list is a judgement about pictures, so the
check never decides it. When a pack is used, give the clean-context reviewer `brand.json`, the
brand sheet and every `rules_docs` document as extra inputs ([review.md](review.md)); it answers AR-16 in
[aesthetic-rules.md](aesthetic-rules.md). Like every rule there, AR-16 advises and never blocks
delivery.
