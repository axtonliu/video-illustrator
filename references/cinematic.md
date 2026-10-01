# Cinematic treatment

A treatment that layers on top of any style in the [atlas](styles.md). The style decides
what the world is made of; this decides how the film grabs, moves and sounds. Use it
for promos, trailers and any 20–60 second piece that has to hold a stranger's attention.
It does not replace the style's own color, material or motion language.

## When “cinematic” is the look itself

If the user asks for a cinematic, trailer or 大片 look **without naming another style**,
do not pick a quiet illustration style (pencil, whiteboard, flat paper) as the base and
merely pace it like a trailer, and do not fake depth in Canvas 2D: build it on the
[3D route](#the-3d-route-default-for-cinematic). The look itself should read as a film at first glance:

- **Light and depth**: mostly dark or low-key frames, a motivated key light, rim light
  on the hero object, light that visibly moves or reveals; layered parallax or real
  depth so the camera travels *through* space, not across a flat page.
- **Scale and contrast**: big changes in shot size (macro detail → wide reveal), large
  confident type on title beats, strong value contrast; the user's real asset lit like a
  product hero.
- **Energy**: at least one clear impact moment with sound, a speed ramp, and a final
  reveal that is the brightest or largest moment of the piece.

Dark and dramatic is not the same as the generic tropes listed below: dramatic light,
shadow and depth are welcome; aimless gold particles and lens-flare stacks are not.
Derive the palette from the style and the material (a black-and-gold cover can suggest
light temperature), but make lighting, not color filters, carry the mood.

## Scale: leave the desk

The starter template is a book on a desk under one lamp. It is a way to get the cover
lit correctly, not the set of the film. Three cinematic runs that stayed on that desk all
read as a good product shot rather than a film (Axton's review, 2026-09-28: “场面不够宏大”).

- **At least three worlds beyond the table.** Build them from the narration and the
  asset: a doorway at architectural scale, a corridor or landscape, a sky, a city, a
  canyon grown out of a crack on the cover. The desk may be one world; it is not the film.
- **A scale ladder.** Include at least one extreme wide where something is tiny against
  something vast (a figure or the book before a door ten times its height, the camera
  rising until the room becomes a speck), and at least one macro. Cut between them;
  the jump in scale is what reads as epic.
- **The camera travels.** Crane up, fly through a doorway, drop from the sky onto the
  object. One move per world that could not be done on a tabletop.
- **The asset is the destination, not the location.** The real cover appears at the
  reveals and the end (see [directing.md](directing.md#density-a-new-idea-every-bar));
  between them the film travels through worlds the cover implies.
- **No stretch longer than two bars in one world** unless the viewer is reading.

## The first two seconds

The opening is the strongest moment in the piece, not a warm-up. Within two seconds the
viewer should see something specific and moving that belongs only to this subject:
the user's real book cover snapping into frame, a screenshot slicing open, the key word
of the narration slamming in on the first downbeat. No logo sting, no slow fade from
black, no establishing drift. If the first frame alone could open any other video, redo it.

## Music first, picture on the grid

1. Make 3–4 keyframe stills first (opening, turn, payoff, end card), or take the key
   images from `inputs/assets/`. When music is generated, pass them to
   `scripts/music.mjs` with `--ref` so the track follows the picture's mood, colour
   temperature and texture instead of a generic trailer bed. References steer style
   only; they do not make the music land on cuts.
2. Decide the music before the timeline: generate or choose a track, then measure its
   real tempo and beats with `scripts/beats.mjs`. A requested BPM is a hope; the
   measured grid is the contract, and it is what the cuts are timed to.
3. Lay the narration on that grid (see [rendering.md](rendering.md#audio-first-workflow)).
   Place the main sections so that big changes land on downbeats and key words fall on
   or just after a strong beat.
4. Only then write the full scene. Keep one timeline object in `scene.html` holding section
   starts, beat times and hit points, and derive every animation time from it. Do not
   type ad hoc seconds into individual animations.
5. Cut and hit on strong beats, but not on every beat. Give the viewer time to read what
   matters; a film that changes on each beat reads as noise.

## Every visible action has a sound

A landing, a slide, a cut, a paper fold, a click: each gets a sound that matches its
material. Use the user's own recordings from `inputs/sfx/` first when they exist; otherwise
`scripts/sfx.mjs` synthesizes a small starter set (whoosh, impact, tick, paper, riser,
sparkle). Either way, measure each file's peak into `sfx.json` and put the **peak** on the
beat, not the file start ([rendering.md](rendering.md#audio-first-workflow), step 6).
Keep a short list in `brief.md` of `time → action → sound` and check that every row is in
the final mix. Plan at least one near-silence before the turn or the final reveal; the first
sound after it should be one of the most important in the piece.

- **Riser → impact → sparkle** is the phrase for the biggest moment (the reveal, the end
  card): a riser whose peak lands on the hit, the impact on the hit itself as the loudest
  sound of the film, and a sparkle 0.5–0.8 s later as the tail. Use it once or twice, not on
  every cut.
- **No machine-gun repeats.** Two effects of the same kind are at least 150 ms apart. When one
  sound repeats, alternate two samples (two seeds, or two user files), or vary each repeat by
  ±2 semitones and ±2 dB (`sfx.mjs --place … --semitones 2 --gain-db -2` keeps the peak on the
  target). When hits come too fast to count, replace them with one continuous swoosh.

## One motif, from the material

Choose one concrete visual motif that comes from the content or the user's assets and
carry it through the whole piece: the spine line of the book cover becoming a cut, the
course's grid turning into a road, a highlighted phrase from the screenshot reappearing
as the title. The motif changes state across the film; it is not decoration.

Avoid generic trailer language that could belong to anyone: drifting gold particles,
radiating light bursts, stacked lens flares, cyber-neon grids, spinning 3D logos.
If one of these genuinely comes from the material, use it once, with intent.

## Pace: cut more, dwell less

- Default to one new picture idea per bar, with the real asset on screen for no more than about
  a third of the film; the rules and the scene list are in
  [directing.md](directing.md#density-a-new-idea-every-bar).
- Default to short shots and more cuts than an explainer would use. A single shot rarely
  needs more than two or three seconds unless the viewer is reading.
- Hold only where reading is required. A Chinese line needs roughly one second per four
  or five characters plus a beat to settle; an English line about one second per fifteen
  letters plus a beat. A title card deserves a real hold.
- Vary the speed: at least one clear acceleration and one breath.
- Transitions come from motion, not dissolves: fast push-ins, whip pans with the next
  shot entering from the direction of travel, a match on the motif's shape. Hard cuts on
  the beat are the default; pick one or two signature forms from
  [transitions.md](transitions.md) for the whole piece and write each seam's form in the
  scene list.

## Finish with restraint

Motion blur and film grain help only in small amounts. Blur the fast moves (a whip, a
snap) and leave holds sharp. Keep grain lighter on light grounds and never so heavy
that real assets lose legibility. Loud vignettes, chromatic aberration and shake are
seasoning for one moment, not a coat of paint. The numbers (full-frame impacts, light
effects, one hero device, one camera move at a time) are in the
[restraint budget](directing.md#restraint-budget).

## Real assets stay real

Book covers, course covers, screenshots and logos from `inputs/assets/` keep their
pixels, text and proportions. Allowed: scale, position, crop, rotation of the whole
asset, masks that reveal it, and light or shadow over the whole asset. Not allowed:
redrawing it, restyling its artwork, changing its words or recoloring its brand marks.
The film's own typography and any standalone author credit follow `brand.json`.
When `brand.json` sets `display_name`, do not push the camera onto, crop to, or otherwise
feature other names printed on an asset (for example a legal name on a book cover): show
the asset whole or frame its title and artwork instead.

## The 3D route (default for cinematic)

Flat layers that slide and scale read as a 2D cartoon however well they are paced. Film
quality comes from light behaving physically: a key light raking across a laminated cover,
a rim separating the object from the dark, soft shadows, depth of field and motion blur.
Start from [three-template.html](three-template.html) and render with `--gpu`
(setup and flags in [rendering.md](rendering.md#3d-route-threejs)).

- **Real assets become real objects.** Map the actual cover image onto the front of a 3D
  book (spine and back only when those images exist, otherwise a neutral material); take
  the width from the image's own proportions. Screenshots can become lit panels, logos a
  thin extruded plate. The pixels stay untouched; light, shadow and lens act on them.
- **Move through space, not across it.** Dolly toward the object past out-of-focus
  foreground shapes, orbit to reveal the spine or the side, crane down onto the desk, whip
  to the next beat. Parallax between foreground, subject and background is what tells
  the eye that the space is real.
- **Pull focus as a cut.** Rack from a background or foreground element to the hero on a
  key word; let depth of field decide what the viewer reads. Keep the hero sharp on holds.
- **Let light do the reveal.** Sweep the key light across the cover so a highlight travels
  over the title; bring a rim up behind the object on the turn; open a light source (a
  door, a practical, a screen) for the final reveal. Only speculars and practicals should
  bloom; never let a highlight wash out the real asset's title for more than a moment.
- **Motion blur where motion is.** Fast moves (whips, slams) get sub-frame motion blur;
  holds stay sharp. The template counts on-screen movement and uses more sub-frames only
  when something moves.
- **One effect built from the material.** Shader work (a cover's concrete block lifting
  out in 3D, a crack opening with light inside, a page turning) belongs to the motif from
  the content, used once with intent, not as generic decoration.

**Performance budget.** Work low, finish high. Check stills first (`--still`, 640×360,
`--query "subframes=1&grain=0"`), then a motion preview at half size with a few
sub-frames and no grain, and only then the final at the fixed defaults with full motion
blur and grain. Report `gl_renderer`: if it says SwiftShader, the GPU was not used and
renders are several times slower. Measured costs are in
[rendering.md](rendering.md#3d-route-threejs).

## Motion tokens

When cinematic is the look itself (the 3D route with no other style named), start from these values. Layered on another style, that style's tokens apply. How to use them: [styles.md](styles.md#motion-tokens).

- cadence: on 1s, with sub-frame motion blur on fast moves
- enter / exit: 18–30 f / 8–12 f (camera moves / whips)
- ease: cubic-bezier(0.65, 0, 0.35, 1) (in) / cubic-bezier(0.8, 0, 0.9, 0.4) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 0.8 s   end hold: ≥ 2.0 s

## Before delivery

- Watch the full piece once at speed with sound (or state that audio was not auditioned).
- Run `scripts/contact.mjs` on the preview (with `--beats`, `--asset` for each real asset and
  `--scenes` = the number of scene-list rows) and look at the sheet. For each frame, answer:
  would I stop scrolling here? Replace the weakest one or two pictures, at most two rounds.
  Fewer distinct scenes than 70% of the scene list, or an asset on screen in more than half the
  samples, is a warning: write it into `brief.md` with the numbers. It is a proxy measure and
  never blocks delivery. See [rendering.md](rendering.md#contact-sheet-self-check).
- Independent review against [aesthetic-rules.md](aesthetic-rules.md), one fix round, as in
  [review.md](review.md).
- Close looks at the first two seconds and the ending.
- Loudness near −14 LUFS with no clipping; narration clear over music.
- Every sound in the `time → action → sound` list is present; no silent visible action.
