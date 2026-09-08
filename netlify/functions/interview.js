import { runInterview } from "../../server/pipeline/interview.js";
import { validateInterviewInput } from "../../server/pipeline/validate.js";
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

  if (!checkPassword(req.headers.get("x-app-password"))) {
    return json({ error: "Wrong password." }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { error, value } = validateInterviewInput(body);
  if (error) {
    return json({ error }, 400);
  }

  try {
    const result = await runInterview(value);
    return json(result, 200);
  } catch (err) {
    console.error("interview error:", err);
    return json({ error: "Prompt Architect couldn't process that request right now. Please try again." }, 502);
  }
};

export const config = { path: "/api/interview" };
