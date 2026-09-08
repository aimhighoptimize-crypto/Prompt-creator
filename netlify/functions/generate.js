import { runGenerate } from "../../server/pipeline/generate.js";
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

  if (!checkPassword(req.headers.get("x-app-password"))) {
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

  try {
    const result = await runGenerate(value);
    return json(result, 200);
  } catch (err) {
    console.error("generate error:", err);
    return json({ error: "Prompt Architect couldn't generate a prompt right now. Please try again." }, 502);
  }
};

export const config = { path: "/api/generate" };
