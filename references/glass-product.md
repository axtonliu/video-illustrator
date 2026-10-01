# Glass / light-study product film

Translucent forms are revealed through edges, reflected light and their relation to
an environment. Read `directing.md`; distinguish a concept render from real evidence.

## When it fits

Material concepts, designed objects, optics metaphors and focused feature reveals.
It supports a small number of meaningful surfaces and transformations. Avoid it
when dense verbal explanation, precise real-product operation or factual performance
claims are central. Gloss alone does not explain what an object does.

## Construct the scene

Establish a clear silhouette, plausible thickness and stable light sources. Separate
transparent body, edge highlights and what is seen through it. Give the object an
environment to reflect; detached glowing lines alone tend to look like neon wireframe.

Choose a background that preserves the important edges and internal structure.
A light studio setting is often sufficient. Keep labels independent of distortion.
If the item is a real product, use the user's real geometry or imagery where identity
matters; invented geometry must be identified as a conceptual illustration.

## Movement and camera

A light sweep should reveal curvature or thickness, not flash every surface at once.
Rotate or separate parts to disclose a feature. Keep one material behavior coherent
through the shot. A change in light or viewing angle can bridge to an internal detail.

Let the feature determine the path and reveal. An endless slow turntable may be a
valid material study but does not automatically constitute an explanatory film.
Hold the useful final view rather than moving away before its meaning registers.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 1s
- enter / exit: 24–36 f / 16–22 f
- ease: cubic-bezier(0.4, 0, 0.6, 1) (in) / cubic-bezier(0.4, 0, 1, 1) (out)
- overshoot: none   squash-stretch: none
- reading hold: ≥ 1.0 s   end hold: ≥ 2.0 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Edge light.** A 1–2 px bright rim on every glass edge, strongest where the edge faces the key light, with a 2–4 px darker inner band that shows thickness.
- **Refraction offset.** Whatever sits behind a pane is displaced 4–12 px and blurred 2–6 px, fixed per pane thickness.
- **Specular sweep.** One highlight band crosses the object once in 18–24 frames at 45°; it spends one light effect in the restraint budget.

## Sound and implementation

Optional tonal or contact accents can follow a real reveal; silence remains valid.
Use a stylized shader, procedural highlights or a suitable existing 3D renderer.
Canvas approximations are allowed but must not be sold as accurate refraction,
caustics or photoreal ray tracing. High realism may require another authorized route.

## Failure modes

- Transparency hides the object or makes internal structure unreadable.
- Highlights slide in ways that contradict the light and camera.
- Invented features appear to demonstrate a real product.
- The material spectacle consumes all the time without delivering the idea.

## Transferable prompt

> Reveal [object or concept] through a coherent glass-and-light treatment. Use
> [specific light or object movement] to expose [feature or relation]. Keep the
> silhouette and material behavior legible; conclude on [useful final view].
> Describe the achieved rendering technique honestly.
