import { Router } from "express";
import { runInterview } from "../pipeline/interview.js";
import { getAdapter } from "../adapters/index.js";

const router = Router();
const MAX_REQUEST_LENGTH = 4000;

router.post("/", async (req, res) => {
  const { request, targetModel, mode } = req.body ?? {};

  if (typeof request !== "string" || !request.trim()) {
    return res.status(400).json({ error: "A request description is required." });
  }
  if (request.length > MAX_REQUEST_LENGTH) {
    return res.status(400).json({ error: `Request is too long (max ${MAX_REQUEST_LENGTH} characters).` });
  }
  if (!["fast", "deep"].includes(mode)) {
    return res.status(400).json({ error: "mode must be 'fast' or 'deep'." });
  }
  try {
    getAdapter(targetModel);
  } catch {
    return res.status(400).json({ error: "Unknown target model." });
  }

  try {
    const result = await runInterview({ request: request.trim(), targetModel, mode });
    res.json(result);
  } catch (err) {
    console.error("interview error:", err);
    res.status(502).json({ error: "Prompt Architect couldn't process that request right now. Please try again." });
  }
});

export default router;
