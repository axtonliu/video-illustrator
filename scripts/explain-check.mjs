// The completeness check for an explanation plan, with no imports, so other tools can load this one
// file and judge a plan the same way: a shot director can declare the same plan with shot ids
// instead of script lines and call checkExplainPlan with its own reference check. It counts what was
// written (candidates, families, picks, references); it never judges whether the ideas are good.

export const FAMILIES = new Set(['visible', 'analogy', 'scale', 'contrast', 'process', 'demo', 'narrative']);
export const MIN = Object.freeze({ signature: 5, candidates: 6, families: 4 });

// refField: the concept field that names where the chosen devices land ('lines' in explain.json).
// checkRef(ref) returns null when the reference is fine, or {code, detail}; without it any non-empty
// string is accepted. The signature's references always live in signature.appears.
export function checkExplainPlan(plan, { refField = 'lines', checkRef = null } = {}) {
  const errors = [], warnings = [];
  const err = (code, where, detail) => errors.push({ code, where, detail });
  const warn = (code, where, detail) => warnings.push({ code, where, detail });
  const checkRefs = (refs, where) => {
    for (const r of refs || []) {
      if (typeof r !== 'string' || !r) { err('ref_invalid', where, `${JSON.stringify(r)} is not a reference`); continue; }
      const problem = checkRef ? checkRef(r) : null;
      if (problem) err(problem.code, where, problem.detail);
    }
  };
  const pickOk = (block, n, where, what) => {
    if (!block || !Number.isInteger(block.pick) || block.pick < 0 || block.pick >= n) { err(`${what}_pick_invalid`, where, `${what}.pick must index a candidate`); return false; }
    if (!block.why) warn(`${what}_why_missing`, where, `say why this ${what} wins`);
    return true;
  };

  if (!plan?.topic) err('topic_missing', 'topic', 'one line on what the episode explains');

  const sig = plan?.signature;
  const sc = Array.isArray(sig?.candidates) ? sig.candidates : [];
  if (!sig) err('signature_missing', 'signature', 'the episode needs one signature idea chosen from candidates');
  else {
    if (sc.length < MIN.signature) err('signature_too_few', 'signature', `${sc.length} candidates; write at least ${MIN.signature} before choosing`);
    sc.forEach((c, i) => { if (!c?.idea) err('signature_idea_missing', `signature.candidates[${i}]`, 'idea required'); });
    if (!Number.isInteger(sig.chosen) || sig.chosen < 0 || sig.chosen >= sc.length) err('signature_chosen_invalid', 'signature', 'chosen must index a candidate');
    if (!sig.swap_test) warn('signature_swap_test_missing', 'signature', 'say why another topic could not carry this idea');
    if (!sig.appears?.length) warn('signature_appears_missing', 'signature', 'name where it is seen, for example the opening and the ending');
    checkRefs(sig.appears, 'signature.appears');
  }

  const concepts = Array.isArray(plan?.concepts) ? plan.concepts : [];
  if (!concepts.length) err('concepts_missing', 'concepts', 'list the concepts the viewer must understand');
  const ids = new Set();
  for (const [i, c] of concepts.entries()) {
    const where = `concepts[${i}]${c?.id ? ' ' + c.id : ''}`;
    if (!c?.id) err('concept_id_missing', where, 'id required');
    else if (ids.has(c.id)) err('concept_id_duplicate', where, c.id);
    ids.add(c?.id);
    if (!c?.concept) err('concept_text_missing', where, 'the concept in one sentence');
    if (!c?.hard_because) warn('concept_hard_because_missing', where, 'say why it is hard to understand: invisible, abstract, out of scale, counterintuitive, or a claim');
    const cands = Array.isArray(c?.candidates) ? c.candidates : [];
    if (cands.length < MIN.candidates) err('candidates_too_few', where, `${cands.length} candidates; write at least ${MIN.candidates}`);
    const fams = new Set();
    cands.forEach((k, j) => {
      const w = `${where}.candidates[${j}]`;
      if (!FAMILIES.has(k?.family)) err('family_invalid', w, `family is one of ${[...FAMILIES].join(', ')}`); else fams.add(k.family);
      if (!k?.device) err('device_missing', w, 'one sentence of what the screen shows');
      if (!k?.aha) warn('aha_missing', w, 'the moment it clicks for the viewer');
    });
    if (fams.size < MIN.families) err('families_too_few', where, `${fams.size} families (${[...fams].join(', ') || 'none'}); use at least ${MIN.families}`);
    if (!fams.has('demo') && !c?.no_demo_reason) err('demo_missing', where, 'add a demonstration candidate, or say in no_demo_reason why none exists');
    const e = pickOk(c?.explanation, cands.length, where, 'explanation');
    const d = c?.no_demo_reason && !c?.demonstration ? false : pickOk(c?.demonstration, cands.length, where, 'demonstration');
    if (e && d && c.explanation.pick === c.demonstration.pick) err('same_pick', where, 'the explanation and the demonstration must be different candidates');
    if (!c?.[refField]?.length) err(`${refField}_missing`, where, `name the ${refField} where the chosen devices land`);
    checkRefs(c?.[refField], `${where}.${refField}`);
  }

  if (!plan?.review?.by) warn('review_missing', 'review', 'have a clean-context reviewer try to beat the choices, and record what changed');
  return { ok: errors.length === 0, concepts: concepts.length, errors, warnings };
}
