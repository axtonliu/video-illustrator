# Explanation design

The most important directing decision in an explainer is **how each idea will be made understood**. Facts, footage and polish cannot rescue an idea shown the obvious way; the result is a plain science video with no character. So before any script line is written, the director designs the explanations, and the plan is written to `explain.json` and checked with `scripts/explain.mjs`.

Two things are designed:

1. **One signature idea for the whole episode**: the single image or framing that organizes everything and that people remember afterwards. It is the episode's own way in, the thing a viewer would retell. Examples: explaining an article about AI and human judgement with a block of cheese; explaining the new Tesla Roadster's two stunts (hanging upside down, jumping with jets) as "two answers to one question: four palm-sized contact patches can only grip so hard".
2. **For each concept the viewer must understand, one explanation and one demonstration.** An explanation makes the *why* click, usually by mapping it to something already understood or by making the invisible visible. A demonstration shows that it really happens: real footage, a reading on a gauge, an experiment, a simulation. An episode with explanations but no demonstrations feels like a lecture; one with demonstrations but no explanations is a highlight reel. Each concept gets both.

These ideas have to come from the process, not from waiting for inspiration: generate many candidates on purpose, then choose by stated criteria, then let a clean-context reviewer try to beat the choice.

## Procedure

1. **List the concepts.** From the angle and the fact table, write the three to six concepts the viewer must understand to reach the payoff. For each, write why it is hard: invisible (air pressure, a force, data in flight), abstract (a relationship, a trade-off), out of human scale (4,700 kg, 0.81 s, a nanometre), counterintuitive (sticking to a ceiling), or a claim that needs proof.
2. **Diverge.** For each concept write at least six candidates from at least four families in the library below, and at least two that are not in the library at all. Each candidate is one sentence of what the screen shows, plus the moment it clicks for the viewer. Do not judge yet; volume first. A candidate that is only a label ("use an analogy") is not a candidate.
3. **Find the signature idea.** Write at least five candidates. A good one connects every concept, can be seen in the picture rather than only said, comes back and turns at the end, belongs to this topic only (swap test: put another topic in its place; if it still works, it is too generic), and works as a thumbnail.
4. **Converge.** For each concept choose the explanation and the demonstration, and say why against these criteria, in this order:
   - **Correct.** Where does the analogy break? Say it, on screen if a viewer could be misled.
   - **Vivid.** Describe the picture to a twelve-year-old in one sentence. Do they see it?
   - **Specific.** Would this device fit any topic? Then it is weaker than one that only fits this one.
   - **Real where possible.** A demonstration from real footage (official, licensed) beats an animation of the same thing.
   - **Makeable.** Can it be built with the available renderer, footage and time? If not, keep it as a runner-up and say what it would need.
5. **Review.** Give the concept list, all candidates and the choices to a clean-context reviewer (a subagent with no part in the choice). Its task is to propose a better explanation or demonstration for each concept and a better signature idea, or to say why the choice already wins. Revise once, record what changed in `explain.json` `review`.
6. **Write the script around the choices.** Every chosen device lands on named script lines (`"lines": ["s2:6"]`), and the picture note under that line names it. Run `node scripts/explain.mjs --check explain.json --script script.md` before footage or scene work.

## Library

Families, the concept types they suit, and how they fail. The family key in parentheses is what `explain.json` uses.

**Make the invisible visible (`visible`)**: for forces, flows, hidden parts.
- Exploded view: lift the parts apart and label them; suits "what is it made of and what does each part do". Fails when the parts are labelled but their roles are not narrated over them.
- Cutaway or X-ray: see inside without taking apart; suits hidden mechanisms inside a familiar shell.
- Particles and streamlines: air, current, data or money as moving dots along their path; suits "where does it go". Fails when the flow is decorative and not tied to the sentence.
- Force arrows and a force ledger: arrows whose lengths add up; suits balance, limits and "which is bigger". Fails when lengths are not to scale with the numbers said.
- Colour fields: pressure, heat, load as colour on the object.

**Map it to something familiar (`analogy`)**: for abstract relationships.
- Everyday analogy: a balloon let go for jet thrust, a suction cup for downforce, cheese for an argument. The best are physical objects the viewer has handled. State where the analogy stops.
- Personification: the parts as characters with a job and a motive; suits systems of agents, queues, negotiations.
- Toy or tabletop model: the mechanism at desk scale with ordinary objects.

**Make the number felt (`scale`)**: for anything outside human scale.
- Rescale: shrink or enlarge to a scale the body knows (four contact patches each the size of a palm).
- Convert to a sensation: 3.4 g becomes "three times your body weight pressing on your back".
- Side-by-side: put it next to something known (a car's weight against its downforce, as stacked cars).
- Back-of-envelope on screen: write the arithmetic as it is said, with the estimate labelled.

**Compare and counterfactual (`contrast`)**: for cause and condition.
- With and without: the same scene with the part switched off.
- Push to the extreme: what happens upside down, at zero speed, at ten times the load.
- Escalate step by step: one car, then three, then five.
- Before and after, or the old way against the new.

**Break the process down (`process`)**: for sequences.
- Step tags on real footage, slowed down: stick, release, flip, land.
- Follow one particle or one request through the whole system in one shot.
- Timeline or state diagram.

**Show it really happens (`demo`)**: for proof.
- Official or licensed footage at the moment it happens, with a step tag.
- A close-up of the reading that proves it (the downforce gauge at 4,698 kg).
- Real picture and diagram on the same screen: footage in a card on one side, the 3D on the other, saying the same thing at the same time.
- An experiment or a faithful simulation when no footage exists, labelled as a simulation.

**Frame the story (`narrative`)**: for the episode's shape, mostly for the signature idea.
- A question the opening raises and the ending answers.
- A dual structure: two phenomena as two answers to one question.
- A callback: the opening image returns at the end with its meaning changed.

## Matching concept types to families

| The concept is about | Start with |
|---|---|
| Structure, parts, what is inside | `visible` (exploded view, cutaway), then `demo` |
| An invisible force or flow | `visible` (arrows, particles), `analogy`, `contrast` (switch it off) |
| A relationship or trade-off | `analogy`, `contrast`, `narrative` |
| A size, speed or amount | `scale`, then `demo` with the reading |
| A sequence of events | `process`, `demo` |
| A claim that might be marketing | `demo`, `scale` (back-of-envelope), and say who claims it |

## `explain.json`

Shortened here to one concept with three candidates; a real plan has six or more per concept, as the checker requires.

```json
{
  "topic": "The new Tesla Roadster hangs upside down and jumps with jets",
  "signature": {
    "candidates": [
      { "idea": "Two stunts, one question: four palm-sized contact patches can only grip so hard", "why": "both stunts are ways round the tyre limit" },
      { "idea": "A car with a vacuum cleaner and a fire extinguisher", "why": "playful, but undersells the physics" }
    ],
    "chosen": 0,
    "swap_test": "Another car could not carry it: only this one beats the tyre limit from both ends.",
    "appears": ["s1:5", "s6:2"]
  },
  "concepts": [
    {
      "id": "c2",
      "concept": "The fans press the car onto the road, even when it is standing still",
      "hard_because": "air pressure is invisible and the effect is counterintuitive",
      "candidates": [
        { "family": "visible", "device": "Particles drawn from under the floor into the fans, arrows of air pressure pushing down", "aha": "the arrows appear as the air leaves" },
        { "family": "analogy", "device": "A suction cup on a window", "aha": "the same thing, a car-sized suction cup" },
        { "family": "demo", "device": "Livestream close-up: the car stopped upside down, gauge at 4,698 kg", "aha": "it is not moving and does not fall" }
      ],
      "explanation": { "pick": 0, "why": "shows cause and effect together; the suction cup is the runner-up" },
      "demonstration": { "pick": 2, "why": "the official footage proves it standing still" },
      "lines": ["s3:1", "s3:2", "s3:3"]
    }
  ],
  "review": { "by": "clean-context subagent", "changes": ["concept c4: replaced a generic speed chart with three times body weight pressing on your back"] }
}
```

The checker (`scripts/explain.mjs --check`) fails when a required part is missing: fewer than five signature candidates, a concept with fewer than six candidates or fewer than four families, no `demo` candidate without a written `no_demo_reason`, explanation and demonstration picking the same candidate, or (with `--script`) a line reference that is not in the script. These are counts of what was written, not a judgement of quality; the quality comes from steps 2–5 and the review. `--md` prints the plan as a table to paste into `brief.md`.

The counting lives in `scripts/explain-check.mjs`, a file with no imports, so other tools can judge the same plan the same way. A shot director can follow the same procedure before it writes shots: it declares the plan in the same shape with shot ids in place of script lines (`concepts[].shots`, `signature.appears`) and calls `checkExplainPlan` with its own reference check. Change the library, the procedure or the thresholds here, in one place.
