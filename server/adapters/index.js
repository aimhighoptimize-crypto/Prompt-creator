import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADAPTER_IDS = ["claude", "chatgpt", "gemini", "perplexity", "grok"];

const adapters = new Map();
for (const id of ADAPTER_IDS) {
  const raw = readFileSync(join(__dirname, `${id}.json`), "utf-8");
  adapters.set(id, JSON.parse(raw));
}

export function listAdapters() {
  return ADAPTER_IDS.map((id) => ({ id, displayName: adapters.get(id).displayName }));
}

export function getAdapter(id) {
  const adapter = adapters.get(id);
  if (!adapter) {
    throw new Error(`Unknown model adapter: ${id}`);
  }
  return adapter;
}
