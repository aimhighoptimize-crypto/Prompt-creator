# Prompt Architect

An AI-powered tool that turns a messy description of what you want an AI to do into a
precise, model-optimized prompt — asking only the clarifying questions that matter,
adapting to the target model, critiquing and refining its own draft, scoring the result,
and explaining the finished prompt in plain English.

**Status: V1 working prototype.** See [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) for the full
product blueprint (research, competitive analysis, quality framework, architecture, V1
scope) that this build implements.

## Running it

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
npm start
```

Open `http://localhost:3000`. No database, no accounts — the app is stateless; each
request runs the full pipeline (interview → generate → critique → refine → score →
explain) against the Claude API and returns the result.

## How it works

- `public/` — the single-page frontend (vanilla HTML/CSS/JS, no build step).
- `server/index.js` — Express server serving the frontend and two API routes.
- `server/pipeline/` — the interview and generation logic, including the shared quality
  rubric both stages are judged against.
- `server/adapters/` — one JSON config per target model (Claude, ChatGPT, Gemini,
  Perplexity, Grok) describing only the model-specific guidance that's actually backed by
  that provider's documentation. Adding a model later means adding one JSON file here.

Claude is the engine that does the actual thinking (interpreting the request, selecting
components, drafting, critiquing, scoring, explaining) for every target model — the other
four models are never called directly in V1; Prompt Architect writes prompts for them, it
doesn't run them.
