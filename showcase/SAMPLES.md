# Showcase samples / 样片记录

[Back to README](../README.md) · [风格页 / Style page](index.html)

One narration, six looks. All six films use the same 20.86-second Chinese narration from
the author's book *重构个体* (recorded in the author's own voice) and the real book cover.
Samples 1–5 were made by this Skill from a one-sentence request; sample 6 is a reference
made outside this Skill.

同一段口播，六种画面。六条样片都用作者本人录制的同一段 20.86 秒《重构个体》口播和真实书封。
第 1–5 条由本 Skill 根据一句话输入生成；第 6 条是作者用内部产线制作的已发布版，**不是本 Skill 生成的**，只作参照。

## How to read the numbers / 数字口径

- **Host / 宿主**: Claude Code, model `claude-opus-5-5`, effort `high`, run non-interactively
  (`claude -p`) in the author's environment on macOS (Apple M4 Pro). Each film shown is the
  delivery of one session plus the revisions listed; samples 1–4 were the only run of their style
  with this narration, sample 5 was the fourth cinematic attempt (see its notes).
- **Time / 耗时**: wall-clock time of the agent session as reported in its result event,
  including planning, rendering and self-checks.
- **Cost / 成本**: the `total_cost_usd` Claude Code reports at **API list price**
  (`costBasis: list`). It is an estimate of what the tokens would cost on the API, **not the
  amount charged to a subscription**. Most of it is cache reads of a long working context,
  not output length.
- **Revisions / 修改次数**: follow-up requests from the author after the first delivery, made
  in the same session (resumed). The revision cost below is the increment on top of the first
  delivery.
- Output of every sample: 1920×1080, 30 fps, H.264 + AAC, subtitles burned in.

## 1 · Cut paper / 剪纸拼贴

Text in 〔 〕 was redacted for publication: a local folder path and the author's legal name.
Everything else is the request exactly as sent.

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段剪纸拼贴风格（纸张质感、层叠、手作感，温暖）的宣传短片，1920×1080，带中文字幕。素材在 inputs/：我的旁白录音 narration.wav（逐句时间在 narration.srt，逐字时间在 words.json），书的封面 book-cover.png（保持原样，不要重画）。画面节奏跟着旁白走，关键词说出来的那一刻画面要有回应；配乐从 `〔本地 Artlist 曲库目录〕` 里挑一首合适的，压在旁白下面。不要编造书里没有的内容。
- **Revision 1 (verbatim)**:
  > 片子里单独出现的作者署名只写 Axton，不要出现“〔作者本名〕”；书封原图上印的字保持原样不改。其他画面、节奏和声音都保持不变。请在前台重新渲染成片，旧版保留不要覆盖，然后告诉我新文件的路径。
- **Revision 2 (verbatim)**:
  > （Axton 的修改意见，第 2 次修改）把配乐从 Artlist 曲子换成用 Lyria 自己生成的配乐（这次付费调用我授权，最多调用 2 次）。用 video-illustrator 当前版本的 scripts/music.mjs 生成、scripts/beats.mjs 测节拍，按 rendering.md 的音频流程重新混音（旁白不动，配乐压在旁白下面，保留原有音效）。如果新配乐的鼓点和原来关键动作的时间对不上，只微调关键动作的时间去对齐新节拍，画面内容、署名（Axton）和字幕不变。在前台重新渲染，输出为新的 v3 目录，v1、v2 都保留不要覆盖。完成后告诉我新文件路径、新配乐的 music.json 回执和节拍测量结果。
- **Skill version**: first delivery and revision 1 on 0.1.1 (commit `8408eb9`); revision 2
  resumed the same session and used the Skill's then-current music workflow (0.3.2,
  `scripts/music.mjs` + `scripts/beats.mjs`).
- **Time**: 25.8 min first delivery + 10.4 min revision 1 + 13.6 min revision 2.
- **Cost (API list price)**: US$4.09 first delivery + US$4.10 revision 1 + US$6.53
  revision 2 = **US$14.71**, plus US$0.0396 for one Lyria music call (OpenRouter usage
  cost, generation id `gen-1790563914-yx9a4XEk1UkQ57dfKAqv`).
- **Revisions**: 2 (1: author credit line only; 2: swapped the music bed for a
  Lyria-generated clip and retimed key actions to the new beat grid — picture content,
  credit line and subtitles unchanged).
- **Length**: 25.5 s.
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter for revision 2 — felt piano, pizzicato strings, soft glockenspiel, brushed
  snare, 90 BPM (requested), about 26 s. Replaces the Artlist track used before revision 2,
  which is no longer used in this sample.
- **Mix (final pass)**: the vocal/music balance was remixed by the operator per Skill
  rule 0.3.2 — constant music-bed level under narration, a lift only after the last
  spoken word into the tail, then a static gain to about −14 LUFS with a fast peak
  limiter (no sidechain, no dynamic loudnorm). Picture frames are unchanged (verified
  by video-stream md5) and no model was called for this pass.

## 2 · Ink wash / 水墨

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 中国水墨风格（笔触、墨色晕染、留白）
- **Revision 1**: same text as sample 1.
- **Revision 2**: same text as sample 1's revision 2.
- **Skill version**: first delivery and revision 1 on 0.1.1 (commit `8408eb9`); revision 2
  resumed the same session and used the Skill's then-current music workflow (0.3.2,
  `scripts/music.mjs` + `scripts/beats.mjs`).
- **Time**: 26.8 min first delivery + 7.4 min revision 1 + 10.0 min revision 2.
- **Cost (API list price)**: US$4.85 first delivery + US$2.69 revision 1 + US$4.21
  revision 2 = **US$11.75**, plus US$0.0396 for one Lyria music call (OpenRouter usage
  cost, generation id `gen-1790564732-potSYdcPx6sW2TyIGn4s`).
- **Revisions**: 2 (1: author credit line only; 2: swapped the music bed for a
  Lyria-generated clip and retimed key actions to the new beat grid — picture content,
  credit line and subtitles unchanged).
- **Length**: 23.0 s.
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter for revision 2 — solo felt piano with soft sustained strings and a light
  brushed pulse, 84 BPM (requested), about 23 s. Replaces the Artlist track used before
  revision 2, which is no longer used in this sample.
- **Mix (final pass)**: the vocal/music balance was remixed by the operator per Skill
  rule 0.3.2 — constant music-bed level under narration, a lift only after the last
  spoken word into the tail, then a static gain to about −14 LUFS with a fast peak
  limiter (no sidechain, no dynamic loudnorm). Picture frames are unchanged (verified
  by video-stream md5) and no model was called for this pass.

## 3 · Pixel retro / 像素复古

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 像素复古游戏风格（8-bit 像素画面，游戏化的关卡感）
- **Revision 1**: same text as sample 1.
- **Revision 2**: same text as sample 1's revision 2.
- **Skill version**: first delivery and revision 1 on 0.1.1 (commit `8408eb9`); revision 2
  resumed the same session and used the Skill's then-current music workflow (0.3.2,
  `scripts/music.mjs` + `scripts/beats.mjs`).
- **Time**: 18.5 min first delivery + 3.2 min revision 1 + 5.9 min revision 2.
- **Cost (API list price)**: US$4.14 first delivery + US$2.65 revision 1 + US$3.88
  revision 2 = **US$10.67**, plus US$0.0396 for one Lyria music call (OpenRouter usage
  cost, generation id `gen-1790565339-lsJ2VB6dY7aorjGLjVY7`).
- **Revisions**: 2 (1: author credit line only; 2: swapped the music bed for a
  Lyria-generated clip and retimed key actions to the new beat grid — picture content,
  credit line and subtitles unchanged).
- **Length**: 24.0 s.
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter for revision 2 — 8-bit chiptune with a bright square-wave lead, triangle-wave
  bass and noise-channel drums, 120 BPM (requested), about 30 s. Replaces the Artlist
  track used before revision 2, which is no longer used in this sample.
- **Mix (final pass)**: the vocal/music balance was remixed by the operator per Skill
  rule 0.3.2 — constant music-bed level under narration, a lift only after the last
  spoken word into the tail, then a static gain to about −14 LUFS with a fast peak
  limiter (no sidechain, no dynamic loudnorm). Picture frames are unchanged (verified
  by video-stream md5) and no model was called for this pass.

## 4 · Particles / 粒子光轨

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 粒子与生成艺术风格（粒子和光线轨迹聚散成形，流动、有科技感）

  This is a custom style description; it has no entry in the [style atlas](../references/styles.md).
- **Revision 1**: same text as sample 1.
- **Revision 2**: same text as sample 1's revision 2.
- **Skill version**: first delivery and revision 1 on 0.1.1 (commit `8408eb9`); revision 2
  resumed the same session and used the Skill's then-current music workflow (0.3.2,
  `scripts/music.mjs` + `scripts/beats.mjs`).
- **Time**: 28.4 min first delivery + 5.2 min revision 1 + 8.6 min revision 2.
- **Cost (API list price)**: US$4.19 first delivery + US$2.02 revision 1 + US$3.61
  revision 2 = **US$9.81**, plus US$0.0396 for one Lyria music call (OpenRouter usage
  cost, generation id `gen-1790565682-lvXyQlgrAMqRaQ5z3L3E`).
- **Revisions**: 2 (1: author credit line only; 2: swapped the music bed for a
  Lyria-generated clip and retimed key actions to the new beat grid — picture content,
  credit line and subtitles unchanged).
- **Length**: 25.5 s.
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter for revision 2 — cinematic ambient electronic with warm analog synth pads, a
  soft pulsing arpeggio and a felt-piano motif, 90 BPM (requested), about 25.5 s. Replaces
  the Artlist track used before revision 2, which is no longer used in this sample.
- **Mix (final pass)**: the vocal/music balance was remixed by the operator per Skill
  rule 0.3.2 — constant music-bed level under narration, a lift only after the last
  spoken word into the tail, then a static gain to about −14 LUFS with a fast peak
  limiter (no sidechain, no dynamic loudnorm). Picture frames are unchanged (verified
  by video-stream md5) and no model was called for this pass.

## 5 · Cinematic 3D / 电影感 3D

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段电影预告片质感的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 Lyria 生成（这次付费调用我授权）。不要编造书里没有的内容。

  `inputs/brand/brand.json` contained only `{"display_name": "Axton"}`.
- **Skill version**: 0.3.0 (commit `957ae94`), 3D route (three.js, rendered with `--gpu`).
- **Time**: 28.1 min.
- **Cost (API list price)**: **US$6.41**, plus US$0.0396 for one Lyria music call
  (as reported by OpenRouter).
- **Revisions**: 0.
- **Length**: 30.0 s.
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter, one 30-second clip. Prompt summary: cinematic hybrid score, low strings,
  felt piano, sub pulse, soft taiko, one heavy hit, 90 BPM (measured 90.07). Sound effects
  were synthesized locally by `scripts/sfx.mjs`.
- **Context**: this is the fourth cinematic attempt. Three earlier ones on the 2D route with
  older Skill versions were judged flat and not selected; the 3D route was added after them.
- **Mix (final pass)**: the vocal/music balance was remixed by the operator per Skill
  rule 0.3.2 — constant music-bed level under narration, a lift only after the last
  spoken word into the tail, then a static gain to about −14 LUFS with a fast peak
  limiter (no sidechain, no dynamic loudnorm). Picture frames are unchanged (verified
  by video-stream md5) and no model was called for this pass.

## 6 · Brick world (reference) / 积木（参照版）

- **Not made by this Skill.** The author made this published version with a separate internal
  production pipeline. It is shown only as a reference point for what the same narration
  looks like in a fully produced piece.
- In that published film the two narration lines used here are far apart; this cut joins
  them, so there is one visible jump cut.
- Length: 23.4 s. Time, cost and music source are outside this Skill's records and are not
  reported here.

## Other styles made in the same batch

Kinetic typography and a glass product-launch look were also generated from the same
narration and are held back as alternates. They are not shown because the author preferred
the five above, not because the runs failed.

## Material and rights / 素材与授权

- **Narration**: the author's own voice, recorded by the author.
- **Book cover**: the cover of the author's own book *重构个体：AI时代如何打造个人竞争力*,
  used unchanged (the Skill only scales, moves, lights and crops it). It carries the
  publisher's marks.
- **Music**: all five Skill-made samples (1–5) shown here use a track generated with
  Google Lyria 3 through the author's own OpenRouter account. Earlier versions of samples
  1–4 used tracks from the author's Artlist subscription, replaced by revision 2 in each
  (see each sample's notes); Artlist music is no longer used in any homepage sample. No
  audio file is distributed with this package.
- **License scope**: the MIT license of this repository covers the code and documentation.
  The sample films, preview animations and posters in `showcase/` contain the author's voice,
  book cover and licensed music. They are shown to demonstrate the Skill and are **not**
  licensed for reuse under MIT. © 2026 Axton Liu.
