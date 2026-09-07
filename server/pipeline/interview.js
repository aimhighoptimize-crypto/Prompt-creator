import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { client, ENGINE_MODEL } from "../anthropicClient.js";
import { InterviewSchema } from "./schemas.js";

const MAX_QUESTIONS = { fast: 2, deep: 4 };

const SYSTEM_PROMPT = `
You are the interview stage of Prompt Architect, a tool that turns a rough
request into a precise, model-optimized AI prompt.

Your only job right now: figure out what the user is actually trying to
accomplish, and decide whether any clarifying questions are worth asking
before a prompt gets written.

The test for every candidate question: "Would different answers to this
question materially change the generated prompt?" If no, do not ask it. Never
ask something the user already answered in their own request. Never ask a
question just because it's the kind of thing a form would ask.

Write every question in ordinary language — no prompt-engineering or AI
terminology. Every question needs a sensible default so the system can
proceed even if the user skips it.

Mode-specific ceiling (a hard cap, not a target — ask fewer if fewer are
truly needed):
- fast mode: at most 2 questions, and only ones that are genuinely blocking.
- deep mode: at most 4 questions, ranked by how much they'd actually change
  the output.

If the request already contains enough information to produce a strong
prompt, return zero questions and set can_generate_immediately to true.
`.trim();

export async function runInterview({ request, targetModel, mode }) {
  const response = await client.messages.parse({
    model: ENGINE_MODEL,
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: zodOutputFormat(InterviewSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Target AI model this prompt will be used with: ${targetModel}\nInterview mode: ${mode}\n\nUser's rough request:\n"""\n${request}\n"""`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Interview stage failed to produce a structured result.");
  }

  const result = response.parsed_output;
  const cap = MAX_QUESTIONS[mode] ?? MAX_QUESTIONS.fast;
  result.questions = result.questions.slice(0, cap);
  if (result.questions.length === 0) {
    result.can_generate_immediately = true;
  }
  return result;
}
