# Cel anime

Graphic shading, deliberate poses, and cinematic staging give drawn scenes emotional weight. Read
`directing.md` for the shared meaning and continuity approach.

## When to choose it

Useful for anticipation, a personal realization, a journey, a decisive choice, or an explanation that benefits
from directing attention through a subject's point of view. It can combine quiet observation with a
concentrated burst of meaningful action.

Less useful for dense dashboards or processes that demand uninterrupted spatial comparison. Dramatic treatment
should not imply danger, certainty, or personal experience that the source does not contain.

## Construct the scene

Design original characters, objects, and settings rather than borrowing a recognizable character or
reproducing a named creator's style. Define proportions and identifying features that remain stable across
frontal, side, and close-up views.

Use clean contours, flat color regions, and a purposeful family of shadow shapes. Keep light direction
coherent within a scene. A moving highlight or changing shadow should follow a change in form, viewpoint, or
lighting rather than decorate the frame.

Separate foreground, subject, and background when depth matters. Painted-looking backgrounds can be
approximated with layered vector shapes or stable procedural textures; generated imagery is optional, not a
prerequisite.

Canvas, SVG, and layered HTML can support graphic scenes. WebGL is an option when camera perspective
materially helps. Plan the visible poses before constructing a complicated rig; a well-composed held drawing
can do useful narrative work.

## Movement grammar

Use selective animation: a gaze shifts, a hand tightens, fabric settles, or a subject turns toward something
newly understood. A held pose can contain a moving detail without making the entire image float.

Contrast observation with action when the story warrants it. Anticipation establishes the target; a decisive
pose carries the action; the aftermath shows what changed. Choose temporal sampling intentionally instead of
reducing frame rate indiscriminately.

Use establishing views, reaction views, or close-ups for their narrative function. Maintain screen direction
across cuts unless a visible transition reorients the viewer. Parallax reveals depth; it should not make a
still subject seem to slide through space.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 3s for character acting (camera and effects on 1s)
- enter / exit: 6–10 f / 4–8 f
- ease: cubic-bezier(0.12, 1.2, 0.25, 1.05) (in) / cubic-bezier(0.8, 0, 0.9, 0.3) (out)
- overshoot: ≤ 4%   squash-stretch: ≤ 6%
- reading hold: ≥ 0.8 s   end hold: ≥ 1.2 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Hard shadow shapes.** One hard-edged shadow 20–30% darker and an optional highlight shape, drawn per pose rather than computed per frame.
- **Smear frame.** On the fastest 1–2 frames of a swing, one smear drawing stretched 1.5–3× along the motion replaces the pose.
- **Living holds.** In a held pose only hair or cloth moves, on 3s, by 1–3 px; everything else holds.
- **Background pan.** Backgrounds pan on 1s at a steady 60–200 px per second while characters stay on 3s.

## Sound

Optional environmental sound, a pause, or a brief accent can support a change of focus. Do not assume an
orchestral soundtrack or voiced performance will be generated.

## Common failures

- Dramatic camera moves surround a subject with no readable intention or action.
- Facial features or costume details change between views.
- Cel shading becomes a global posterization filter with inconsistent light.
- Every moment uses speed lines, glowing effects, or an equally intense reaction.

## Transferable prompt

> Stage [source idea] as an original cel-shaded animated scene about [subject]. Establish [situation], direct
> attention to [decisive detail], and show [meaningful change] through clear poses and selective motion. Keep
> design and lighting coherent. Use [viewpoint or framing] to clarify the subject's realization, then let
> [aftermath] communicate the result. Build the scene without depending on generated images.
