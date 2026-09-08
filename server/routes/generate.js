import { Router } from "express";
import { runGenerate } from "../pipeline/generate.js";
import { validateGenerateInput } from "../pipeline/validate.js";
import { checkPassword } from "../pipeline/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  if (!checkPassword(req.get("x-app-password"))) {
    return res.status(401).json({ error: "Wrong password." });
  }

  const { error, value } = validateGenerateInput(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await runGenerate(value);
    res.json(result);
  } catch (err) {
    console.error("generate error:", err);
    res.status(502).json({ error: "Prompt Architect couldn't generate a prompt right now. Please try again." });
  }
});

export default router;
