// Shared quality framework, referenced by both the interview and generation
// meta-prompts so every stage judges "good" the same way. See
// docs/BLUEPRINT.md Section 4 & 5 for the full reasoning behind this.

export const QUALITY_DEFINITION = `
A 10/10 prompt is the SHORTEST instruction set that gives the receiving AI model
the highest realistic chance of producing what the user actually wants, in a
form usable without further editing, worded so no two competent readers could
reasonably produce different outputs from it.

Five essential qualities (every prompt needs all five):
1. Goal fidelity — encodes the user's real underlying objective, not a literal
   restatement of their words.
2. Sufficient grounding — every fact the model would otherwise have to guess
   is either supplied, or the prompt says explicitly what to assume.
3. Unambiguous instruction — no clause a competent, context-free reader could
   reasonably interpret two different ways.
4. Verifiable output contract — the output's shape/length/structure is
   specific enough that success or failure is checkable.
5. Model fit — plays to the target model's documented behavior instead of
   fighting it.

A prompt is only as good as it needs to be. Padding, restated constraints,
decorative personas, vague intensifiers ("be thorough", "be comprehensive"),
and instructions the target model already follows by default all actively
HURT the score — they are not neutral.
`.trim();

export const COMPONENT_LIST = `
Available prompt components — include ONLY the ones that materially improve
the likely output for THIS specific request. A simple request might need only
3-4. A complex strategic request might genuinely need 7-9+. Never include a
component just because it exists on this list.

- Role/persona — only if it changes vocabulary, judgment, or what the model
  would actually notice/recommend. Skip if purely decorative.
- Objective — always needed.
- Context (domain/user/business facts) — needed whenever quality depends on
  facts outside general knowledge.
- Inputs — the actual material the model must work from or transform.
- Constraints (must/must-not) — only for real limits implied by the request,
  never invented defensively.
- Requirements — concrete must-haves in the deliverable.
- Process guidance / task decomposition — only for multi-stage or
  multi-source tasks.
- Decision criteria — what matters most, for decision-support tasks.
- Examples — only when a genuinely representative one exists; a mediocre
  example teaches the wrong pattern.
- Output format — needed whenever the output feeds a workflow, a program, or
  needs a specific shape; skip for open-ended creative/exploratory asks.
- Tone/style — for user-facing writing tasks.
- Audience — whenever the output's audience differs from the requester.
- Evaluation criteria / definition of done — for complex deliverables where
  "good" isn't self-evident.
- Quality control / self-check instruction — only for high-stakes or
  correctness-sensitive tasks, and only if the target model doesn't already
  do this by default (check the model adapter notes).
- Edge cases — only when the task has predictable failure modes.
- Tool instructions — only when the target surface actually has tools whose
  use should be shaped.
- Success criteria — what a good outcome looks like, for ambiguous or
  open-ended asks.

For every candidate component, the real test is: "Does this improve the
likely output enough to justify its inclusion?" If not, leave it out.
`.trim();

export const ANTI_BLOAT_TEST = `
Anti-bloat pass (mandatory, run after drafting): for every sentence in the
draft, ask "If this line were deleted, would the model's likely output
change in a way the user would care about?" If no, delete it.

Actively remove: repetition, restating the same constraint in multiple
places, generic "world-class expert with 20 years of experience" persona
theater, vague intensifiers with no operational meaning, formatting
instructions with no consumer, constraints invented defensively rather than
implied by the request, and any instruction asking the model to do something
it already does by default (check the model adapter's "avoid" list).

Report exactly what you removed in bloat_removed. An empty array there
should be rare and only true if the draft genuinely had no removable content
— treat a suspiciously clean first draft with skepticism.
`.trim();

export const LEVEL_DEFINITIONS = `
Three prompt levels — pick the one the task actually needs, don't default to
the biggest:

QUICK — single-step, low-stakes, low-ambiguity requests. Objective + minimal
context + output format only. Nothing else.

SUPER — moderate complexity or stakes, some ambiguity. Role only if it
changes substance, context, objective, constraints that matter, output
format, one quality-control instruction if warranted.

EXPERT — high complexity/stakes/multi-stage deliverables (strategy,
architecture, professional long-form work). Full situational component set
AS WARRANTED — deep context, decomposed sub-tasks, constraints, audience,
evaluation criteria, examples if a good one exists, edge cases, explicit
quality control, structured output schema. Expert means more RIGOROUS, not
automatically longer — do not pad an Expert prompt with components that
don't earn their place just because the level allows more.
`.trim();
