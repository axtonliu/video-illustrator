# Stained glass / illuminated mosaic

An image is built from bounded translucent pieces and a stable network of seams.
Light, segmentation and composition create the language. Read `directing.md` too.

## When it fits

Symbolic stories, heritage, connected communities, systems composed of distinct parts,
or a transformation made understandable by illuminating relationships. It is weaker
for fast procedural instructions, small technical text and photoreal product evidence.
Do not use recognizable sacred imagery merely as interchangeable decoration.

## Construct the scene

Make the overall subject readable before subdividing it. Seams should describe forms
or organize the composition; arbitrary cells across a weak silhouette will not repair
it. Distinguish broad structural joins from smaller internal divisions.

Use variation in translucency, color and surface character without flickering grain.
Keep the light source and surrounding frame coherent. Text can live beside the window
or in a deliberately readable panel instead of being broken into decorative fragments.

## Movement and camera

Illuminate a path or reveal connected panes to carry the source's progression. A
shifting light can expose a relationship; an assembling mosaic can show contribution
or emergence. Keep already introduced subjects recognizable as emphasis moves.

The window may remain fixed while light performs the action. If figures move inside
it, decide which seams belong to the figure and which belong to the frame. Do not
let rigid lead joints behave like liquid without an intentional transformation.
A closer view can reveal how a local piece contributes to the final whole.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 30–48 f / 20–30 f
- ease: cubic-bezier(0.37, 0, 0.63, 1) (in) / cubic-bezier(0.37, 0, 0.63, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.2 s   end hold: ≥ 2.0 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Lead came.** 4–8 px dark lines between panes with a 1 px highlight on one side; panes never overlap the lead.
- **Lit panes.** A pane lights by rising from 35% to 100% brightness over 12–24 frames; only the brightest pane blooms, by 3–6 px.
- **Travelling light.** A light moving behind the window lights panes in order of their distance from it, 2–4 frames apart.

## Sound and implementation

Optional sustained tones or small accents can accompany illumination if produced.
SVG/Canvas paths with layered transparency can create a convincing stylized result.
This does not establish accurate optical scattering or physical glass simulation.
Avoid bundling photographed windows or artwork without suitable usage rights.

## Failure modes

- Random colored polygons lack a recognizable image or explanatory relation.
- Every pane pulses simultaneously, eliminating visual hierarchy.
- Moving boundaries detach from the subject they originally described.
- Ornamental symbolism changes or overwhelms the source's actual meaning.

## Transferable prompt

> Depict [subject] as a coherent illuminated mosaic. Let [light path or assembly]
> reveal [relationship] through recognizable panes and stable structural seams.
> Use a clear hierarchy of forms; finish with [whole-image meaning] readable at rest.
