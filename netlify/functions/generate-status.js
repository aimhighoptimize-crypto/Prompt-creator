import { getStore } from "@netlify/blobs";
import { checkPassword } from "../../server/pipeline/auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (!checkPassword(req.headers.get("x-app-password"))) {
    return json({ error: "Wrong password." }, 401);
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return json({ error: "Missing jobId" }, 400);
  }

  const store = getStore("prompt-architect-jobs", { consistency: "strong" });
  const job = await store.get(jobId, { type: "json" });

  return json(job || { status: "pending" }, 200);
};

export const config = { path: "/api/generate-status" };
