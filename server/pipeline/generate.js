import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { client, ENGINE_MODEL } from "../anthropicClient.js";
import { GenerateSchema } from "./schemas.js";
import { getAdapter } from "../adapters/index.js";
import {
  QUALITY_DEFINITION,
  COMPONENT_LIST,
  ANTI_BLOAT_TEST,
  LEVEL_DEFINITIONS,
} from "./rubric.js";

function buildSystemPrompt(adapter) {
  return `
You are the generation engine of Prompt Architect. Given a user's rough
request, you produce a precise, model-optimized prompt for them to use with
another AI model — you do not answer the request yourself.

The product's core promise: better outcomes, not longer prompts. A padded,
"sophisticated-sounding" prompt that isn't more effective is a failure, even
if it scores well on vibes.

Do this work internally, in order, before producing your final answer:
1. Interpret the user's real underlying goal (not a literal restatement).
2. Decide the prompt level (quick/super/expert) using the definitions below —
   unless the user forced a specific level, in which case use that one and
   explain what changes at that level for this task.
3. Select ONLY the components that materially help THIS request, using the
   component list and its necessity test below.
4. Apply the target model's adapter guidance below — this must produce a
   prompt that is actually structured differently for different models, not
   a cosmetically relabeled copy. Never invent a model capability that isn't
   in the adapter guidance.
5. Draft the prompt.
6. Critique your own draft against the quality definition below. Find real,
   specific weaknesses — quote the problematic text where you can. A draft
   with no genuine weaknesses is rare; be skeptical of your own first pass.
7. Revise to fix exactly the weaknesses you found. Do not rewrite parts that
   were already fine just to make the prompt look different. Stop after at
   most 2 revision passes — if the first revision is strong, stop there.
8. Run the anti-bloat pass below on the revised draft.
9. Score the final prompt honestly across every category. A prompt that
   still has a real limitation should not score 95+. Never rubber-stamp with
   uniform high scores — if you can't find a real weakness at this point,
   say so explicitly in limiting_factor rather than defaulting to vague
   praise.
10. Explain the FINAL prompt in plain English — one line per component
    actually used, written about what THIS prompt specifically does, never a
    generic definition of what that kind of component usually does.

=== QUALITY DEFINITION ===
${QUALITY_DEFINITION}

=== PROMPT LEVELS ===
${LEVEL_DEFINITIONS}

=== COMPONENT SELECTION ===
${COMPONENT_LIST}

=== ANTI-BLOAT PASS ===
${ANTI_BLOAT_TEST}

=== TARGET MODEL: ${adapter.displayName} (adapter confidence: ${adapter.confidence}) ===
Guidance to apply:
${adapter.guidance.map((g) => `- ${g}`).join("\n")}

Avoid:
${adapter.avoid.map((a) => `- ${a}`).join("\n")}
${adapter.importantLimitation ? `\nImportant limitation: ${adapter.importantLimitation}` : ""}

Set model_adapter_used to "${adapter.id}".
`.trim();
}

function buildUserContent({ request, mode, forcedLevel, interview, answers, regenerate }) {
  const parts = [];

  parts.push(`User's original rough request:\n"""\n${request}\n"""`);
  parts.push(`Interview mode used: ${mode}`);

  if (interview) {
    parts.push(
      `Earlier interpretation from the interview stage — archetype: ${interview.archetype}, complexity: ${interview.complexity}, interpreted goal: "${interview.interpreted_goal}". Treat this as a starting point, not a fixed conclusion — refine it if the answers below change the picture.`
    );
  }

  if (answers && answers.length > 0) {
    const lines = answers.map(
      (a) => `Q: ${a.question}\nA: ${a.answer && a.answer.trim() ? a.answer.trim() : `(skipped — use default: "${a.default_if_skipped}")`}`
    );
    parts.push(`Clarifying question answers:\n${lines.join("\n\n")}`);
  } else {
    parts.push("No clarifying questions were needed or answered — work from the request as given.");
  }

  if (forcedLevel && forcedLevel !== "auto") {
    parts.push(
      `The user explicitly requested the "${forcedLevel}" level. Use it — do not override with your own recommendation — but still explain why it fits (or its real tradeoffs) in level_reason.`
    );
  } else {
    parts.push("No level was forced — recommend the level yourself based on the task.");
  }

  if (regenerate) {
    const direction =
      regenerate.direction === "simpler"
        ? "The user found the previous result too complex or long. Produce a genuinely SIMPLER version for the same underlying request — drop to a lower level if that's what simpler actually requires, and remove components rather than just shortening sentences."
        : "The user wants a STRONGER, more rigorous version for the same underlying request. Add only components that would genuinely improve reliability for this task — do not just make it longer.";
    parts.push(`${direction}\n\nPrevious generated prompt for reference:\n"""\n${regenerate.previousPrompt}\n"""`);
  }

  return parts.join("\n\n");
}

export async function runGenerate({
  request,
  targetModel,
  mode,
  forcedLevel,
  interview,
  answers,
  regenerate,
}) {
  const adapter = getAdapter(targetModel);

  const response = await client.messages.parse({
    model: ENGINE_MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "high",
      format: zodOutputFormat(GenerateSchema),
    },
    system: buildSystemPrompt(adapter),
    messages: [
      {
        role: "user",
        content: buildUserContent({ request, mode, forcedLevel, interview, answers, regenerate }),
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Generation stage failed to produce a structured result.");
  }

  return response.parsed_output;
}
