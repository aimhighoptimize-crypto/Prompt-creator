import { getStore } from "@netlify/blobs";
import { runGenerate } from "../../server/pipeline/generate.js";
import { checkPassword } from "../../server/pipeline/auth.js";

// Background function: up to 15 minutes of wall-clock time, far more than
// the ~15-45s a real generate call takes. It has no meaningful response —
// the caller (netlify/functions/generate.js) already returned a jobId to
// the browser, which polls generate-status.js for this function's result.
export default async (req) => {
  // Defense in depth: this endpoint is technically public (Netlify routes
  // background functions on their own URL), even though it's only ever
  // meant to be called by generate.js.
  if (!checkPassword(req.headers.get("x-app-password"))) {
    return;
  }

  const { jobId, value } = await req.json();
  const store = getStore("prompt-architect-jobs", { consistency: "strong" });

  try {
    const result = await runGenerate(value);
    await store.setJSON(jobId, { status: "done", result });
  } catch (err) {
    console.error("generate-background error:", err);
    await store.setJSON(jobId, {
      status: "error",
      error: "Prompt Architect couldn't generate a prompt right now. Please try again.",
    });
  }
};

export const config = { path: "/api/generate-background" };
