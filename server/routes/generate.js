import { Router } from "express";
import { randomUUID } from "crypto";
import { runGenerate } from "../pipeline/generate.js";
import { validateGenerateInput } from "../pipeline/validate.js";
import { checkPassword } from "../pipeline/auth.js";
import { createLocalJob, runLocalJob } from "../pipeline/localJobs.js";

const router = Router();

router.post("/", async (req, res) => {
  if (!checkPassword(req.get("x-app-password"))) {
    return res.status(401).json({ error: "Wrong password." });
  }

  const { error, value } = validateGenerateInput(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const jobId = randomUUID();
  createLocalJob(jobId);
  runLocalJob(jobId, runGenerate(value));
  res.status(202).json({ jobId });
});

export default router;
