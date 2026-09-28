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
- **Skill version**: first delivery 0.1.1 (commit `8408eb9`); the revision resumed that session.
- **Time**: 25.8 min first delivery + 10.4 min revision.
- **Cost (API list price)**: US$4.09 first delivery + US$4.10 revision = **US$8.18**.
- **Revisions**: 1 (author credit line only).
- **Length**: 25.5 s.
- **Music**: “Peace” by Musical Mandalas, from Artlist, picked by the agent from the
  author's local library.

## 2 · Ink wash / 水墨

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 中国水墨风格（笔触、墨色晕染、留白）
- **Revision 1**: same text as sample 1.
- **Skill version**: first delivery 0.1.1 (commit `8408eb9`); the revision resumed that session.
- **Time**: 26.8 min + 7.4 min revision.
- **Cost (API list price)**: US$4.85 + US$2.69 revision = **US$7.53**.
- **Revisions**: 1 (author credit line only).
- **Length**: 23.0 s.
- **Music**: “Peace” by Musical Mandalas, from Artlist (used from 8.42 s so a phrase lift
  lands on 请把它写脏).

## 3 · Pixel retro / 像素复古

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 像素复古游戏风格（8-bit 像素画面，游戏化的关卡感）
- **Revision 1**: same text as sample 1.
- **Skill version**: first delivery 0.1.1 (commit `8408eb9`); the revision resumed that session.
- **Time**: 18.5 min + 3.2 min revision.
- **Cost (API list price)**: US$4.14 + US$2.65 revision = **US$6.79**.
- **Revisions**: 1 (author credit line only).
- **Length**: 24.0 s.
- **Music**: “Space Disco” by Stefano Mastronardi (album *Neon Rider*), from Artlist.

## 4 · Particles / 粒子光轨

- **Input (verbatim)**: same as sample 1 with the style phrase
  > 粒子与生成艺术风格（粒子和光线轨迹聚散成形，流动、有科技感）

  This is a custom style description; it has no entry in the [style atlas](../references/styles.md).
- **Revision 1**: same text as sample 1.
- **Skill version**: first delivery 0.1.1 (commit `8408eb9`); the revision resumed that session.
- **Time**: 28.4 min + 5.2 min revision.
- **Cost (API list price)**: US$4.19 + US$2.02 revision = **US$6.20**.
- **Revisions**: 1 (author credit line only).
- **Length**: 25.5 s.
- **Music**: “Genesis” by Quinten Coblentz (album *Scores Vol. 1*), from Artlist, a 25.5 s
  section starting at 35.6 s. The agent chose it from waveform, loudness and spectrum and
  said it could not listen to it.

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
- **Music**: the Artlist tracks are used under the author's Artlist subscription license
  (tracks downloaded during the subscription may be used in videos permanently). They appear
  only mixed into the finished films; no audio file is distributed with this package.
  The Lyria track was generated for sample 5 through the author's own OpenRouter account.
- **License scope**: the MIT license of this repository covers the code and documentation.
  The sample films, preview animations and posters in `showcase/` contain the author's voice,
  book cover and licensed music. They are shown to demonstrate the Skill and are **not**
  licensed for reuse under MIT. © 2026 Axton Liu.
