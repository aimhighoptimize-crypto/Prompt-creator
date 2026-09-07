import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment. Never expose this client
// or the key to the frontend — all calls happen server-side.
export const client = new Anthropic();

export const ENGINE_MODEL = "claude-opus-5";
