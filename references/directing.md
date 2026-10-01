# Direct the change

Use with the selected style reference. These are creative heuristics, not a scoring system.

## Turn the source into something that happens

Find what the viewer should understand differently by the end. Preserve the source's
meaning and uncertainty. An illustration can simplify a mechanism; it must not invent
numbers, causal links, quotes, or evidence to make the animation more dramatic.

Select a passage that benefits from movement. A state change, accumulating effect,
comparison, journey, feedback loop, or shift in viewpoint usually offers more than a
paragraph of abstract claims. Do not try to fit the entire article into a short clip.

Write a compact direction before coding:
- **Meaning:** the specific relationship or change to convey.
- **Visible event:** what exists, what acts on it, and what the audience can observe.
- **Payoff:** the final state that makes the meaning legible.
- **Treatment:** style, framing, pacing, and any audio supplied by the user.

For example: "A queue grows because arrivals outpace service. Show incoming parcels
filling a conveyor faster than a gate releases them. End wide enough to compare the
arrival stream with the growing queue." Parcel counts are illustrative, not data.

## Make the image carry the explanation

Draw the relevant objects and relations. Use words to name what pictures cannot name
precisely. If the claim concerns particular words, show those words and their actual
relationship rather than substituting an unrelated physical metaphor.

Give the viewer a stable reference: an identifiable object, location, color role,
scale, or heading. Let attention follow a meaningful change. Background decoration
should not compete with the event that explains the idea.

A visible object needs intentional shape, proportion, silhouette, and behavior.
A rounded rectangle labeled with a noun is useful when it represents a document or
interface; it is rarely a sufficient depiction of a physical subject.

## Choose continuity deliberately

Keep object identity across a process. An item can change state without silently
becoming a different item. Let completed actions affect later states.

Use cuts when they improve comprehension: a change of scale, elapsed time, parallel
comparison, or a useful reveal. Carry a recognizable shape, motion, position, or
sound across the cut where it helps orientation. One continuous shot is an option,
not a universal goal. Avoid resetting the entire world for every sentence.

Move the camera to disclose something. Hold it still when the object motion already
explains enough. Leave time after a reveal for the viewer to understand its result.
Let pacing follow the content; do not give every beat an identical duration or ease.

## Density: a new idea every bar

For a promo, trailer or anything that must stop a stranger. A plain explainer keeps the
content's own pace.

- **One new picture idea per bar.** At 90–130 BPM a 4/4 bar lasts 1.8–2.7 s. Without measured
  music, one idea every 1.5–2.5 s. The picture leads; the narration does not get one picture
  per sentence.
- **Count distinct pictures.** A 20-second film has at least 8 pictures a stranger would see as
  different at thumbnail size. The same desk from another angle, the same cover a little closer,
  or the same shot with a new caption is not a new picture. A new world, a new subject or a new
  composition is.
- **Density is not a reset.** The organizing device from [concept.md](concept.md) and the motif
  carry across every cut, so the viewer stays oriented while the pictures change.
- **The real asset leads only at reveals and the end.** Book covers, screenshots and logos are the
  hero, but on screen for no more than about one third of the running time. Each appearance is an
  event. The rest of the time, build new worlds from elements inside the asset and images in the
  narration: the objects, places and gestures it names. The asset itself still stays
  exactly as supplied whenever it appears.
- **Big words carry the rhythm.** Key words appear word by word and land on strong beats. Only
  content words, numbers, names and hook words get big type; never function words (的, 了, the,
  of, and). Each big word enters on the measured onset of that word from `scripts/onsets.mjs`,
  within one frame (33 ms at 30 fps).
- **The scene list is the plan.** One row per bar in `brief.md`
  (`time · world / composition · new idea · device state · asset on screen · transition in`).
  If two rows describe the same picture, one of them needs a new idea. The last column names how
  this shot arrives (`cut` by default; the vocabulary is in [transitions.md](transitions.md)).

`scripts/contact.mjs` measures the result: it counts distinct pictures on the rendered preview
and estimates the asset's screen time (see [rendering.md](rendering.md#contact-sheet-self-check)).

## A subject that acts

Give the film at least one subject that performs an action with a whole arc, not only things
that slide in and stop. The subject can be a character, an object (a drawer, a key, a paper
plane) or the real asset itself (a cover tossed into frame that skids to a stop, a
screenshot that folds itself into a card). Real assets still move only as a whole: scale,
position, rotation, crop, light.

- **Anticipation**: a small move the other way, or a gathering, 3–8 frames.
- **Action**: the move itself, at the speed the style's tokens allow.
- **Follow-through**: what keeps going after the main move (loose parts, a skid, a bounce,
  dust), 4–12 frames.
- **Settle**: it comes to rest and holds at least the style's reading hold.

Mark it in the scene list's new-idea column, for example
`the key twists [act: anticipation → turn → rattle → still]`. One acting subject per film is
the minimum; a promo usually has two or three moments like this. A title that fades in, a
card that slides and stops, or a camera move alone is not an acting subject.

## Restraint budget

For a 30-second film; for a longer one multiply by duration ÷ 30 and round down (a 45 s film:
4 impacts, 3 light effects). A shorter film keeps the 30-second numbers.

- **Full-frame impacts ≤ 3.** A white flash, a whole-screen shake, a burst that fills the
  frame. Put them on the strongest hits (the turn, the reveal, the end), not on every downbeat;
  everything else animates inside the picture.
- **Light effects ≤ 2.** A sweep of light across a surface, a lens flare, a flicker, a glow
  that blooms. A transition hidden in a flash of light counts as one.
- **One device is the hero once.** A technique (a crash zoom, a paper tear, a morph, a slow
  motion) leads one moment of the film. Used again it becomes wallpaper; use it as a quieter
  supporting move or not at all.
- **One camera move at a time.** A push, a pan, a crane or an orbit, one per shot. Do not stack
  a slow floating zoom on top of another move, and do not add float to a still object to keep
  the picture busy.
- **Mark the budget in the brief.** Tag scene-list rows that spend it (`[impact]`, `[light]`,
  `[hero: crash zoom]`) and add one line under the scene list:
  `Budget (30 s): impacts 2/3 at 4.2 s, 17.9 s · light 1/2 at 12.0 s · hero device: paper tear at 8.4 s`.
- The style's own tokens set how fast things move (see [styles.md](styles.md#motion-tokens));
  this budget sets how often the loud things happen.

## Hand-made motion: poses and exposure

For drawn and hand-made styles (pencil, ink wash, whiteboard, cut paper, clay, pixel,
risograph and similar), the hand-made feel comes from how drawings change, not from
paper texture or jitter added on top of smooth motion.

- **Poses first.** Design the key poses and the breakdowns between them before any
  rig, texture or grain. A change of silhouette, a head turn or an overlap change is a
  new drawing, not a tween of the old one.
- **Exposure.** Decide how long each drawing stays on screen: on ones for fast or
  smooth action, on twos or threes for most hand-made motion, longer holds for
  reading and for weight. Keep an exposure list per action in the timeline object, and
  keep camera moves, drawing exposure and whole-object travel as separate tracks.
- **A held drawing holds its marks.** While a drawing is on screen, its strokes,
  seeded wobble and fill texture stay identical. Change the seed only when a new
  drawing starts. Continuous per-frame “boiling” is a deliberate choice for a specific
  mood, not the default.
- **Tween only compatible drawings.** Interpolate between two drawings only when their
  strokes correspond (same count, order and structure); otherwise make a replacement
  drawing.
- **Check the encoded video.** Holds and exposure read correctly only at real speed;
  review a strip of consecutive frames and the MP4, not only single stills.

Pixel art follows the same rule on its grid: discrete poses held for whole frames, no
sub-pixel smoothing of the sprite.

## Sound and construction

A silent clip should still communicate its visual idea. If user audio is supplied,
align important changes with its meaning and pauses, not arbitrary equal segments.
For a promo or trailer, sound leads: follow [cinematic.md](cinematic.md) and the
audio-first order in [rendering.md](rendering.md#audio-first-workflow).
Optional sound accents can mark contact, release, or discovery. Describe unmade
sound as a suggestion; do not imply that a silent export contains a soundtrack.

Build time-dependent animation from the render timestamp, including textures and
noise. Re-rendering a frame should preserve the world. Keep text readable at the
actual output size, and keep supplied names, quantities, and labels intact.

Review the moving result: what draws the eye first, whether causes precede effects,
whether the payoff reads before exit, and whether a cut or motion loses identity.
Repair visible problems directly. Technical export success is not visual approval.
