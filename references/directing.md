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
