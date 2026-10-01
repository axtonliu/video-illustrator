# Style atlas / 风格目录

24 starting art directions, grouped for discovery. These are authored reference
specifications, not 24 validated generated videos. Read only the selected direction
and shared composition/directing guidance. A supplied custom style remains valid.

Select by what the content needs to communicate and what the viewer should feel.
Use recognizable materials, object construction and movement rather than counting
palette swaps as new styles. The primary style can combine with a compatible framing,
palette, movement or sound choice; see `composition.md` for conflict handling.

## Treatments that layer on any style / 可叠加处理

| Treatment | What it adds |
|---|---|
| [电影感 · `cinematic`](cinematic.md) | Two-second hook, music-first beat grid, a sound for every action, one material-born motif, fast cuts |

A treatment combines with one primary style; it never replaces the style's materials,
palette or motion language.

## Color follows the style / 配色跟随风格

Each style brings its own palette logic (ink and paper, riso spot inks, pixel palettes,
chalk on slate). Start from that. Colors in the user's real assets may be echoed as an
accent or a transition bridge, but do not let every style inherit the asset's dominant
colors: a black-and-gold book cover should not turn eight styles into eight black-and-gold
films. When `inputs/brand/brand.json` supplies a `palette`, use it for the film's own
typography, credits and end card, and still let the style govern the world. A v2 brand pack
with `palette_scope: "film"` is the exception: its palette colours the whole film while the style
keeps its materials, motion and craft ([brand.md](brand.md#precedence)).

## Motion tokens

Every style file ends its motion guidance with a `## Motion tokens` block: the style's motion
voice as numbers (30 fps). They are starting values, chosen so that styles really differ
(a halftone panel snaps in 4–8 frames with a 12% overshoot; a stained-glass pane fills with
light over 30–48 frames and never overshoots). Change them for a reason and say so in
`brief.md`; do not replace them with one house ease for every style.

| Field | Meaning | In code |
|---|---|---|
| `cadence` | How often a new drawing appears: on 1s (every frame), on 2s (15 per second), on 3s (10 per second), or N fps stepped | Quantise time for drawn poses: `step(t, 15)`; camera and whole-object travel may stay on 1s where the file says so |
| `enter / exit` | Duration of an element's entrance and exit, in frames | `enter: [10, 14]`; pick within the range by importance (the hero takes the long end) |
| `ease` | Entrance and exit curves | `cubicBezier(...)` below; a curve whose y values pass 1 overshoots by exactly that much |
| `overshoot` | Largest allowed pass beyond the target, as a share of the move; `none` = never passes it | Must agree with the entrance curve: `none` curves stay at or below 1 |
| `squash-stretch` | Largest deformation on contact or speed; keep volume (`scaleX = 1 / scaleY`) | Apply only on contact frames and the fastest frames of a move |
| `reading hold` | Minimum stillness after something that must be read lands | Add the line-length reading time from [cinematic.md](cinematic.md#pace-cut-more-dwell-less) on top |
| `end hold` | Minimum settled time for the last picture before the film ends | `scripts/contact.mjs` measures it as `end_hold_s` and warns under 1.0 s |

```js
// Timeline tokens copied from the style file (cut-paper here).
const MOTION = { cadence: 15, enter: [10, 14], exit: [8, 10], easeIn: [0.3, 1.15, 0.45, 1.06],
  easeOut: [0.6, 0, 0.9, 0.5], overshoot: 0.04, squash: 0.04, readingHold: 0.8, endHold: 1.5 };
const step = (t, fps) => (fps ? Math.floor(t * fps + 1e-6) / fps : t);   // on 2s at 30 fps: 15; 12 fps stepped: 12
function cubicBezier(x1, y1, x2, y2) {                                    // CSS cubic-bezier, x1 and x2 in [0, 1]
  const f = (a, b, u) => 3 * a * (1 - u) ** 2 * u + 3 * b * (1 - u) * u * u + u ** 3;
  return x => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (f(x1, x2, m) < x) lo = m; else hi = m; } return f(y1, y2, (lo + hi) / 2); };
}
const enter = cubicBezier(...MOTION.easeIn);
// progress of an entrance that starts at t0 and lasts 12 frames, drawn on 2s:
const p = enter(Math.min(1, Math.max(0, (step(t, MOTION.cadence) - t0) / (12 / 30))));
```

One set of tokens governs entrances, exits, transitions and holds for the whole film; mixing
two styles' tokens reads as a collage of two films.

## Drawing & painting / 绘画

| Style | Distinctive expressive mechanism |
|---|---|
| [白板讲解 · `whiteboard`](whiteboard.md) | Build a causal explanation; preserve earlier relations |
| [水墨 · `ink-wash`](ink-wash.md) | Pressure, ink mass and negative space carry movement |
| [水彩 · `watercolor`](watercolor.md) | Transparent washes, wet edges and color diffusion |
| [铅笔速写 · `pencil-sketch`](pencil-sketch.md) | Searching lines, hatching and visible revision |
| [厚涂油画 · `oil-impasto`](oil-impasto.md) | Heavy paint planes, directional strokes and light |
| [黑板粉笔 · `chalkboard`](chalkboard.md) | Granular marks, partial erasure and accumulated reasoning |

## Graphic & print / 图形与印刷

| Style | Distinctive expressive mechanism |
|---|---|
| [动态排版 · `editorial-motion`](editorial-motion.md) | Typography and graphic transformations organize an argument |
| [工程蓝图 · `blueprint`](blueprint.md) | Construction, sections and aligned component movement |
| [孔版印刷 · `risograph`](risograph.md) | Separate ink layers, overprint and stable registration character |
| [木刻版画 · `woodcut`](woodcut.md) | Solid ink masses and carved negative marks |
| [半调漫画 · `halftone-comic`](halftone-comic.md) | Panels, graphic emphasis and intentional action timing |

## Character animation / 角色动画

| Style | Distinctive expressive mechanism |
|---|---|
| [扁平卡通 · `flat-cartoon`](flat-cartoon.md) | Readable acting through clear silhouettes and poses |
| [赛璐璐动画 · `cel-anime`](cel-anime.md) | Graphic shadow shapes and selective motion |
| [橡皮管动画 · `rubber-hose`](rubber-hose.md) | Elastic limbs, rhythmic acting and contact-driven exaggeration |

## Pixel & terminal / 像素与终端

| Style | Distinctive expressive mechanism |
|---|---|
| [像素游戏 · `pixel-art`](pixel-art.md) | Grid-aware shapes, discrete poses and deliberate palette |
| [字符终端 · `ascii-terminal`](ascii-terminal.md) | Text cells become actors, spaces and state changes |

## Spatial worlds / 空间世界

| Style | Distinctive expressive mechanism |
|---|---|
| [等距空间 · `isometric`](isometric.md) | Follow a process through a stable projected world |
| [低多边形 · `low-poly`](low-poly.md) | Faceted volume, clear landmarks and spatial reveal |
| [玻璃产品 · `glass-product`](glass-product.md) | Edges, thickness and light reveal an object or feature |

## Material & theatre / 材质与剧场

| Style | Distinctive expressive mechanism |
|---|---|
| [剪纸拼贴 · `cut-paper`](cut-paper.md) | Cut shapes act through folds, contact and layered material |
| [黏土定格 · `clay-stop-motion`](clay-stop-motion.md) | Sculpted mass, purposeful poses and contact response |
| [皮影剧场 · `shadow-puppetry`](shadow-puppetry.md) | Articulated silhouettes perform against transmitted light |
| [纸艺立体书 · `paper-pop-up`](paper-pop-up.md) | Connected planes unfold around legible hinges |
| [彩色玻璃 · `stained-glass`](stained-glass.md) | Bounded panes and moving illumination reveal relationships |

## Quick routes

- Explain a causal or logical relationship: whiteboard, chalkboard, editorial motion.
- Inspect a constructed mechanism: blueprint, isometric, low-poly.
- Tell a tactile transformation: cut-paper, clay-stop-motion, paper-pop-up.
- Develop a character-led short: flat-cartoon, cel-anime, rubber-hose, shadow-puppetry.
- Build atmosphere through drawn material: ink-wash, watercolor, pencil-sketch, oil-impasto.
- Give a graphic statement a print identity: risograph, woodcut, halftone-comic.
- Stage a digital world: pixel-art or ascii-terminal.
- Reveal through light: glass-product or stained-glass.

These routes are suggestions, not restrictions or a ranking of quality. One style
can serve several purposes; choose the scene's actual expressive logic. Review an
implemented result before promoting a direction as proven for a particular task.
