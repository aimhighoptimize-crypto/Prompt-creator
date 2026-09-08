import { Router } from "express";
import { runInterview } from "../pipeline/interview.js";
import { validateInterviewInput } from "../pipeline/validate.js";
import { checkPassword } from "../pipeline/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  if (!checkPassword(req.get("x-app-password"))) {
    return res.status(401).json({ error: "Wrong password." });
  }

  const { error, value } = validateInterviewInput(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await runInterview(value);
    res.json(result);
  } catch (err) {
    console.error("interview error:", err);
    res.status(502).json({ error: "Prompt Architect couldn't process that request right now. Please try again." });
  }
});

export default router;
