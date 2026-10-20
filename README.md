# Video Illustrator

**Your voice, your assets, any look you choose.**

[简体中文](README.zh-CN.md)

An Agent Skill that turns your own narration and your real material (book cover, course cover, screenshots, logo, kept exactly as they are) into a 20–60 second promo or concept explainer in the style you pick. You get an MP4 and editable scene source, rendered on your own machine.

## One narration, six looks

The same 20.86-second narration (the author's own voice) and the same real book cover in every cell. Previews are silent loops; click one for the full video with narration and music.

<table>
<tr>
<td width="33%" valign="top"><a href="https://youtu.be/9zBcFp49VeU"><img src="showcase/previews/7-editorial-tech.webp" alt="Editorial tech style preview" width="100%"></a><br><b>Editorial tech <sup>v0.4</sup></b><br>Big type, terminal UI, tickets; one pass flips from door 01 to 02.<br><a href="https://youtu.be/9zBcFp49VeU">Watch on YouTube</a> · <a href="https://www.bilibili.com/video/BV1RDa56jENM/?p=1">Watch on Bilibili</a></td>
<td width="33%" valign="top"><a href="https://youtu.be/eyvkcXT8J1g"><img src="showcase/previews/8-cinematic-3d-v04.webp" alt="Cinematic 3D preview" width="100%"></a><br><b>Cinematic 3D <sup>v0.4</sup></b><br>Trailer scale: a crack becomes a canyon, a ten-storey door opens.<br><a href="https://youtu.be/eyvkcXT8J1g">Watch on YouTube</a> · <a href="https://www.bilibili.com/video/BV1RDa56jENM/?p=2">Watch on Bilibili</a></td>
<td width="33%" valign="top"><a href="https://youtu.be/RspPmhD8SuY"><img src="showcase/previews/1-cut-paper.webp" alt="Cut paper style preview" width="100%"></a><br><b>Cut paper <sup>v0.5</sup></b><br>One gold line: paper tears along the cover's crack, and the crack becomes a road, a ribbon, a reader's pen.<br><a href="https://youtu.be/RspPmhD8SuY">Watch on YouTube</a> · <a href="https://img.axtonliu.com/video-illustrator/samples/1-cut-paper-v05.mp4">Play directly</a></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="https://youtu.be/o4fDdmcybLc"><img src="showcase/previews/2-ink-wash.webp" alt="Ink wash style preview" width="100%"></a><br><b>Ink wash <sup>v0.5</sup></b><br>One frame, from gateway to book to page; ink stays inside until a vermilion stroke breaks out.<br><a href="https://youtu.be/o4fDdmcybLc">Watch on YouTube</a> · <a href="https://img.axtonliu.com/video-illustrator/samples/2-ink-wash-v05.mp4">Play directly</a></td>
<td width="33%" valign="top"><a href="https://youtu.be/onpxVv_pBMo"><img src="showcase/previews/3-pixel-retro.webp" alt="Pixel retro style preview" width="100%"></a><br><b>Pixel retro <sup>v0.5</sup></b><br>A two-player game: "Author: ???" becomes Axton, and the HUD hands 2P to you.<br><a href="https://youtu.be/onpxVv_pBMo">Watch on YouTube</a> · <a href="https://img.axtonliu.com/video-illustrator/samples/3-pixel-retro-v05.mp4">Play directly</a></td>
<td width="33%" valign="top"><a href="https://youtu.be/HjPDtsuzjF4"><img src="showcase/previews/4-particles.webp" alt="Particles style preview" width="100%"></a><br><b>Particles <sup>v0.5</sup></b><br>Light gathers into form; the "pen" label passes from — to Axton to you.<br><a href="https://youtu.be/HjPDtsuzjF4">Watch on YouTube</a> · <a href="https://img.axtonliu.com/video-illustrator/samples/4-particles-v05.mp4">Play directly</a></td>
</tr>
</table>

**Brick world (reference):** the same narration in the full book trailer, made by the author with a separate internal pipeline, **not** by this Skill. [Watch on YouTube](https://youtu.be/iRScrftmJCU) · [Watch on Bilibili](https://www.bilibili.com/video/BV1fcax6JExX/)

Each preview links to the full video (with narration and music) on YouTube; the two v0.4 cells also link to Bilibili, the four v0.5 cells to an MP4 you can play directly. This repository does not distribute the MP4 files themselves. Every sample was made from a one-sentence request with Claude Code + Opus 5.5 (high effort) in the author's environment, each in a single pass with 0 revisions: two with Skill 0.4, four with Skill 0.5. Skill 0.4 fixes a concept and one organizing device before any keyframe, puts a new picture on every bar, snaps text to the voice and checks a contact sheet before delivery (the cinematic request also carried a director's note). Skill 0.5 adds motion parameters with a restraint budget, a vocabulary of transitions and the craft of each medium; before delivery an independent reviewer with a clean context checks the film against the aesthetic rules, and the three rules that decide whether a stranger stops (would a stranger stop, pictures and scale, leave the desk) can get a second round. The four 0.5 samples reuse the music of the earlier sample in the same style (generated with Lyria); no new Lyria call was made. The exact requests, Skill versions, time, cost at API list price and music sources are in [SAMPLES.md](showcase/SAMPLES.md), which also keeps the records of the earlier versions of these four styles. A small [style page](showcase/index.html) plays each sample and copies a ready-made request for that style.

## One mechanism, three looks

The same 15-second explainer insert (silent, no narration) in the three styles that carry a mechanism best: the structure of the second-generation Tesla Roadster, from the car to its contact patches, suction fans, air tanks and cold-gas thrusters and back. One content file, three renders; every figure on screen comes from a research table and is attributed. Details in [SAMPLES.md](showcase/SAMPLES.md#9--roadster-structure-in-three-looks--roadster-结构三种画面-v09); [all three stacked in one clip](https://img.axtonliu.com/video-illustrator/samples/9-roadster-compare-v09.mp4).

<table>
<tr>
<td width="33%" valign="top"><img src="showcase/previews/9-roadster-diagram-3d.webp" alt="Roadster structure, diagram-3d preview" width="100%"><br><b>Diagram 3D <sup>v0.9</sup></b><br>The default explainer look: studio-lit models on light paper, one warm accent.<br><a href="https://img.axtonliu.com/video-illustrator/samples/9-roadster-diagram-3d-v09.mp4">Play directly</a></td>
<td width="33%" valign="top"><img src="showcase/previews/9-roadster-particles.webp" alt="Roadster structure, particles preview" width="100%"><br><b>Particles <sup>v0.9</sup></b><br>The same geometry drawn as points of light on a dark ground.<br><a href="https://img.axtonliu.com/video-illustrator/samples/9-roadster-particles-v09.mp4">Play directly</a></td>
<td width="33%" valign="top"><img src="showcase/previews/9-roadster-cut-paper.webp" alt="Roadster structure, cut paper preview" width="100%"><br><b>Cut paper <sup>v0.9</sup></b><br>The 2D route: a side-view paper car that comes apart in layers.<br><a href="https://img.axtonliu.com/video-illustrator/samples/9-roadster-cut-paper-v09.mp4">Play directly</a></td>
</tr>
</table>

## How it works

1. **Put your material in folders** (all optional):

   ```text
   my-promo/
     inputs/voice/    your narration (a recording or a cloned-voice export); optional .srt or words.json with word times
     inputs/assets/   book or course covers, screenshots, logos: used as-is, only scaled, moved, cropped or lit
     inputs/brand/    brand pack: brand.json (display_name, palette, fonts...) + optional fonts, motifs, end card
   ```

2. **Ask in one sentence**, naming a style:

   ```text
   Use video-illustrator on ./my-promo: my narration is in inputs/voice, my book cover in inputs/assets, brand info in inputs/brand. Make a 1920×1080 promo in cut-paper style with subtitles, timed to the narration. Don't invent anything the material doesn't say.
   ```

3. **Get the film and its source**: an MP4, the editable `scene.html`, a `brief.md` recording the choices (music, beat grid, what happens when) and the assets it used, so you can revise and re-render.

Without any folders the Skill works from text alone, for example "explain why a cache makes repeated requests faster as a 20-second whiteboard animation". A standalone author credit uses `display_name` from [brand.json](references/brand.example.json); words printed on your assets are never changed. Colors follow the chosen style, with your assets' colors as an accent, unless your [brand pack](references/brand.md) colours the whole film. `node scripts/brand.mjs --sheet inputs/brand --out brand-sheet.png` renders one page to approve the pack before any film is made. To have your own taste in every project, keep a default pack in `~/.config/video-illustrator/brand/` (or point `$VIDEO_ILLUSTRATOR_BRAND` at one); its `rules_docs` can list your own design-rule documents, which are read where they are before every film.

For cinematic or trailer requests the Skill takes a 3D route (three.js on your GPU: real lighting, depth of field, motion blur, your cover on a 3D book). Illustration styles stay 2D.

**Explainer mode** (new in 0.7) is for narration you already have. Give it your video's subtitles and a time window, and it cuts that passage (`scripts/excerpt.mjs`), shows what the narration describes as a few persistent parts with things moving between them, each change landing on the sentence that says it, and returns silent 16:9 and 9:16 inserts for your own edit plus narrated, captioned previews. See [explainer.md](references/explainer.md).

Since 0.9 every mode picks its look from the same style atlas: explainers and whole episodes default to a bright 3D diagram look (`diagram-3d`), and can instead use any atlas style that can carry a mechanism, on the 3D route or on a 2D starter that reads the same content (for example particles or cut paper). The atlas says which styles fit and why the others do not ([styles.md](references/styles.md#carrying-an-explainer--讲解承载)).

## Install

Designed for **Claude Code + Opus 5.5**. Other hosts are unverified.

Requirements:

- Node.js 20 or newer
- FFmpeg and ffprobe on your PATH
- Playwright Chromium (installed below)
- Optional, for generated music: your own `OPENROUTER_API_KEY` in the environment. Music comes from Google Lyria 3 through OpenRouter, a paid call of about US$0.04 per 30-second clip, made only when you authorize it. Sound effects are synthesized locally for free. You can also point the Skill at music you already have. Keyframes or asset images can be sent as reference images with the music request (up to 10) so the score follows the picture; the Gemini API (`GEMINI_API_KEY`) is supported as an alternative provider.

Keep the `video-illustrator` folder intact and place it in your skill directory (for Claude Code, project-local `.claude/skills/video-illustrator/`, or a symlink to your checkout). Then, from the skill folder:

```sh
npm ci
npx playwright install chromium
```

`npm ci` also installs the pinned three.js (MIT) used by the 3D route. Rendering runs locally; nothing is sent to a hosted rendering service. Your coding agent still needs its own model access.

**GPU rendering** (3D route): verified on macOS with an Apple M4 Pro, where `--gpu` uses ANGLE on Metal; a 1080p frame of the starter scene took about 0.3 s with film grain. Without a GPU, Chromium falls back to software rendering, which works but measured 2× to 15× slower depending on motion blur. GPU rendering on Windows, Linux and other GPUs has not been tested.

## Scope

Early preview, best-effort maintenance. This is code-driven animation, not a photorealistic video model or an automatic fact checker, and one sentence will not always give a finished film. Longer narratives, fonts and audio can need extra work. Watch the result and check its claims before publishing. Reproducible issues and focused PRs are welcome.

## More

- [Style atlas](references/styles.md): all style directions and how to choose. Most have no sample yet.
- [SAMPLES.md](showcase/SAMPLES.md): how each showcase film was made.
- [VALIDATION.md](VALIDATION.md): what has actually been tested.
- [Credits](references/credits.md): research acknowledgments and third-party licenses.
- [Rendering](references/rendering.md): renderer contract, drafts, audio-first workflow.
- [Explainer mode](references/explainer.md): turn one passage of an existing narrated video into a mechanism insert.

## License and author

Code and documentation: [MIT](LICENSE), © 2026 Axton Liu. The showcase films, previews and posters contain the author's voice, book cover and licensed music; they demonstrate the Skill and are not licensed for reuse (see [SAMPLES.md](showcase/SAMPLES.md#material-and-rights--素材与授权)). Third-party assets you bring keep their own terms.

Created by [Axton Liu](https://www.axtonliu.com/) · [X](https://x.com/AxtonLiu)
