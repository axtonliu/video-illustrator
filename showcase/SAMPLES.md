# Showcase samples / 样片记录

[Back to README](../README.md) · [风格页 / Style page](index.html)

One narration, six looks. All samples use the same 20.86-second Chinese narration from
the author's book *重构个体* (recorded in the author's own voice) and the real book cover.
The README grid shows samples 7 and 8 (Skill 0.4) and 1–4 (Skill 0.5), all made by this
Skill from a one-sentence request in a single pass with no revision. Sections 1–4 also keep the
record of the earlier version of each style, which is still online. Sample 5 is the earlier
cinematic sample that 8 replaced on the grid. Sample 6 is a reference made outside this Skill.

同一段口播，六种画面。所有样片都用作者本人录制的同一段 20.86 秒《重构个体》口播和真实书封。
README 网格展示第 7、8 条（Skill 0.4）和第 1–4 条（Skill 0.5），都由本 Skill 根据一句话输入一次跑完、0 次修改；
第 1–4 节末尾保留了该风格上一版的记录，上一版视频仍可观看；第 5 条是被第 8 条替换下来的旧版电影感样片；第 6 条是作者用内部产线制作的已发布版，**不是本 Skill 生成的**，只作参照。

## How to read the numbers / 数字口径

- **Host / 宿主**: Claude Code, model `claude-opus-5-5`, effort `high`, run non-interactively
  (`claude -p`) in the author's environment on macOS (Apple M4 Pro). Each film shown is the
  delivery of one session plus the revisions listed. The earlier versions of samples 1–4 were the
  only run of their style with this narration on Skill 0.1.1; the v0.5 cut-paper film follows one
  0.5 run that was not adopted, and sample 5 was the fourth cinematic attempt (see their notes).
- **Time / 耗时**: wall-clock time of the agent session as reported in its result event,
  including planning, rendering and self-checks.
- **Cost / 成本**: the `total_cost_usd` Claude Code reports at **API list price**
  (`costBasis: list`). It is an estimate of what the tokens would cost on the API, **not the
  amount charged to a subscription**. Most of it is cache reads of a long working context,
  not output length.
- **Revisions / 修改次数**: follow-up requests from the author after the first delivery, made
  in the same session (resumed). The revision cost below is the increment on top of the first
  delivery.
- **Review rounds / 审片轮次** (Skill 0.5 only): rounds of the Skill's own independent review
  inside the single run. A reviewer with a clean context judges the film's evidence against
  `references/aesthetic-rules.md`; the run fixes what is marked ✗. A second round is allowed only
  for AR-01 (would a stranger stop), AR-02 (pictures and scale) and AR-06 (leave the desk), and
  there is no third round (`references/review.md`). These are not author revisions.
- Output of every sample: 1920×1080, 30 fps, H.264 + AAC, subtitles burned in.

## 1 · Cut paper / 剪纸拼贴 (v0.5)

[Watch on YouTube](https://youtu.be/RspPmhD8SuY) · [Play directly](https://img.axtonliu.com/video-illustrator/samples/1-cut-paper-v05.mp4)

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段剪纸拼贴风格（纸张质感、层叠、手作感，温暖）的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 inputs/music/ 里的文件，不要生成。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
  `inputs/music/music.wav` is the music of this style's earlier version (its Lyria generation id
  is in the earlier-version notes below). The last sentence of the request is an operating note
  for the non-interactive runner's narrow command allowlist, not creative direction.
- **Skill version**: 0.5.0 (commit `fe9c9b9`, which adds the second review round for AR-01,
  AR-02 and AR-06), 2D route (Canvas).
- **Time**: 52.8 min.
- **Cost (API list price)**: **US$13.08**. No Lyria call; the music was supplied.
- **Revisions**: 0. An earlier pass in the same style on Skill 0.5.0 at commit `3aa99e4`, which
  allowed only one review fix round (48.4 min, US$9.94 at API list price), was not adopted; it
  led to the second-round rule in `fe9c9b9`.
- **Length**: 26.0 s.
- **Device**: one gold line. The opening paper tears along the crack in the cover and shows
  molten gold; the crack becomes a golden road, a bookmark ribbon and the reader's handwriting, and at
  「写脏」 the book's pages burst into scribbles and paper scraps.
- **Music**: the earlier version's Google Lyria 3 clip, reused from `inputs/music/` as the request
  asked; no new music was generated.
- **Review rounds**: two. In round 2 AR-06 passed and AR-01 and AR-02 were still ✗; the run
  fixed them once more without a further review.

### Earlier version / 上一版

The earlier film is still online: [Watch on YouTube](https://youtu.be/nY3bh-UEwyQ) · [Watch on Bilibili](https://www.bilibili.com/video/BV1mwaV6cE31/?p=1).
It was first delivered with Skill 0.1.1 and revised twice. The record below is unchanged, except
that references to sample 1 now point to sample 1's earlier version.

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

## 2 · Ink wash / 水墨 (v0.5)

[Watch on YouTube](https://youtu.be/o4fDdmcybLc) · [Play directly](https://img.axtonliu.com/video-illustrator/samples/2-ink-wash-v05.mp4)

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段中国水墨风格（笔触、墨色晕染、留白）的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 inputs/music/ 里的文件，不要生成。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
  `inputs/music/music.wav` is the music of this style's earlier version (its Lyria generation id
  is in the earlier-version notes below). The last sentence of the request is an operating note
  for the non-interactive runner's narrow command allowlist, not creative direction.
- **Skill version**: 0.5.0 (commit `fe9c9b9`, which adds the second review round for AR-01,
  AR-02 and AR-06), 2D route (Canvas).
- **Time**: 70.3 min.
- **Cost (API list price)**: **US$20.30**. No Lyria call; the music was supplied.
- **Revisions**: 0.
- **Length**: 23.8 s.
- **Device**: one rectangle, pushed in from a gateway to the book on a desk to the printed
  frame of a page. In the first half the ink never leaves the frame; at 「请把它写脏」 one vermilion stroke
  breaks out of it and becomes a red road through the landscape, back to the gate.
- **Music**: the earlier version's Google Lyria 3 clip, reused from `inputs/music/` as the request
  asked; no new music was generated.
- **Review rounds**: two. In round 2 only AR-01 was still ✗; the run fixed it once more
  without a further review.

### Earlier version / 上一版

The earlier film is still online: [Watch on YouTube](https://youtu.be/rR1Gh8s7aDE) · [Watch on Bilibili](https://www.bilibili.com/video/BV1mwaV6cE31/?p=2).
It was first delivered with Skill 0.1.1 and revised twice. The record below is unchanged, except
that references to sample 1 now point to sample 1's earlier version.

- **Input (verbatim)**: same as the earlier version of sample 1 with the style phrase
  > 中国水墨风格（笔触、墨色晕染、留白）
- **Revision 1**: same text as in the earlier version of sample 1.
- **Revision 2**: same text as revision 2 in the earlier version of sample 1.
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

## 3 · Pixel retro / 像素复古 (v0.5)

[Watch on YouTube](https://youtu.be/onpxVv_pBMo) · [Play directly](https://img.axtonliu.com/video-illustrator/samples/3-pixel-retro-v05.mp4)

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段像素复古游戏风格（8-bit 像素画面，游戏化的关卡感）的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 inputs/music/ 里的文件，不要生成。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
  `inputs/music/music.wav` is the music of this style's earlier version (its Lyria generation id
  is in the earlier-version notes below). The last sentence of the request is an operating note
  for the non-interactive runner's narrow command allowlist, not creative direction.
- **Skill version**: 0.5.0 (commit `fe9c9b9`, which adds the second review round for AR-01,
  AR-02 and AR-06), 2D route (Canvas).
- **Time**: 33.3 min.
- **Cost (API list price)**: **US$10.02**. No Lyria call; the music was supplied.
- **Revisions**: 0.
- **Length**: 29.5 s (the music runs 30 s; the film keeps the track's own ending).
- **Device**: a two-player game. The item box 「作者：？？？」 becomes Axton with 「获得道具！」,
  and the HUD switches from 1P to 「2P · 你」.
- **Music**: the earlier version's Google Lyria 3 clip, reused from `inputs/music/` as the request
  asked; no new music was generated.
- **Review rounds**: one; AR-01, AR-02 and AR-06 all passed the first time.

### Earlier version / 上一版

The earlier film is still online: [Watch on YouTube](https://youtu.be/rnREYCpvWeg) · [Watch on Bilibili](https://www.bilibili.com/video/BV1mwaV6cE31/?p=3).
It was first delivered with Skill 0.1.1 and revised twice. The record below is unchanged, except
that references to sample 1 now point to sample 1's earlier version.

- **Input (verbatim)**: same as the earlier version of sample 1 with the style phrase
  > 像素复古游戏风格（8-bit 像素画面，游戏化的关卡感）
- **Revision 1**: same text as in the earlier version of sample 1.
- **Revision 2**: same text as revision 2 in the earlier version of sample 1.
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

## 4 · Particles / 粒子光轨 (v0.5)

[Watch on YouTube](https://youtu.be/HjPDtsuzjF4) · [Play directly](https://img.axtonliu.com/video-illustrator/samples/4-particles-v05.mp4)

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段粒子与生成艺术风格（粒子和光线轨迹聚散成形，流动、有科技感）的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 inputs/music/ 里的文件，不要生成。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。

  This is a custom style description; it has no entry in the [style atlas](../references/styles.md).

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
  `inputs/music/music.wav` is the music of this style's earlier version (its Lyria generation id
  is in the earlier-version notes below). The last sentence of the request is an operating note
  for the non-interactive runner's narrow command allowlist, not creative direction.
- **Skill version**: 0.5.0 (commit `fe9c9b9`, which adds the second review round for AR-01,
  AR-02 and AR-06), particles rendered with three.js.
- **Time**: 45.5 min.
- **Cost (API list price)**: **US$12.63**. No Lyria call; the music was supplied.
- **Revisions**: 0.
- **Length**: 25.5 s.
- **Device**: a 「执笔」 (pen) label that changes from —— to Axton to 你, while the light pen turns
  from cold white to amber.
- **Music**: the earlier version's Google Lyria 3 clip, reused from `inputs/music/` as the request
  asked; no new music was generated.
- **Review rounds**: two. In round 2 only the book shape at 4–6 s did not pass; the run fixed it
  once more without a further review.

### Earlier version / 上一版

The earlier film is still online: [Watch on YouTube](https://youtu.be/Eez9PNYggu8) · [Watch on Bilibili](https://www.bilibili.com/video/BV1mwaV6cE31/?p=4).
It was first delivered with Skill 0.1.1 and revised twice. The record below is unchanged, except
that references to sample 1 now point to sample 1's earlier version.

- **Input (verbatim)**: same as the earlier version of sample 1 with the style phrase
  > 粒子与生成艺术风格（粒子和光线轨迹聚散成形，流动、有科技感）
- **Revision 1**: same text as in the earlier version of sample 1.
- **Revision 2**: same text as revision 2 in the earlier version of sample 1.
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

## 5 · Cinematic 3D / 电影感 3D (earlier version, replaced on the grid by 8)

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

## 7 · Editorial tech / 编辑部科技风 (v0.4)

- **Input (verbatim)**:
  > 用 video-illustrator 给我的新书《重构个体》做一段编辑部科技风（大字排版、终端界面、票据与工牌这类元素，未来感）的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 Lyria 生成（这次付费调用我授权，最多 2 次）。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
  The last sentence of the request is an operating note for the non-interactive runner's
  narrow command allowlist, not creative direction.
- **Skill version**: 0.4.0 (commit `d539341`), 2D route (Canvas).
- **Time**: 25.8 min.
- **Cost (API list price)**: **US$5.85**, plus US$0.0396 for one Lyria music call
  (OpenRouter usage cost, generation id `gen-1790610931-3j9F5UdXrWMsTLWuMdyy`).
- **Revisions**: 0. An earlier run of the same request, without the operating note, stopped
  after two minutes when its first compound shell command was refused by the runner's
  allowlist; it produced a brief but no film and is not counted as a revision.
- **Length**: 27.5 s.
- **What v0.4 changed here**: the film is built on one organizing device, a "PASS No.02"
  whose four fields flip with the narration (door 01 → 02, author — → 我, holder 我 → 你,
  status 干净 → 写脏) and flip over at 「请把它写脏」; key words land on measured beats
  (110 BPM) after onset snapping; the real cover appears only at the reveals and the end
  (about a quarter of the running time).
- **Music**: generated with Google Lyria 3 (`google/lyria-3-clip-preview`) through
  OpenRouter, one clip (minimal electronic, synth arpeggio, rimshot; measured 110 BPM).
  Sound effects synthesized locally by `scripts/sfx.mjs`.
- **Mix (final pass)**: the Skill run delivered a constant-bed mix at −14.4 LUFS; the operator
  re-applied the static gain with a lower limiter ceiling (`alimiter` limit 0.79) because
  AAC encoding pushed the true peak to −0.5 dBFS. Picture frames are unchanged (verified by
  video-stream md5) and no model was called for this pass.

## 8 · Cinematic 3D / 电影感 3D (v0.4)

- **Input (verbatim)**: the same request shape as sample 7, followed by a director's note.
  > 用 video-illustrator 给我的新书《重构个体》做一段电影预告片质感的宣传短片，1920×1080，带中文字幕。素材都在 inputs/ 里：旁白录音和逐字时间在 inputs/voice/，书封在 inputs/assets/，品牌信息在 inputs/brand/。配乐用 Lyria 生成（这次付费调用我授权，最多 2 次）。不要编造书里没有的内容。运行说明：Bash 每次只执行一条简单命令，不要用分号、&& 或管道串联多条；某条命令被拒时，拆成更简单的命令或换用 Read/Glob 再试，不要因此停下。
  >
  > 导演要求（这支片要让刷到的陌生人停下来，场面要宏大，不是产品广告）：
  > - 走 3D 路线，但不要停在桌子上。至少 4 个不同的世界，都从旁白和书封里长出来。可以参考、也可以自己想更好的：书封上水泥方块的金色裂缝放大成一道悬崖或峡谷，光从裂缝里涌出；一扇十层楼高的门在无边的暗场里打开，门前的人或书极小；一条很长的走廊，两端各一扇门，表示二十多年；书页铺成的大地，读者的笔迹像闪电一样划过；最后回到真实书封。
  > - 尺度阶梯：至少 2 个极远景（渺小对宏大），至少 2 个微距。镜头要飞：升起、穿过门、从高空俯冲到物体上。
  > - 节奏：每 2 拍到 1 小节换一个新镜头，全片至少 12 个镜头；除了片尾卡，任何一个世界停留不超过 2 小节。
  > - 组织装置：一道金线贯穿全片，从裂缝到门缝再到读者的笔迹；到「请把它写脏」时炸开，满屏都是金色笔迹。
  > - 最强的一击放在「写脏」的重拍上，这是全片最亮、尺度最大的时刻。
  > - 书封只在揭示时（「写书的人换成了我」之后）和片尾当主角，出镜不超过全片三分之一；揭示之前不要让封面提前露出来。字幕不要压住封面上的文字和标识。
  > - 片尾：书封、片名、Axton 和 making_of 那一行小字，音乐按自己的结尾收住。
  > - 如果 Lyria 带参考图的请求被拦截，改用纯文字提示再试一次。

  `inputs/brand/brand.json`: `{"display_name": "Axton", "making_of": "一句话生成 · 每一帧都是代码渲染"}`.
- **Skill version**: 0.4.0 (commit `a280c85`, which adds the "Scale: leave the desk" rules to
  `references/cinematic.md`), 3D route (three.js, rendered with `--gpu`).
- **Time**: 47.1 min.
- **Cost (API list price)**: **US$14.67**, plus US$0.0396 for one successful Lyria call
  (generation id `gen-1790614063-FhQyiqSnmSdvopITHyBR`). The first Lyria request, sent with
  keyframe reference images, was refused by the provider (`PROHIBITED_CONTENT`) and returned no
  audio; the run retried with a text-only prompt as the request allowed.
- **Revisions**: 0. An earlier single pass on Skill `d539341` with the plain request (no
  director's note) produced a competent but desk-bound film; it was judged not strong enough
  and is not shown. Its review led to the scale rules in `a280c85`.
- **Length**: 26.3 s. 18 shots across 8 worlds (a molten crack, a canyon, a corridor between two
  doors, a ten-storey door, a dark hall, the written page, the real cover, a land of pages).
- **Music**: Google Lyria 3 (`google/lyria-3-clip-preview`) through OpenRouter: cinematic
  trailer score, low strings, taiko, felt piano, brass swell (measured 138 BPM). A 0.35 s dip
  of the music bed before 「脏」 is a deliberate breath before the hit. Sound effects synthesized
  locally by `scripts/sfx.mjs`.
- **Mix**: as delivered by the Skill run (−14.7 LUFS, −0.8 dBFS after encoding); no operator pass.

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
- **Music**: all Skill-made samples (1–5, 7, 8) use a track generated with
  Google Lyria 3 through the author's own OpenRouter account. The v0.5 versions of samples 1–4
  reuse the Lyria tracks of their earlier versions. Before revision 2, those earlier versions
  used tracks from the author's Artlist subscription (see each sample's earlier-version notes);
  Artlist music is no longer used in any homepage sample. No
  audio file is distributed with this package.
- **License scope**: the MIT license of this repository covers the code and documentation.
  The sample films, preview animations and posters in `showcase/` contain the author's voice,
  book cover and licensed music. They are shown to demonstrate the Skill and are **not**
  licensed for reuse under MIT. © 2026 Axton Liu.
