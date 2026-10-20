# Aesthetic rules

Judgments that were learned the hard way: each rule comes from a real review of a film made
with this skill, quoted in the reviewer's own words, or is marked **external benchmark** when
it comes from studying strong work elsewhere. Rules are numbered and only appended; a retired
rule keeps its number and says why.

Each rule has four parts: **Rule**, **Case** (what was said, when, and about what),
**Check** (a question answerable from the review inputs) and **Fix**. **Seen in** says which
input can answer the check: `sheet` (contact sheet and contact.json), `stills` (keyframes),
`brief` (brief.md) or `audio` (only the author, listening or measuring, can answer it).

Used by the author while planning and by the independent reviewer in [review.md](review.md).
The reviewer writes one line per rule: `AR-03 ✗ #00–#01 (0.0–2.0 s) · finding · fix`, `✓`
when it holds, `–` when its inputs cannot answer it.

Quotes are from Axton's reviews of the 0.1–0.4 samples and the launch montage, with the
Toronto date and the worklog that records them (`2026-09-27-2215-video-illustrator-compact`,
`2026-09-28-1436-v04-and-open-source-launch`).

---

## AR-01 Would a stranger stop here?

- **Rule.** The bar is whether a stranger scrolling past would stop, not whether the film
  meets the checklist. Every technical check passing is not evidence of that.
- **Case.** 2026-09-27, the first five explainer samples: “没有一条有震撼人的感觉，不够抓人，
  没有酷炫和大片感的”. 2026-09-28, the homepage samples after 0.3: “我感觉我们出的视频很好，
  但是还是谈不上惊艳”. Both sets had passed every technical check.
- **Check.** For each frame of the sheet: would a stranger stop on it? Which single frame
  would someone screenshot and send to a friend? Name it by index and time. Is any frame one
  that could appear in any other video?
- **Fix.** Replace the weakest one or two pictures with a new world, a jump in scale or an
  action, not a tweak of the same picture. Make the screenshot frame the biggest, brightest,
  most specific picture of the film.
- **Seen in.** sheet, stills.

## AR-02 Enough pictures, and a jump in scale

- **Rule.** A promo needs many different pictures and a visible change of scale: at least 8
  distinct pictures per 20 seconds, at least one extreme wide in which something is tiny
  against something vast, and at least one macro.
- **Case.** 2026-09-28, the first 0.4 cinematic run: “电影感这个确实弱一点，不知道为什么总是
  弱一些，可能还是分镜少了还是怎么着，场面不够宏大。” The rerun, with eight worlds and a
  real scale ladder, was accepted: “这版可以”.
- **Check.** `distinct_scenes` against the scene list; name the widest and the closest frame.
  Is the subject at least ten times larger in one than in the other?
- **Fix.** Add worlds, not angles on the same world; build the ladder in
  [cinematic.md](cinematic.md#scale-leave-the-desk).
- **Seen in.** sheet, brief.

## AR-03 The opening does not let anyone fall asleep

- **Rule.** The first two seconds hold the most specific moving picture of the film and a
  sound. No slow fade from black, no logo sting, no establishing drift.
- **Case.** 2026-09-28, the launch montage: “V3的缺点就是刚开头让人睡着了，完全没有那种
  感觉。” The next version opened on its strongest picture and was used.
- **Check.** At 0.0, 1.0 and 2.0 s: is something specific to this subject moving? Does the
  first frame belong only to this film (the first-frame test in [concept.md](concept.md))?
- **Fix.** Move the strongest picture and the first hit to the first downbeat; cut whatever
  comes before it.
- **Seen in.** sheet, stills (motion in the first second: author).

## AR-04 The ending is the biggest moment

- **Rule.** The end card is the largest or brightest picture of the film; the music rises
  into it (the one planned rise in the mix) and a low hit lands on it; it holds at least the
  style's end hold.
- **Case.** 2026-09-28, the launch montage: “片尾的音乐不如 V3 的版本那么宏大。” The fix raised
  the end music by about 17 dB and added a low hit on the end card; that version was used
  (“用加强版，换上吧”).
- **Check.** Is the last picture the biggest or brightest of the sheet? `end_hold_s` in
  contact.json at least 1 s? (Author: is the last 4 s louder than the spoken part?)
- **Fix.** Bring the end card closer or brighter, raise the music bed after the last word,
  place an impact on the end card, lengthen the hold.
- **Seen in.** sheet, stills; loudness: audio.

## AR-05 The real asset is the hero, not the wallpaper

- **Rule.** The user's cover, screenshot or logo appears at the reveals and the end, each
  time as an event, on screen for no more than about a third of the film. In between, the film
  travels through worlds built from what the asset implies.
- **Case.** No direct quote. After “谈不上惊艳” (AR-01) the 2026-09-28 worklog diagnosed that
  the book cover sat in almost every shot of the first samples. The positioning it serves is
  Axton's, 2026-09-27: “我认为目前我们最有优势的就是我们把我们自己的素材然后非常有机地融合
  到了这些视频里面去。” Organic, not constant.
- **Check.** `assets[].fraction` in contact.json (a lower bound); for every frame showing the
  asset: what is it doing? “Sitting there” is ✗.
- **Fix.** Remove idle appearances; turn one appearance into an action by the asset itself
  (see [a subject that acts](directing.md#a-subject-that-acts)); build a world out of an
  element of the asset.
- **Seen in.** sheet.

## AR-06 Leave the desk

- **Rule.** A starter scene's table is a lighting setup, not the set of the film. At least
  three worlds beyond it.
- **Case.** The same review as AR-02, “场面不够宏大”. The worklog found why: the 3D starter
  was a book on a desk, and three cinematic runs had never left it.
- **Check.** How many sampled frames show a tabletop? More than a third is ✗.
- **Fix.** [cinematic.md](cinematic.md#scale-leave-the-desk).
- **Seen in.** sheet.

## AR-07 A cinematic look needs real depth and moving light

- **Rule.** When the look itself is cinematic, flat layers sliding over each other read as a
  cartoon. Depth must be real (the 3D route), light must move on the hero at least once, and
  fast moves carry motion blur.
- **Case.** 2026-09-27, the dark 2D cinematic version: “画面平：对，看不出电影质感，像是简单的
  二维动画片”. The 3D rerun went on the homepage (“可以上首页”).
- **Check.** Do camera moves show parallax between at least three depth layers? Does the key
  light change on the hero anywhere in the stills?
- **Fix.** Switch to the 3D route; add a rack focus, a light sweep or a rim coming up at the
  turn.
- **Seen in.** stills, sheet.

## AR-08 The music bed does not pump

- **Rule.** One static music level under the whole spoken part; no ducking, no dynamic
  loudness normalization. The only planned rise comes after the last spoken word.
- **Case.** 2026-09-27: “音乐的音量在视频中除了最后提高之外，其他时间都应该一致，现在是人声
  一停，音乐声就调高音量了，但是声音听着很难受”.
- **Check.** (Author.) The level change in a speech pause equals the static gain, as in
  [rendering.md](rendering.md#audio-first-workflow).
- **Fix.** The mix rules in rendering.md.
- **Seen in.** audio.

## AR-09 Music enters and ends like music

- **Rule.** Do not jump from a quiet opening straight into the loudest passage, and never cut a
  track off: end on a bar line after a resolving phrase with a fade of at least 2–3 s, or
  lengthen the end card so the track's own ending fits.
- **Case.** 2026-09-27, an edited music bed: “从开头到进入高潮吓人一跳。。。最后的结尾感觉就像
  好几秒没有声音一样”; later the same night: “B 感觉最后没有结束被切掉了”.
- **Check.** (Author.) Listen to the first two seconds and the last five.
- **Fix.** Request a longer track, start on a phrase, fade on a bar.
- **Seen in.** audio.

## AR-10 One name, the display name

- **Rule.** Where an author or credit appears on its own, use `brand.json` `display_name` only.
  Do not push the camera onto another name printed on an asset; frame its title and artwork.
- **Case.** 2026-09-27, an early cinematic sample that pushed in on the name printed on the
  cover: “这个我觉得不要突出我的真名吧。”
- **Check.** Does any frame make a name other than the display name its focal point?
- **Fix.** Reframe on the asset's title or artwork, or show the asset whole.
- **Seen in.** stills, sheet.

## AR-11 A promo does not default to a quiet explainer style

- **Rule.** When the job is a promo and the user named no style, do not default to a quiet
  explainer style such as whiteboard or pencil sketch. If the user chose one, keep it and
  give it the cinematic treatment where the film needs energy.
- **Case.** 2026-09-28, choosing the style for a recorded demo run: “沿用编辑部科技风，白板手绘
  不吸引人”. The editorial style had just been called “已经很好了，可以直接用的”. This is one
  choice between styles, not a verdict on whiteboard as a medium; the rule covers only the
  default pick for a promo.
- **Check.** Is the chosen style in the brief justified by the content, and does the film have
  the energy of AR-01 and AR-03 anyway?
- **Fix.** Change style, or layer [cinematic.md](cinematic.md) on it.
- **Seen in.** brief, sheet.

## AR-12 Something acts in every stretch of the film

- **Rule.** Each stretch has a subject that performs an action with anticipation, action,
  follow-through and a settle; not only elements that slide in and stop.
- **Case.** External benchmark: in strong promos each shot has one clear performer. Ours
  showed the opposite once: the first 0.4 cinematic run spent about ten seconds on book pages
  (worklog 2026-09-28-1436, before AR-02's rerun).
- **Check.** Does the scene list mark at least one `[act: …]`? In each sheet frame, can you
  name what is acting?
- **Fix.** [A subject that acts](directing.md#a-subject-that-acts).
- **Seen in.** brief, sheet.

## AR-13 Nothing enters and freezes; the last picture settles

- **Rule.** After an entrance something keeps acting until the next beat, and nothing is
  completely still for more than three seconds except a reading hold. The last picture comes
  to rest and holds for at least a second before the film ends.
- **Case.** External benchmark: “enters, then stops” and “lands, then cuts away” read as
  unfinished even when every frame is good.
- **Check.** contact.json `motion.longest_still_s` ≤ 3 and `motion.end_hold_s` ≥ 1.0; which
  stretch is the still one?
- **Fix.** Give the held stretch a continuing action that belongs to the story, or cut
  earlier; lengthen the end hold. Do not add a float or a breathing scale just to move the
  number.
- **Seen in.** sheet.

## AR-14 Loud effects are rationed

- **Rule.** Full-frame impacts, light effects and hero devices stay within the
  [restraint budget](directing.md#restraint-budget); no generic trailer effects.
- **Case.** External benchmark. Ours: the first cinematic attempt leaned on drifting gold
  particles (worklog 2026-09-27-2215).
- **Check.** Count flashes, whole-frame shakes and light sweeps in the sheet and the scene
  list's budget line. Any drifting particles, lens-flare stacks or neon grids not born of the
  material?
- **Fix.** Keep the strongest instances, move the others inside the picture, delete the tropes.
- **Seen in.** sheet, brief.

## AR-15 Text is either read or texture

- **Rule.** Text meant to be read is at least 5% of the frame height for a key line (36 px at
  720p) and 3% for a secondary line (22 px at 720p), with clear contrast, and held long enough
  to read. Anything smaller is texture: soft, low contrast, and never carrying information the
  viewer needs.
- **Case.** External benchmark.
- **Check.** In the stills, measure the smallest text that carries meaning. Is it above the
  limit, or clearly texture?
- **Fix.** Enlarge it and give it a reading hold, or demote it to texture and move the
  information elsewhere.
- **Seen in.** stills.

## AR-16 Brand contract

- **Rule.** When the film uses a brand pack, the accent colour keeps its area and its allowed
  forms, nothing on the pack's `forbid` list or in `accent_rules.never` appears, and the film's
  own type uses the brand fonts at the brand type scale. The brand's forbid list wins over the
  style's craft; only the user's explicit instruction overrides it.
- **Case.** 2026-10-01, the decision to build brand pack v2:
  “很怕你做得特别的土气”. The pack is written as an aesthetic contract (accent area and forms,
  forbidden treatments, a type scale) so that a reviewer can check frames against it.
- **Check.** With `brand.json` and the brand sheet: in each frame, how many separate accent
  spots are there (against `per_frame`), and does the accent cover more than `max_area`? Is it
  in one of `forms`, or does it show a `never` treatment (metallic, gradient, glow, bevel,
  glitter)? Does any frame show something on `forbid`? Do the title, credit and end-card type
  match the brand fonts and sit near the `type_scale` sizes? Does any frame break a rule in the
  documents listed in `rules_docs`? No brand pack given: `–`.
- **Fix.** Remove the extra accent or move it into ink; replace the forbidden treatment with
  one of the allowed forms (a flat line instead of a glow); reset type to the brand fonts and
  the nearest scale step. Record any instruction from the user that overrides the pack in
  `brief.md`.
- **Seen in.** stills, sheet, brief.

## AR-17 Cards and labels without the AI default look

- **Rule.** A card or label is a quiet, well-made object: generous padding, a clear two-level
  hierarchy (a heavy title, a lighter note in the secondary ink), a plain surface lifted by a soft
  shadow or a hairline border, corners that suit the style. The accent marks the one thing that
  matters on it, as a small dot, badge, number or key word, or as the leader's end on the subject;
  it never paints the card's frame. Never put a coloured stripe on one side of a card container
  (any side, as a border or an inset shadow), and never give each card its own stripe colour.
  Allowed: neutral structural dividers inside a card, and a quiet emphasis line beside a quotation
  inside a card (blockquote style). The rest of that family is out too: an accent outline around
  the active card, emoji as icons, glass blur, glowing edges, a gradient that means nothing. They
  read as generated, not designed.
- **Case.** 2026-10-20, the Roadster structure in three styles (diagram-3d, particles, cut-paper):
  the active label cards carried an accent stripe down their left edge, inherited from the 2D
  mechanism starter. Axton rejected it (translated): every AI does this, it is the treatment he
  dislikes most, and cards should be modern, confident and generous instead. His standing rule
  since 2026-07-06: “任何卡片都不要有这种单边的彩色边！这就是典型 AI 效果”.
- **Check.** In the stills: does any card or label show a coloured edge on one side, an accent
  outline around its frame, emoji, glass blur or a glow? Is the accent on a card one small mark
  (dot, badge, number or word)? Is the padding generous (about half the title's height or more)
  and the title clearly heavier than the note?
- **Fix.** Remove the stripe or outline; put the accent on a dot before the title, a number
  badge, the key word or the leader's end on the subject; widen the padding; set the title heavier
  and the note lighter in the secondary ink; lift the card with a soft shadow or a hairline border
  in the ink at low opacity.
- **Seen in.** stills, sheet.
