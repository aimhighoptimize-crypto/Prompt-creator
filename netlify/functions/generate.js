import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";
import { validateGenerateInput } from "../../server/pipeline/validate.js";
import { checkPassword } from "../../server/pipeline/auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const password = req.headers.get("x-app-password");
  if (!checkPassword(password)) {
    return json({ error: "Wrong password." }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { error, value } = validateGenerateInput(body);
  if (error) {
    return json({ error }, 400);
  }

  const jobId = randomUUID();
  const store = getStore("prompt-architect-jobs", { consistency: "strong" });
  await store.setJSON(jobId, { status: "pending" });

  // Netlify queues background-function invocations and responds fast — this
  // await does not wait for the actual generation to finish, just for the
  // platform to accept the job.
  const backgroundUrl = new URL("/api/generate-background", req.url);
  await fetch(backgroundUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": password || "" },
    body: JSON.stringify({ jobId, value }),
  });

  return json({ jobId }, 202);
};

export const config = { path: "/api/generate" };
