import { Router } from "express";
import { runGenerate } from "../pipeline/generate.js";
import { getAdapter } from "../adapters/index.js";

const router = Router();
const MAX_REQUEST_LENGTH = 4000;
const MAX_ANSWER_LENGTH = 1000;
const VALID_LEVELS = ["auto", "quick", "super", "expert"];

router.post("/", async (req, res) => {
  const { request, targetModel, mode, level, interview, answers, regenerate } = req.body ?? {};

  if (typeof request !== "string" || !request.trim()) {
    return res.status(400).json({ error: "A request description is required." });
  }
  if (request.length > MAX_REQUEST_LENGTH) {
    return res.status(400).json({ error: `Request is too long (max ${MAX_REQUEST_LENGTH} characters).` });
  }
  if (!["fast", "deep"].includes(mode)) {
    return res.status(400).json({ error: "mode must be 'fast' or 'deep'." });
  }
  if (level !== undefined && !VALID_LEVELS.includes(level)) {
    return res.status(400).json({ error: "Invalid level." });
  }
  try {
    getAdapter(targetModel);
  } catch {
    return res.status(400).json({ error: "Unknown target model." });
  }

  const cleanAnswers = Array.isArray(answers)
    ? answers
        .filter((a) => a && typeof a.question === "string")
        .map((a) => ({
          question: a.question.slice(0, 300),
          answer: typeof a.answer === "string" ? a.answer.slice(0, MAX_ANSWER_LENGTH) : "",
          default_if_skipped: typeof a.default_if_skipped === "string" ? a.default_if_skipped.slice(0, 300) : "",
        }))
    : [];

  let cleanRegenerate;
  if (regenerate && (regenerate.direction === "simpler" || regenerate.direction === "stronger")) {
    if (typeof regenerate.previousPrompt === "string" && regenerate.previousPrompt.trim()) {
      cleanRegenerate = {
        direction: regenerate.direction,
        previousPrompt: regenerate.previousPrompt.slice(0, 8000),
      };
    }
  }

  try {
    const result = await runGenerate({
      request: request.trim(),
      targetModel,
      mode,
      forcedLevel: level,
      interview: interview && typeof interview === "object" ? interview : undefined,
      answers: cleanAnswers,
      regenerate: cleanRegenerate,
    });
    res.json(result);
  } catch (err) {
    console.error("generate error:", err);
    res.status(502).json({ error: "Prompt Architect couldn't generate a prompt right now. Please try again." });
  }
});

export default router;
