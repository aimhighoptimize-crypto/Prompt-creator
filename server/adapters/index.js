// Static imports (not fs.readFileSync with a dynamic path) so serverless
// bundlers — Netlify's included — can see these files and package them with
// the function. A dynamic readFileSync path is invisible to that kind of
// static analysis and gets silently dropped from the deploy bundle.
import claude from "./claude.json" with { type: "json" };
import chatgpt from "./chatgpt.json" with { type: "json" };
import gemini from "./gemini.json" with { type: "json" };
import perplexity from "./perplexity.json" with { type: "json" };
import grok from "./grok.json" with { type: "json" };

const adapters = new Map([
  ["claude", claude],
  ["chatgpt", chatgpt],
  ["gemini", gemini],
  ["perplexity", perplexity],
  ["grok", grok],
]);

export function listAdapters() {
  return [...adapters.entries()].map(([id, adapter]) => ({ id, displayName: adapter.displayName }));
}

export function getAdapter(id) {
  const adapter = adapters.get(id);
  if (!adapter) {
    throw new Error(`Unknown model adapter: ${id}`);
  }
  return adapter;
}
