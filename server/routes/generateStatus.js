import { Router } from "express";
import { checkPassword } from "../pipeline/auth.js";
import { getLocalJob } from "../pipeline/localJobs.js";

const router = Router();

router.get("/", (req, res) => {
  if (!checkPassword(req.get("x-app-password"))) {
    return res.status(401).json({ error: "Wrong password." });
  }

  const jobId = req.query.jobId;
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Missing jobId" });
  }

  res.json(getLocalJob(jobId));
});

export default router;
