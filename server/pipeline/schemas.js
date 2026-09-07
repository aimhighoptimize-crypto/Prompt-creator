import { z } from "zod/v4";

export const ARCHETYPES = [
  "writing",
  "business_strategy",
  "marketing",
  "research",
  "coding",
  "data_analysis",
  "decision_making",
  "technical_professional",
  "other",
];

export const InterviewSchema = z.object({
  archetype: z.enum(ARCHETYPES),
  interpreted_goal: z
    .string()
    .describe("One sentence: what the user is actually trying to accomplish."),
  complexity: z.enum(["simple", "moderate", "complex"]),
  recommended_level: z.enum(["quick", "super", "expert"]),
  can_generate_immediately: z
    .boolean()
    .describe("True if enough information already exists to write a strong prompt with zero questions."),
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z
          .string()
          .describe("Plain, ordinary language. No prompt-engineering jargon."),
        why_it_matters: z
          .string()
          .describe("One short clause on why a different answer would change the prompt."),
        default_if_skipped: z
          .string()
          .describe("The sensible assumption used if the user skips this question."),
      })
    )
    .describe("Only questions whose answer would materially change the generated prompt. Empty array if none qualify."),
});

export const GenerateSchema = z.object({
  interpreted_goal: z.string(),
  level_used: z.enum(["quick", "super", "expert"]),
  level_reason: z.string().describe("One sentence: why this level fits this task."),
  model_adapter_used: z.string(),
  components_used: z
    .array(
      z.object({
        name: z.string(),
        why: z.string().describe("Why THIS request needed this component, not a generic definition."),
      })
    )
    .describe("Only components actually present in the generated prompt."),
  generated_prompt: z.string(),
  critique_notes: z
    .array(z.string())
    .describe("Concrete, specific weaknesses found in the first draft, quoting the problem where possible. Never a generic 'looks good'."),
  refinements_made: z
    .array(z.string())
    .describe("What was actually changed to address the critique notes. Empty if the first draft needed no changes."),
  bloat_removed: z
    .array(z.string())
    .describe("Specific content removed or avoided during the anti-bloat pass."),
  score: z.object({
    overall: z.number().min(0).max(100),
    goal_clarity: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    context_quality: z.number().min(0).max(100),
    constraint_quality: z.number().min(0).max(100),
    output_clarity: z.number().min(0).max(100),
    ambiguity_reduction: z.number().min(0).max(100),
    model_fit: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100).describe("How close to necessity-density 1.0 — no padding, nothing missing."),
    rationale: z.string().describe("Specific reasons behind the overall score, not a restatement of the number."),
    limiting_factor: z
      .string()
      .describe("The single biggest reason this isn't a perfect score. If it genuinely is a 95+, say what would still be worth double-checking."),
  }),
  explanation: z
    .array(
      z.object({
        component: z.string(),
        text: z
          .string()
          .describe("Plain English, specific to THIS prompt's actual content — not a generic definition of the component."),
      })
    )
    .describe("One entry per component actually present in components_used. Nothing else."),
  assumptions_made: z
    .array(z.string())
    .describe("Anything the model assumed instead of asking, stated plainly for the user to correct if wrong."),
});
