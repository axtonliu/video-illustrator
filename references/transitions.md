# Transitions

How one shot hands over to the next. Pick per seam, while writing the scene list, and put the
choice in the row's `transition in` column. Frame counts are at 30 fps and 1280×720; scale pixel
values with the frame.

## Rules

- **Hard cut is the default.** Most seams are cuts on a beat or a narration onset.
- **One seam, one form.** Never stack two (no flash inside a whip, no morph inside a fly-through).
- **Pick one or two signature forms for the film** and repeat them; nine forms in one film read as
  a demo reel. Within 30 seconds use at most four non-cut transitions. A light-peak cut also
  spends one of the two light effects in the [restraint budget](directing.md#restraint-budget);
  a whip or a fly-through that is the film's hero move counts as its one hero device.
- **Transition frames come out of the neighbouring shots.** Plan them in the scene list, so
  inserting one later does not shift every beat after it.
- **Build both shots from the same `t`.** During a transition both shots are drawn from the
  timeline, never from the previous frame, so any single frame re-renders identically.
- **Check the seam frame by frame.** Render the 10–20 frames around every non-cut seam as stills
  or a short `--duration` section; most failures (a sliver of the old shot, a blank frame, a
  jump in direction) are visible only there.

Column values: `cut`, `whip`, `focus`, `dark`, `occlude`, `light`, `window`, `morph`, `flip`.

## cut: hard cut on the beat

- **Use:** almost every seam; a new world or new idea landing on a downbeat or a measured onset.
- **Frames:** 0. The first frame of the new shot is `Math.round(beat × 30)`. The outgoing shot
  holds its last pose for at least 2 frames; the incoming shot opens already in motion (its first
  frame is partway into an entrance, not an empty stage).
- **Canvas:** switch the shot function at the beat frame; each shot computes its own local time
  from the timeline object.
- **three.js:** swap the set and camera rig at the beat frame. Keep sub-frame motion blur from
  straddling the cut: sub-frames for a frame are rendered only from the shot that owns that frame.
- **Not for:** two shots with the same subject and nearly the same framing (it reads as a glitch,
  not a cut); a cut while the viewer is still reading a line.

## whip: whip pan with motion blur

- **Use:** a fast change between two places in one world, or two parallel ideas in a quick run.
- **Frames:** both ends hold at least 12 frames; the whip itself lasts 6–8 frames, travels at
  least 1.5 frame widths and peaks at 200 px per frame or more (slower and the blur cannot hide
  the swap). Swap shots on the middle frame of the whip, where nothing is legible.
- **Canvas:** lay both shots on one strip and move the strip; for the whip frames only, draw 6–10
  copies spread along the motion over half a frame's travel at `1 / copies` alpha each.
- **three.js:** yaw the camera 40–70° with a steep ease-in-out; the template's sub-frame blur
  (`subframes` of 8 or more on those frames) produces the smear; swap sets at the midpoint.
- **Not for:** content that must be read on either side before it has held; quiet or grieving
  material; more than twice in 30 s.

## focus: focus relay

- **Use:** detail to context, foreground to background, one layer of a place to another.
- **Frames:** a 10–16 frame crossover. The outgoing subject blurs from 0 to 8 px while the
  incoming one sharpens from 8 px to 0; the incoming one starts 2–4 frames later, so the whole
  frame is never soft at once.
- **Canvas:** draw each layer with `ctx.filter = 'blur(Npx)'` from its own curve; keep text layers
  outside the blurred groups until they are meant to be read.
- **three.js:** move the depth-of-field focus distance (the template's `BokehPass` `focus`) from
  the old subject to the new over 10–16 frames.
- **Not for:** flat styles with no depth (pixel art, woodcut, halftone, flat cartoon); a frame
  whose meaning is its text.

## dark: dark-field fly-through

- **Use:** one high-energy world to the next in a dark or low-key film; one continuous take.
- **Frames:** push through the outgoing shot for 8–12 frames, travel through a dark gap for 4–8
  frames, then the incoming world grows toward the camera from about 0.6 scale and a soft blur
  for 10–14 frames. The direction of travel never reverses. The gap is never flat black: keep a
  faint gradient or drifting dust so the viewer feels motion, not a dropped frame.
- **Canvas:** scale the outgoing shot up 2–3× while it fades into the ground colour; scale the
  incoming shot 0.6 → 1 while its blur falls to 0.
- **three.js:** place the two sets along one axis with a dark occluder or tunnel between them and
  dolly one camera path through all three.
- **Not for:** light grounds; more than twice in 30 s.

## occlude: occlusion cut

- **Use:** an invisible change of world that feels like one take.
- **Frames:** a foreground object that belongs in the world (a hand, a pillar, a passing page, a
  bird) crosses the lens in 10–16 frames; the cut happens on the frame where it covers the whole
  frame, and the background may drift 20–40 px in the direction of the wipe on either side.
- **Canvas:** draw the occluder, heavily blurred along its motion, above both shots; switch shots
  when its bounds contain the frame.
- **three.js:** move a near object, well out of focus, across the lens; swap sets while it covers
  the camera.
- **Not for:** an occluder with no reason to be there; any size where a sliver of the old shot
  shows at the cut (check the cut frame).

## light: light-peak hidden cut

- **Use:** a warm or emotional turn; the approach to a reveal. Spends one light effect.
- **Frames:** light builds for 18–27 frames (ease-in), the cut sits on the brightest frame, and
  the light falls away over 30–45 frames (ease-out). A rise slower than the fall reads as a glow;
  a fast fall after a slow rise reads as a malfunction, so keep the fall the longer of the two.
- **Canvas:** two or three large soft radial gradients sweep diagonally with `screen` blending;
  at the peak lower the picture's contrast and raise its brightness (for example 0.55 and 1.35)
  so the image is burned out, not merely covered.
- **three.js:** raise a practical light's intensity and `toneMappingExposure` to the peak; bloom
  carries the burn; swap sets on the peak frame.
- **Not for:** the frames where a real asset's title must be read; a film already at its light
  budget.

## window: through a window or door

- **Use:** from an overview into one of its parts ("open this"), from a place into what it leads to.
- **Frames:** the opening (a doorway, a window, a card, a page) grows to fill the frame in 30–45
  frames, the next world visible inside it from the first frame; after passing through, settle
  for about 8 frames and hold at least a second so the new world can be read.
- **Canvas:** clip the incoming shot to the opening's path and scale the outgoing shot about the
  opening's centre, both driven by the same progress value.
- **three.js:** fly the camera through a real door or window mesh with the next set behind it;
  fade the frame geometry as it crosses the near plane.
- **Not for:** an opening unrelated to the world behind it (then it is only a decorative wipe).

## morph: shape morph relay

- **Use:** the motif or organizing device carries across two worlds and changes state.
- **Frames:** 12–20 frames. The shape keeps its place and size on screen while it turns into the
  incoming shape; everything around it cuts.
- **Canvas:** resample both outlines to the same number of points in the same order and
  interpolate; if they cannot correspond, cross-fade inside the shared silhouette only.
- **three.js:** morph targets on one mesh, or scale and rotate one object into the silhouette of
  the next while the sets swap behind it.
- **Not for:** shapes with nothing visibly in common; every sentence.

## flip: material flip

- **Use:** paper, card, cut-paper and pop-up styles; the back of the piece is the next scene.
- **Frames:** 12–18 frames for 180°, after a 4–6 frame hold; any overshoot stays within the
  style's tokens.
- **Canvas:** `scaleX = cos(θ)`, swap faces at 90°, shade each face by `0.6 + 0.4 × |cos θ|`, and
  skew slightly toward the hinge for perspective.
- **three.js:** a plane with the two shots as front and back render targets, rotated about its
  hinge edge.
- **Not for:** glossy digital or cinematic looks unless a card or page actually exists in the world.
