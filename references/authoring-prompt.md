# Build the execution prompt

The agent turns its selected brief into a concrete instruction for the authoring
step. This can be its own working instruction; another model invocation is optional,
not a required hidden cost. Replace brackets with actual decisions and omit clauses
that do not apply. Do not send the user an unfilled template as the final deliverable.

> Make [duration / aspect / dimensions] of animated explanation from [source passage].
> The viewer should understand [specific relationship] by the end. Preserve [facts,
> names, wording or uncertainty that matter]. The scene centers on [recognizable
> objects] and progresses through [visible events with their causal order].
>
> Use [primary style] with [specific shape/material/typographic traits]. Movement
> should follow [how those objects behave]. [Object or relation] carries across the
> stages; use [cuts/camera/holds] where they improve understanding. The final state
> reveals [payoff]. Keep labels readable at the target viewing size.
>
> Audio is [silent / supplied file and timing / explicitly requested authorized
> voice route]. Preserve the recording's timing and align meaningful changes to it.
> Use [actual renderer and local assets]. Deliver the executable scene, MP4 and brief.
> For the bundled HTML route, expose deterministic async window.renderFrame(t), load
> assets reliably, and reconstruct every frame from absolute seconds. Inspect the
> rendered result and repair observed problems before calling it complete.

## Short public entry prompts

Users should be able to give much less detail; the skill supplies the decisions above.

- "Illustrate this paragraph as a 20-second animated explanation, Chinese labels."
- "Turn this idea into an isometric short. Follow one object so I can see the process."
- "Make this passage a paper animation. Keep the argument, choose your own staging."
- "Choose the passages in this article that benefit from motion and make matching clips."
- "Keep the existing narration; redesign the visual explanation in this reference's style."

A short input does not guarantee a one-shot outcome. Preserve the actual prompt and
revisions when using an output as a public demonstration.
