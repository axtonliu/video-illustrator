# Oil impasto

Opaque color masses and directional paint ridges give a scene weight and tactile light.
Read `directing.md` for meaning, continuity, and source fidelity.

## When to choose it

Useful for expressive physical scenes, contrasting forces, accumulation, pressure,
and emotionally charged transformations where mass and surface matter.
Less suited to small technical labels, sparse interface demos, or exact data charts.
Rich paint should not invent intensity or emotion that contradicts the source.

## Construct the scene

Block the image with decisive opaque shapes. Define where paint is laid along a form,
where it cuts across another stroke, and where exposed ground remains. Use warm/cool
or light/dark relationships to separate planes before adding decorative texture.

Approximate ridges with stable elongated marks and consistent highlight/shadow pairs.
Canvas stroke layers can suggest raised paint; SVG or WebGL can add controlled light
response where available. Do not promise physically accurate paint thickness from a
flat texture. A stylized relief reading is enough when it serves the image.

Choose stroke scale according to the depicted form: broad passages for a large mass,
more selective marks for a face, joint, or other meaningful detail. Preserve the
subject's silhouette. Keep exact source labels on readable areas without heavy relief.

## Movement and camera

Let weight show through initiation, momentum, resistance, and settling. A heavy color
mass can press into or displace another when that physical relationship fits the idea.
Avoid turning all objects into flowing paint merely to create an easy transition.

A new state can be painted over an old one, leaving visible traces where comparison
matters. Separate surface development from object motion: paint ridges travel with
the object, while the object can rotate, bend, or move through its environment.

Use a close view to disclose tactile action, then a wider composition to show its
consequence. A controlled lighting change can reveal relief without moving the camera.
Cuts may create useful shifts of scale; constant orbiting often distracts from mass.
Allow expressive stroke rhythm without making the entire frame pulse uniformly.

## Motion tokens

Starting values for this style's motion voice, at 30 fps. Put them in the scene's timeline object and derive every entrance, exit and hold from them; how: [styles.md](styles.md#motion-tokens).

- cadence: on 2s (paint lands stroke by stroke; the camera moves on 1s)
- enter / exit: 20–30 f / 14–20 f
- ease: cubic-bezier(0.65, 0, 0.35, 1) (in) / cubic-bezier(0.7, 0, 0.84, 0) (out)
- overshoot: none   squash-stretch: ≤ 4%
- reading hold: ≥ 1.0 s   end hold: ≥ 1.8 s

## Signature craft

Techniques that belong to this medium, with starting numbers (sizes at 1280×720; scale with the frame).

- **Directional strokes.** Strokes 30–90 px long and 10–24 px wide follow the form; each keeps a fixed seeded bristle pattern of 6–12 grooves.
- **Impasto light.** One fixed light direction (for example upper left) gives every stroke a 1–2 px highlight edge and a 1–2 px shadow edge.
- **Paint-on reveal.** The image appears in painting order, 2–4 strokes per exposure on 2s, not as a finished picture fading in.

## Optional sound

A low contact, drag, or scrape can support an actual heavy or painted action.
Use available or produced sounds, keeping supplied narration intelligible. Rich color
does not itself require an orchestral soundtrack; silence can preserve visual force.

## Common failures

- Noise and emboss filters coat an otherwise unrelated flat vector animation.
- Highlights change direction independently on adjacent objects.
- Every surface ripples constantly, erasing the sense of solid weight.
- Thick texture makes faces, labels, or the decisive action difficult to recognize.

## Transferable prompt

> Express [source idea] with [subject] in stylized oil impasto. Establish opaque color
> masses and directional ridges that follow form. Show [meaningful action] through
> weight, resistance, and consequence, preserving [identity or exact distinction].
> Use surface development only where it helps the change read. Choose framing and
> consistent light to reveal the material, ending on [legible outcome].
