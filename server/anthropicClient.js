import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment. Never expose this client
// or the key to the frontend — all calls happen server-side.
export const client = new Anthropic();

// Sonnet 5 at moderate effort, chosen for cost — a generate call on Opus 5 at
// effort "high" ran ~$0.10-0.15 and ~75-90s in testing; this is roughly
// 3-5x cheaper and faster, with prompt caching (see generate.js) cutting
// input cost further on repeated use. Revisit if generated-prompt quality
// doesn't hold up under real use.
export const ENGINE_MODEL = "claude-sonnet-5";
