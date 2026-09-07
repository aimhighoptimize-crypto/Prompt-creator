# Prompt Architect — Phase 1 Blueprint

**Status:** Research & architecture only. Nothing in this document has been implemented. No code exists yet — this is the design a Phase 2 build should follow.

**Research basis:** Two research passes were run in September 2026: (1) official provider documentation for Claude, GPT-5.x, Gemini, Perplexity/Sonar, and Grok, prioritizing primary sources; (2) competitive and monetization research on existing prompt-tool products. Every model-specific and competitive claim below is tagged:

- **(a)** — directly confirmed from an official provider document (URL cited).
- **(b)** — reported by a credible secondary source (search snippet, third-party tracker, aggregator) describing an official page that could not be fetched directly this session; treat as likely-accurate but not independently re-verified.
- **(c)** — inference, judgment call, or genuinely uncertain figure. Called out explicitly, never presented as fact.

---

## SECTION 1 — Executive Summary

Prompt Architect takes a messy, one-sentence description of what someone wants an AI to do — *"I need Claude to create a marketing plan for my plumbing business"* — and turns it into a prompt that is actually likely to produce a good result, for the specific AI model the person intends to use.

It does this by:
1. Figuring out what the person actually wants (not just rephrasing their sentence).
2. Asking a small number of smart questions only when the missing information would change the outcome.
3. Deciding how much prompt-engineering structure the task genuinely needs (a simple ask gets a simple prompt).
4. Writing the prompt, formatted the way the target model (Claude / ChatGPT / Gemini / Perplexity / Grok) is documented to respond to best.
5. Critiquing its own draft against a concrete quality rubric, fixing what it finds, and stripping anything that doesn't earn its place.
6. Scoring the result with reasons, not just a number.
7. Explaining the finished prompt back in plain English, so the user understands exactly what they're asking for before they use it.

The explicit design constraint, repeated throughout this document: **the product's job is better outcomes, not longer prompts.** Every mechanism below (the component engine, the interview engine, the anti-bloat pass, the scoring rubric) is built to actively resist the failure mode where "sophisticated" becomes a synonym for "padded."

---

## SECTION 2 — Product Verdict

**Short answer: worth building as a V1 prototype to test one specific, falsifiable hypothesis. Not yet worth building as a business, and the research below is genuinely disconfirming on a few points that this document will not paper over.**

### What the research says that cuts against the idea

- **The core mechanic is already free and native.** Anthropic's Claude Console ships a free "Generate a prompt" / Prompt Improver feature **(a)** — [anthropic.com/news/prompt-improver](https://www.anthropic.com/news/prompt-improver), [docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver). Anthropic's own docs admit it trades speed for length/thoroughness — an official confirmation of the exact "just makes it longer" failure mode this product is designed to avoid, meaning even the market leader hasn't solved it. OpenAI shipped a Playground "Prompt Optimizer" with GPT-5 **(a)** — [OpenAI cookbook](https://cookbook.openai.com/examples/gpt-5/prompt-optimization-cookbook). Google Vertex AI's Prompt Optimizer goes further, doing data-driven, metric-evaluated optimization **(a)** — [Google Cloud docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-optimizer). All three are free. Any standalone competitor has to be clearly better than free, built-in tooling from the model vendors themselves.
- **Standalone consumer tools in this exact category get priced as cheap, one-time impulse buys, not subscriptions.** PromptEngine and Pretty Prompt sell on AppSumo for $29–$99 lifetime, not recurring SaaS. PromptPerfect, one of the longest-running dedicated prompt-optimization SaaS products, still draws "$240/year to rewrite text?" pushback in reviews. That is a market telling you what it thinks this category is worth.
- **The credible money in this space has moved to ops/eval infrastructure, not prompt generation.** promptfoo — arguably the most serious standalone prompt/eval tool — was **acquired by OpenAI** rather than continuing independently in 2026, one data point suggesting this functionality gets absorbed into platforms, not sustained as a business. Real recurring revenue (LangSmith, Langfuse, PromptLayer) is earned by versioning, evals, and team collaboration — not the "improve this prompt" act itself.
- **There is a real naming collision.** "Prompt Architects" is already a live, reviewed product in this space (AppSumo). Whatever this ships as, it needs a different name.
- **Broader market narrative is moving away from manual prompt-crafting.** 2026 discourse increasingly frames "prompt engineering" as a declining discipline in favor of "context engineering" and programmatic/data-driven optimization (DSPy-style). This doesn't kill the idea, but it means the product should not be marketed on the phrase "prompt engineering" as a durable, prestigious skill.

### What still might be real

- **No vendor tool does cross-model translation.** Anthropic's tool only optimizes for Claude, OpenAI's only for GPT, Google's only for Gemini. A tool that takes one request and produces genuinely different, well-adapted prompts for five different models is not something any single vendor is incentivized to build. PromptPerfect's "test against 5 models" feature is the closest existing analogue — evidence this is a known angle, not a decisively won one.
- **None of the vendor tools interview the user first.** They rewrite what's given; they don't identify what's missing before rewriting. An interview step that only asks questions when the answer would change the output is a genuinely different interaction model, not just a UI skin on the same rewrite.
- **The plain-English explanation is a trust feature, not a rewriting feature**, and nothing in the competitive research suggests any competitor does this. Its value is unproven, but it doesn't compete with the free vendor tools on the same axis.

### Verdict

Build V1 to test one hypothesis: *does asking 1–5 targeted questions and adapting the output per target model produce a measurably better result than a single vendor's built-in "improve my prompt," for a real task, judged by the person who asked?* That's testable with a stateless single-user prototype in a few days of work. Do not build payments, accounts, or a go-to-market plan on top of this document — the competitive research above is a legitimate reason to gate monetization on evidence, not optimism. If V1 doesn't produce outputs a real user prefers over Claude's own Prompt Improver on the same request, the idea is disconfirmed and no amount of UI polish fixes that.

---

## SECTION 3 — Competitive Analysis

### Direct competitors (consumer/prosumer prompt tools)

| Product | What it does | Pricing | Known complaints |
|---|---|---|---|
| PromptPerfect | Rewrites/optimizes prompts, multi-shot tests against up to 5 models | ~$9.99–$20/mo, limited free tier | 10–20s latency called disruptive; $240/yr called steep for "rewriting text" |
| AIPRM | Chrome extension, 3,600+ curated ChatGPT templates, 1M+ users | $5.99–$79/mo | Trustpilot complaints re: billing/refunds |
| PromptBase | Marketplace for individual prompts | $1.99–$9.99 per prompt, 80% to seller | Functions as a niche marketplace, not a SaaS competitor |
| FlowGPT | Community prompt-sharing / chatbot platform | Ad/engagement-monetized | Not really the same product category |
| PromptEngine / Pretty Prompt | Prosumer prompt-improvement utilities | $29–$99 one-time (AppSumo) | Priced as low-commitment utilities, not durable subscriptions |

### Vendor-native tools (the real competition)

- **Anthropic Console "Generate a prompt" / Prompt Improver (a)** — free, Claude-only, ships with the console. [Source](https://www.anthropic.com/news/prompt-improver)
- **OpenAI Playground Prompt Optimizer (a)** — free, GPT-only, detects contradictions and missing output formats, biases toward accuracy/brevity/creativity/safety. [Source](https://cookbook.openai.com/examples/gpt-5/prompt-optimization-cookbook)
- **Google Vertex AI Prompt Optimizer (a)** — free, Gemini-only, supports zero-shot, few-shot, and data-driven (metric-evaluated, batch) optimization — the most rigorous of the three vendor tools. [Source](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-optimizer)

### Adjacent ops tooling (not a direct competitor, but shows where the money actually is)

LangSmith, Langfuse, PromptLayer — versioning, evals, collaboration, production logging, priced $29–$2,500+/mo. This is enterprise/team infrastructure spend, not consumer prompt-improvement spend. **promptfoo, the most credible standalone eval/prompt tool, was acquired by OpenAI in 2026** rather than continuing as an independent business — read as one signal (not proof) that this functionality tends to get absorbed by platforms.

### What differentiates Prompt Architect, honestly assessed

| Angle | Does anyone already do this well? |
|---|---|
| Rewrite/optimize a single prompt | Yes — free, native, per-vendor (Anthropic/OpenAI/Google) |
| Test one prompt across multiple models | Partially — PromptPerfect |
| Ask clarifying questions before generating | Not found in any researched competitor |
| Produce genuinely model-adapted (not just re-worded) outputs across 5 providers from one input | Not found in any researched competitor |
| Score with a stated rubric and explain the weaknesses found | Not found in any researched competitor |
| Explain the finished prompt in plain English | Not found in any researched competitor |

The honest reading: **the rewrite itself is commodity.** The differentiation this product should bet on is the *interview* (front-loading missing-context detection) and the *plain-English explanation + stated scoring rationale* (trust and understanding, not just output quality) — combined with genuine per-model adaptation rather than cosmetic re-labeling. If user testing shows the per-model outputs aren't meaningfully different from a generic rewrite, that's a signal to cut the multi-model claim rather than fake it with cosmetic differences (see Section 8's "marketing fluff vs. real difference" test).

---

## SECTION 4 — Definition of a 10/10 Prompt

A naive scoring approach — count how many "best practice" components are present — is actively wrong: it rewards padding. A prompt with twelve boxes ticked can still fail the user, and a two-sentence prompt can be a perfect 10 for a two-sentence task.

**Working definition:** *A 10/10 prompt is the shortest instruction set that gives the receiving model the highest realistic probability of producing what the user actually wants, in a form usable without further editing, worded so that no two competent, context-free readers would reasonably produce different outputs from it.*

### Five essential dimensions (every prompt, every task)

1. **Goal fidelity** — encodes the user's real underlying objective, not a literal restatement of their words. ("Marketing plan for my plumbing business" implies a plan they can act on this quarter, not a marketing textbook chapter.)
2. **Sufficient grounding** — every fact the model would otherwise have to guess is either supplied, or the prompt explicitly says what to assume.
3. **Unambiguous instruction** — no clause that could reasonably be read two ways with materially different outputs.
4. **Verifiable output contract** — the shape, length, and structure of the desired output is specific enough that success or failure is checkable, not just vibes.
5. **Model fit** — plays to the receiving model's documented behavior (see Section 8) instead of fighting or ignoring it.

### Situational dimensions (include only when the task actually calls for them)

Persona/role framing, explicit constraints, audience/tone, task decomposition, few-shot examples, edge-case handling, self-verification instructions, evaluation criteria, delimiters/structured markup, explicit reasoning triggers.

### Patterns that actively hurt the score (not neutral — penalized)

Generic "world-class expert with 20 years of experience" persona theater that doesn't change any actual instruction; the same constraint restated in three sections; vague intensifiers with no operational meaning ("be thorough," "be comprehensive"); defensively stacked constraints not implied by anything in the request; a forced output schema on an open-ended/creative task; a forced example when no genuinely representative one exists (a mediocre example teaches the wrong pattern); prompting a model to do something it already does unprompted (see Section 8 — several current models default to internal reasoning, and telling them to "think step by step" is redundant token spend, not a quality lever).

This definition is the rubric the scoring system in Section 9 actually implements — it is not a separate, softer "looks polished" check.

---

## SECTION 5 — Prompt Component System

| Component | Purpose | Essential when | Optional/situational | Harmful when |
|---|---|---|---|---|
| Objective/task statement | States what must be produced | Always | — | — |
| Context (domain/business/user facts) | Grounds the model in facts it can't know | Output quality depends on facts outside general knowledge | Task is generic/self-contained | Invented or generic filler with no bearing on the output |
| Persona/role | Shapes vocabulary, framework, judgment | The role changes what the model would actually do or notice (a CPA reviewing a budget flags different things than a generalist) | Role is decorative and wouldn't change substance | Forced "expert" framing with no behavioral effect |
| Audience | Tunes tone/level for the reader | Output's audience differs from the requester | Requester is the audience | — |
| Constraints (must/must-not) | Encodes real limits | Real limits exist (budget, length, compliance, banned content) | No such limits exist | Invented defensively, not implied by the request |
| Output format/schema | Makes the output usable | Output feeds a workflow, a program, or needs a specific structure | Open-ended/exploratory task where format would constrain useful discovery | Rigid schema forced onto a creative/exploratory ask |
| Examples (few-shot) | Anchors style/pattern | Style-matching, classification, structured extraction, edge-case-prone tasks | Open-ended reasoning tasks | No genuinely representative example exists — a bad one actively misleads |
| Task decomposition | Orders multi-stage work | Multi-stage, multi-source, or analytical tasks | Single-step asks | Decomposing a one-step task adds friction with no benefit |
| Evaluation criteria / definition of done | Defines what "good" means | Complex deliverables where "good" isn't self-evident (strategy, code, analysis) | Trivial tasks | — |
| Self-critique/verification instruction | Catches errors before delivery | High-stakes, fact-sensitive, or correctness-sensitive tasks | Casual/low-stakes tasks | Some current models already self-verify by default — adding it is redundant, not additive (model-dependent, see Section 8) |
| Tool-use instructions | Shapes use of browsing/search/code execution | Target surface actually has those tools | Plain chat completion | Instructing tool use the target surface doesn't support |
| Edge cases to handle | Prevents known failure modes | Task has predictable failure modes ("if data is missing, do X") | No known edge cases | Enumerating hypothetical edge cases that can't occur |
| Delimiters/XML/structured markup | Keeps multi-part prompts unambiguous | 3+ distinct sections, and/or target model documents a markup preference (Claude, Grok) | Short, single-idea prompts | XML-wrapping a two-sentence prompt |
| Reasoning/step-by-step triggers | Encourages decomposition before answering | Model does not reason internally by default, or task genuinely benefits from visible decomposition | Model already reasons internally by default (current Claude/GPT reasoning models) | Redundant on models with default-on reasoning — wastes tokens without changing output |
| Tone/style guidance | Matches voice to context | User-facing writing tasks | Data-transform/extraction tasks | — |

**The generator never includes every row.** The component engine (Section 6/7) selects a subset per task; a component's presence in this table means "available," not "recommended by default."

---

## SECTION 6 — User Interview Logic

**Pipeline:** classify the task's archetype (writing / business-strategy / marketing / research / coding / analysis / decision-making / other) → look up that archetype's slot template (the facts a prompt of this kind typically needs — e.g. business-strategy needs audience, current state, timeframe, budget/resource constraints) → diff against what the user already stated in their raw request → score each missing slot on two axes:

- **Outcome impact** — if the model guesses this slot wrong, does the output become materially worse or generically wrong? (e.g., not knowing the business is a solo plumber vs. a 40-person franchise changes almost everything about a marketing plan → high impact.)
- **Answer effort** — how costly is it for the user to answer right now? (A yes/no or one-line answer is cheap; "attach your last three years of financials" is expensive.)

**Ask only slots that clear a minimum impact threshold, cheapest first.** Every question ships with a sensible default the system will silently use if skipped — the system never blocks on an unanswered question, and the final result always states which defaults it assumed.

### Mode A — Fast
Ask 0–2 questions, and only "blocking" ones — where guessing would make the prompt actively unhelpful (e.g., target model, or a genuine fork like "is this for internal use or a client-facing document?"). Otherwise proceed on stated best-guess assumptions, surfaced transparently: *"I assumed this is for a small, local-service business — tell me if that's wrong."*

### Mode B — Deep
Ask up to ~5–7 questions, grouped by topic, each individually skippable, presented conversationally rather than as a form. Stop as soon as either (a) no remaining candidate question clears the impact threshold, or (b) the cap is hit.

### Universal rules
- Never ask a question whose answer, either way, wouldn't change a line in the generated prompt.
- Never ask two questions when a safe default resolves one of them.
- Never present a question the user already answered in their original request.

---

## SECTION 7 — Three Prompt Levels

| Level | When recommended | Typical components |
|---|---|---|
| **Quick** | Single-step, low-stakes, low-ambiguity requests ("rewrite this email," "give me 5 taglines") | Objective + minimal context + output format |
| **Super** (default) | Moderate complexity or stakes, some ambiguity (a marketing plan, a feature spec, a research summary) | Role (only if it changes substance) + context + objective + constraints that matter + output format + one quality-control instruction |
| **Expert** | High complexity/stakes/multi-stage deliverables (business strategy, technical architecture, a professional-grade long-form document) | Full situational set as warranted: role, deep context, decomposed sub-tasks, constraints, audience, evaluation criteria, examples where available, edge cases, explicit self-verification, structured output schema |

**Selection signals:** number of distinct sub-tasks implied, stakes/cost of a wrong or generic answer, ambiguity of the ask, whether output structure matters downstream. The system recommends a level automatically from these signals; the user can override with one click. Nobody has to understand the taxonomy to get a good result — the level names are a convenience label on top of a decision the engine already made.

---

## SECTION 8 — Model-Specific Strategy

The point of this section: the same request should not produce five re-worded copies of the same prompt. Each adapter changes *structure and technique*, grounded in what's actually documented — not invented capability differences.

### Claude (Opus 5 / Sonnet 5 / Haiku 4.5)
**(a)** Anthropic's official prompting guide recommends XML tags (`<instructions>`, `<example>`, `<document>`) for prompts mixing multiple content types, 3–5 few-shot examples wrapped in `<example>`/`<examples>` tags, a short system-prompt role sentence, and — for long context (20k+ tokens) — placing source documents *before* the query, since queries at the end can improve response quality by up to 30%. [Source](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Current Opus 5/Sonnet 5 default to **adaptive, always-on internal reasoning** controlled by an `effort` parameter rather than the old manual `budget_tokens` mechanism. **Explicitly documented not to do:** use prefilled assistant messages (unsupported on Claude 4.6+, returns an error — use Structured Outputs instead); use aggressive "CRITICAL: you MUST" tool-triggering language (causes over-triggering on newer models); add self-verification instructions to Opus 5 specifically (it already over-verifies without prompting).

*Adapter behavior:* favor XML section tags once the prompt has 3+ distinct parts; keep few-shot examples to 3–5, tagged; do not add "think step by step" or "double-check your work" language — the model already does both by default; put long reference material before the instruction, not after.

### ChatGPT / GPT (GPT-5.x family)
**(a)** OpenAI's GPT-5 prompting guide states the model is "exceptionally sensitive to contradictory instructions" — a contradiction or leftover instruction is more damaging to GPT-5 than to other models, making internal consistency a higher-priority check for this adapter than for others. GPT-5 does **not** format with Markdown by default; it must be told to, and in long conversations the formatting instruction should be re-stated periodically. OpenAI recommends its native Structured Outputs (JSON-schema, `strict: true`) over prompted formatting instructions for anything machine-consumed. The guide favors direct, one-line role statements and explicit XML-style behavioral tags (e.g. `<persistence>`, `<context_gathering>`) over elaborate persona priming, and documents a `reasoning_effort` control for agentic/exploration depth. [Source](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)

*Adapter behavior:* run an explicit contradiction/consistency check before finalizing (higher priority than for other adapters); state Markdown formatting explicitly when structure is wanted, rather than assuming it; prefer a short direct role line over a paragraph of persona; specify JSON schema natively rather than describing JSON in prose when the output is machine-read.

### Gemini (Gemini 3 / 2.5 family)
**(b, official page not independently re-fetched this session)** Google's prompting-strategies guide documents a specific overfitting risk in few-shot prompting and stresses formatting *consistency* across examples (tags, whitespace, structure), since the model is sensitive to structural drift between shots. For long-context tasks, guidance mirrors Anthropic's: place instructions/questions *after* the data. Google recommends its native structured-output/JSON-schema feature over prompt-only formatting for complex schemas. Documented default: Gemini 3 is **less verbose by default** than prior versions and needs explicit steering toward a conversational tone. Google's guidance also states that defining the desired end-state outperforms negative/prohibitive framing ("don't do X"), and that pressure-style phrasing ("something bad will happen if...") no longer helps on current models. Context: 1M input tokens, natively multimodal, with Search Grounding available for real-time information. [Source](https://ai.google.dev/gemini-api/docs/prompting-strategies)

*Adapter behavior:* keep few-shot sets small and structurally identical to each other; phrase constraints as desired end-states, not prohibitions; explicitly request the tone/verbosity wanted rather than assuming a default; mention Search Grounding only when the task genuinely needs current information.

### Perplexity (Sonar family)
**(b, official page not independently re-fetched this session)** Perplexity's documented architecture is structurally different from the other four: **the system prompt does not influence the web-search step.** Sonar searches using only the user message; the system prompt is applied at answer-generation time, after search results are already retrieved. This is the documented reason persona/role framing has limited value here — it cannot shape what gets searched. Perplexity's own guide recommends direct, query-like clarity in the user message instead of role-setting, and documents `search_domain_filter` for restricting/trusting sources to improve citation quality. The Sonar lineup trades speed for depth (`sonar` → `sonar-pro` → `sonar-reasoning-pro` → `sonar-deep-research`). [Source](https://docs.perplexity.ai/docs/sonar/prompt-guide)

*Adapter behavior:* de-prioritize persona/role entirely — it does not affect retrieval; put the actual information need in direct, specific, query-like language in the primary instruction, not buried under scene-setting; use domain filters when source trustworthiness matters; pick a Sonar tier based on whether the task needs speed or depth/citation density, and say so.

### Grok (Grok 4.x family)
**(a)** xAI openly publishes its production system prompts in a public repo, an unusual transparency move among these five providers. [Source](https://github.com/xai-org/grok-prompts) **(b)** xAI's prompting guidance recommends XML tags or Markdown headers to delineate prompt sections, concrete/specific requests over vague ones, and an iterative "quick attempt, then refine" workflow. Grok's most distinctively documented capability is native real-time access to X posts and web/live search via an Agent Tools API — the only one of the five with this as a first-class, vendor-marketed feature.

*Adapter behavior:* use XML or Markdown headers for multi-part prompts (similar to Claude); when the task benefits from current events / real-time social signal, say so explicitly, since that's Grok's genuine documented differentiator rather than a generic capability claim; keep instructions concrete over abstract, per the "iterate rather than over-specify up front" guidance.

### Cross-model summary

| Technique | Matters most for | Status |
|---|---|---|
| XML tags for structure | Claude, Grok (also useful for Gemini) | (a) Claude, (a) Grok, (b) Gemini |
| Explicit Markdown formatting instruction | GPT-5.x (off by default) | (a) |
| Few-shot examples, tagged and structurally consistent | Claude (3–5, tagged), Gemini (consistency-sensitive) | (a) Claude, (b) Gemini |
| Native JSON-schema output over prompted format | Claude, GPT-5.x, Gemini | (a) all three |
| Short direct role > elaborate persona | Claude, GPT-5.x; **near-irrelevant for Perplexity's search step** | (a) Claude/GPT; (b) Perplexity |
| No manual "think step by step" / "verify your work" | Claude (adaptive thinking default; explicit anti-recommendation for Opus 5) | (a) |
| Query-like directness over roleplay | Perplexity (documented structural reason) | (b) |
| End-state framing over "don't do X" | Gemini (explicit) | (b) |
| Real-time/live-data awareness | Grok (X/web, vendor-differentiating), Perplexity (search), Gemini (Search Grounding) | (a) Grok; (b) Perplexity, Gemini |

**Marketing fluff vs. real difference (the test the adapter layer must pass):** a per-model difference only belongs in the generated prompt if it's traceable to one of the rows above or a future documented equivalent. "Claude prompts sound smarter" is fluff. "This prompt omits a verification instruction because Opus 5 is documented to over-verify without it" is a real, checkable difference. If a future model update removes a documented behavior, the adapter config removes the corresponding rule — the pipeline itself never hard-codes model beliefs outside the adapter layer (see Section 13).

---

## SECTION 9 — Quality-Control System

**Pipeline:** generate draft → self-critique against the Section 4 rubric, producing a list of concrete, quoted weaknesses (not a vibe score) → targeted revision addressing exactly those weaknesses → re-score → a testing pass that asks "if a capable but context-free model received only this text, would it produce what the user described up front?" → finalize.

**How many passes:** cap automatic critique/revise cycles at **2**. Most measurable quality gain happens in the first revision; a second catches what the first missed; empirically, a third pass mostly paraphrases rather than improves and risks over-editing a prompt that was already fine. Offer a manual "critique again" action beyond the cap for a power user who disagrees with the auto-stop, but don't spend the extra LLM call by default.

**Scoring is never a bare number.** Every score ships with: which of the five essential dimensions (Section 4) it satisfies fully/partially/not at all, which situational components it included and why, and the "necessity density" figure from Section 11 (the anti-bloat metric). A 100/100 with no stated weaknesses is treated as a bug in the scorer, not a compliment to the prompt — the critique step must always attempt to find at least one genuine weakness before it's allowed to report a near-perfect score, and if it truly finds none, it says so explicitly rather than defaulting to silence.

---

## SECTION 10 — Plain-English Explanation System

Because the generator assembles the prompt from a tagged internal component list (even when the copyable output reads as plain prose), the explainer walks that same list and renders one plain-language line **per component that is actually present** — never a fixed template that explains components deliberately left out, which would misrepresent what's actually in the user's prompt.

**Pattern per line:** *"[Component] — this tells the AI to ___, so that ___."* Ordered: role → goal → context → constraints → output → quality control, skipping anything unused.

Example (matching the product brief's own illustration):

> **Role** — You're telling the AI to act like an experienced marketing strategist, so its suggestions come from that lens rather than generic advice.
> **Goal** — You're telling it exactly what result you want: a plan you can act on this quarter.
> **Context** — You're giving it facts about your business so it doesn't default to generic, one-size-fits-all recommendations.
> **Constraints** — You're telling it what to stay inside (budget, channels) so it doesn't propose things you can't use.
> **Output** — You're telling it exactly how to organize the answer, so you get something usable rather than a wall of text.
> **Quality control** — You're asking it to check its own plan against your constraints before handing it back.

Target length: under ~150 words for Quick/Super; Expert may run longer but stays one line per component — no padding, matching the anti-bloat principle applied to the explanation itself, not just the prompt.

---

## SECTION 11 — Anti-Bloat System

**Core test, run after drafting and after every revision:** for every sentence in the draft — *"if this line were deleted, would the model's likely output change in a way the user would care about?"* If no, delete it.

**Concrete anti-patterns actively stripped:**
- The same constraint restated in multiple sections.
- Generic sophistication theater ("You are a world-class expert with 20 years of experience...") that doesn't change any actual instruction.
- Vague intensifiers with no operational meaning ("be thorough," "be comprehensive").
- Constraints invented defensively rather than implied by the request.
- Formatting instructions with no downstream consumer.
- Redundant restatements of the objective.
- Instructions asking the model to do something it already does by default (Section 8's model-specific redundancies — e.g., "think step by step" on a model with default-on reasoning).

**Mechanism, not just a principle:** expose this as a first-class scoring dimension — **necessity density** = (lines that pass the counterfactual test) ÷ (total lines) — feeding directly into Section 9's critique pass. This makes anti-bloat structural, not a matter of taste applied inconsistently: a prompt can't score well while padded, because padding directly lowers a number the scorer reports.

---

## SECTION 12 — UX Specification

**Ideal first-time user assumption:** they know nothing about prompt engineering, models, or AI terminology. The interface must never require that knowledge to get a good result.

### Flow
1. **Landing / input** — one textarea ("What do you want an AI to do?"), a Fast/Deep toggle (Fast pre-selected), a model picker with a default "Not sure — pick for me" option.
2. **Clarifying questions** (skipped entirely if none apply) — a short, conversational list, each question individually skippable, each showing its default inline ("If you skip this, I'll assume: local, small business").
3. **Generating** — a transparent, brief progress indicator: understanding the goal → selecting what the prompt needs → drafting → checking it → scoring it. This isn't cosmetic — it's the plain-English explanation of the *pipeline*, mirroring the plain-English explanation of the *output*.
4. **Result screen** — the final prompt front and center with a copy button; the plain-English explanation directly below it; the score and its stated reasoning available in an expandable section, not hidden behind a click nobody takes; an easy "regenerate" or "answer more questions" path back.

### Minimum screens for V1
Two, really: (1) input + questions as one continuous flow, (2) the result screen. A model picker and level toggle live as inline controls on screen 1, not as separate screens — this product should feel like one continuous conversation, not a wizard with steps to click through.

---

## SECTION 13 — Technical Architecture

**Principle:** simple, cheap, maintainable, easy to modify. This is a personal prototype, not a scaled product — the architecture below is sized for that, while keeping the one seam (model adapters) that must be clean for future growth.

### Frontend
A single-page app (React via Vite, or Next.js if deploying to Vercel is the plan) — one input screen, one result screen, no routing complexity needed. No user accounts, so no auth UI.

### Backend
Thin serverless functions (or a small Node/Python API) whose only job is orchestrating LLM calls — the product has no meaningful state to persist for V1, so there's no case for a always-on server. Two effective options, either is fine:
- Client calls a serverless function per pipeline stage (classify → interview → generate → critique → score → explain), OR
- One function does the full pipeline server-side and streams status updates back (matches the "transparent progress" UX in Section 12 more naturally).

### AI API strategy
Use the **Claude API** to *perform* the meta-work — Claude is the model doing the classifying, interviewing, drafting, critiquing, scoring, and explaining, regardless of which model the *output* prompt targets. The five target models are not called by this product at all in V1 — the product's job is to write a prompt, not to run it. (A "test this prompt" feature that actually calls the target model, listed as Nice-to-Have in Section 14, is the one place a second provider's API might get called later — treat that as a deliberate, isolated addition, not baked into the core pipeline.)

### Data storage
None required for V1 beyond ephemeral session state (kept client-side or in-memory per request). No database, no user accounts. If the builder wants to track their own prototype's outputs for manual review, a simple local JSONL log (one line per generation, for the builder's own iteration) is enough — this is a development aid, not a product feature, and should not grow into a hidden "users" table.

### Configuration and the adapter architecture

This is the one part of the system that must be designed cleanly, because it's explicitly required to extend to new models later without a rebuild:

```
/adapters/
  claude.json
  chatgpt.json
  gemini.json
  perplexity.json
  grok.json
```

Each adapter file is data, not code, shaped roughly like:

```json
{
  "id": "claude",
  "display_name": "Claude",
  "structure_preference": "xml_tags",
  "supports_system_prompt": true,
  "few_shot": { "recommended_count": [3, 5], "wrap_in_tags": true },
  "native_structured_output": true,
  "default_reasoning": "adaptive_always_on",
  "avoid": [
    "prefilled_assistant_messages",
    "aggressive_tool_trigger_language",
    "explicit_self_verification_instruction"
  ],
  "long_context_rule": "place_reference_material_before_instruction",
  "source": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
  "last_verified": "2026-09-07"
}
```

Adding a sixth model later means adding one JSON file and, if it needs one, a tiny adapter function implementing a fixed interface (`applyModelRules(promptComponents, adapterConfig) -> assembledPrompt`) — the pipeline, component engine, and UI are untouched. The `last_verified` date matters: model docs change; this field is what tells a future maintainer an adapter might be stale (see Section 16).

### Pipeline (single request, end to end)

```
intake(raw_request)
  -> classify(task_archetype, complexity_signals)
  -> interview(mode, archetype)              // may be empty
  -> select_components(archetype, complexity, answers)
  -> select_level(complexity_signals)         // quick | super | expert
  -> select_model_adapter(user_choice | recommendation)
  -> assemble_draft(components, level, adapter)
  -> critique(draft, rubric)                  // Section 4/9 rubric
  -> revise(draft, critique)                  // up to 2 cycles
  -> score(final_draft, rubric)
  -> explain(final_draft, components)
  -> return { prompt, score, rationale, explanation, assumptions_made }
```

### Error handling
LLM call failures retry with backoff; on repeated failure, return the best partial result with an explicit, visible flag ("scoring step failed — this prompt hasn't been checked") rather than silently returning an unverified prompt as if it were finished.

### Security
No accounts, no stored PII in V1, so the attack surface is small. Sanitize any user input before it's reflected into rendered HTML (basic XSS hygiene). API keys live server-side only, never shipped to the client bundle.

### Environment variables
`ANTHROPIC_API_KEY` (or equivalent) is the only required secret for V1, since the meta-work runs on one provider. No other secrets needed until a "test this prompt" feature calls other providers' APIs.

---

## SECTION 14 — V1 Scope

**MUST HAVE**
- Single input box; Fast/Deep toggle.
- Interview engine, capped at ~5 skippable questions, with visible defaults.
- Model picker across the 5 target models, plus a "not sure — pick for me" option.
- At minimum Quick/Super levels (Expert if time allows — not required to prove the core hypothesis).
- Full pipeline: generate → 1 critique/revise cycle → score with stated rationale → plain-English explanation.
- Copy-to-clipboard on the final prompt.

**NICE TO HAVE**
- Side-by-side comparison of the same request across two or more models.
- A "regenerate" / "answer more questions" refine loop.
- Local-storage-only prompt history (no accounts).
- A lightweight "test this prompt" feature that actually calls the target model and shows the result (the one place a second-provider API key would be needed).
- Markdown export of the final prompt + explanation.

**DO NOT BUILD YET**
Accounts/auth, payments/billing, teams/collaboration, a prompt marketplace or public sharing feed, analytics dashboards, a browser extension, a public third-party API, fine-tuned/custom models, enterprise admin, prompt version control. None of these are needed to test "this produces dramatically better prompts than asking an AI to write me a prompt" — that claim is testable with a stateless, single-user tool, and the competitive research in Section 3 is a specific reason not to pre-build monetization infrastructure before that claim is validated.

---

## SECTION 15 — Example Scenarios

Ten requests spanning the required variety, each showing: request → questions asked → components selected → strategy/level → expected output shape → plain-English summary.

**1. Simple personal task**
*Request:* "Rewrite this email to sound less annoyed."
*Questions:* none (Fast mode; low stakes, self-contained).
*Components:* objective, context (paste of original email), tone guidance.
*Level:* Quick. *Model:* any — no adapter differences matter for a task this short.
*Output shape:* a single rewritten email, no preamble.
*Explanation:* "Goal — reword this to sound calmer. Context — the original email, so it keeps your facts. Tone — sets the target mood."

**2. Business strategy**
*Request:* "I need Claude to create a marketing plan for my plumbing business."
*Questions (Deep):* service area size, current customer-acquisition channels (if any), rough monthly budget, timeframe (this quarter vs. this year).
*Components:* role (marketing strategist — changes what gets recommended), business context, objective, constraints (budget/channels), output structure (plan sections), one quality-control check ("flag anything that assumes a bigger budget than stated").
*Level:* Super (Expert if the user opts into more structure, e.g. wants a full competitive analysis).
*Model:* Claude (as stated) → XML-tagged sections, no explicit "think step by step" (redundant on current Claude).
*Output shape:* plan with sections (situation, target customers, channels, 90-day actions, budget allocation, how to measure results).
*Explanation:* per Section 10's worked example above.

**3. Marketing (short-form)**
*Request:* "Write 10 Instagram captions for my bakery's fall menu launch."
*Questions:* brand voice (playful vs. classic), any must-mention items.
*Components:* context (menu items), tone, output format (numbered list, length constraint per caption), a couple of examples of the desired voice if the user has any.
*Level:* Quick/Super border — Super if voice-matching examples are supplied (few-shot becomes valuable).
*Output shape:* 10 captions, numbered, each under a stated character count.

**4. Research**
*Request:* "I want to understand how tariffs might affect my import business."
*Questions:* which country/goods, rough size of business, time horizon.
*Components:* context (industry/goods), objective (decision-relevant summary, not a textbook explainer), output format (findings + so-what for their business), edge case ("note where information may be outdated").
*Level:* Super/Expert depending on stated stakes.
*Model fit:* Perplexity is a strong recommendation here — real-time, cited information matters more than persona; adapter drops role framing, keeps the ask direct and specific per Perplexity's documented search-shaping limitation.
*Explanation:* "Objective — asks for what this means for your business, not a general essay. Output — findings plus implications, so you can act on it."

**5. Writing (long-form)**
*Request:* "Help me write a short story about a lighthouse keeper."
*Questions:* tone/genre, length, point of view (only if not implied).
*Components:* minimal — objective, a few constraints (length, POV), explicitly *no* rigid output schema (creative task).
*Level:* Quick/Super. This is a case where the anti-bloat system matters most: resist adding "evaluation criteria" or "self-verification" to a creative task where they'd flatten the writing.

**6. Coding**
*Request:* "Build me a function that dedupes a list of customer records with slightly different formatting."
*Questions:* language, definition of "duplicate" (exact fields, fuzzy match tolerance), expected input size.
*Components:* objective, precise input/output contract, constraints (language/framework), edge cases (missing fields, case differences), examples (sample input → expected output), a verification step ("include a couple of test cases").
*Level:* Expert-leaning Super — code tasks benefit from a concrete contract even when short.
*Model fit:* GPT-5.x or Grok's code-oriented variants: adapter runs the contradiction/consistency check with extra weight (GPT-5's documented sensitivity to contradictions), specifies JSON/structured examples natively rather than prose-described.

**7. Data analysis**
*Request:* "Analyze my sales spreadsheet and tell me what's going on."
*Questions:* what decision this analysis should support, timeframe, what "going on" means to them (trends? anomalies? a specific concern?).
*Components:* objective (tied to the actual decision), context (data description), output format (findings ranked by relevance to the stated decision, not an exhaustive dump), a quality-control instruction to flag data-quality issues rather than silently working around them.
*Level:* Super/Expert depending on stakes.

**8. Decision-making**
*Request:* "Should I lease or buy a delivery van for my business?"
*Questions:* budget/cashflow situation, expected usage/years, tax situation relevance.
*Components:* objective (a recommendation with reasoning, not just pros/cons), context, explicit decision criteria (what matters most to them — cash flow vs. total cost vs. flexibility), output format (recommendation up front, reasoning after — decision-support tasks benefit from answer-first structure).
*Level:* Super.

**9. Complex professional task**
*Request:* "Draft a technical architecture proposal for migrating our monolith to microservices."
*Questions:* current stack, team size, main pain points driving the migration, timeline/risk tolerance.
*Components:* role (senior architect — changes the framework applied), deep context, task decomposition (current-state assessment → target design → migration phases → risks), evaluation criteria, output structure (proposal sections), edge cases (what could go wrong), explicit self-verification ("check that the phased plan doesn't require a big-bang cutover unless justified").
*Level:* Expert — full component set is genuinely warranted here, not decorative.

**10. Highly ambiguous request**
*Request:* "Make me something good for my business."
*Questions (necessarily more upfront here, even in Fast mode, because almost everything is a blocking unknown):* what kind of business, what "something" should be (a document? an image? a plan?), what problem prompted this request right now.
*Components:* this is a case where the interview engine's job is to convert an unusable request into a classifiable one before any component selection happens at all — if the user won't answer even minimal clarifying questions, the system should say so honestly rather than guessing wildly and producing a confident, generic, low-value prompt.
*Explanation:* the plain-English output in this case should include, transparently, "Your request didn't specify enough for me to build a good prompt — here's my best guess, but answering these would make it dramatically better," rather than hiding the ambiguity behind false confidence.

---

## SECTION 16 — Risks & Failure Modes

| Risk | Mitigation |
|---|---|
| Users abandon during the interview | Every question skippable; Fast mode default; visible defaults shown inline |
| Generated prompt confidently misreads what the user wanted | Show stated assumptions up front; plain-English explanation acts as a checkpoint before the user commits to using the prompt; easy inline edit/regenerate |
| Model-specific optimization turns out cosmetic, not substantive — the product looks like snake oil | Every adapter rule must trace to a documented behavior (Section 8's fluff-vs-real test); validate with real side-by-side output comparisons before shipping any "optimized for X" claim; be honest in the UI when a difference is stylistic rather than substantive |
| Scoring feels arbitrary or gameable, eroding trust | Never show a bare number; always show which dimensions passed/failed and why; treat a suspiciously perfect score as a scorer bug, not a compliment |
| Anti-bloat and Expert-level richness pull against each other | The necessity test is about outcome impact, not brevity for its own sake — Expert prompts are allowed more components, each still individually justified |
| Provider docs and model behavior change frequently — adapters go stale | Adapter configs are versioned, date-stamped (`last_verified`), and isolated from pipeline code so updates don't require a rebuild; treat stale adapters as a known maintenance cost, not a one-time task |
| Multi-call pipeline (classify/interview/generate/critique/score/explain) costs real tokens per generation | Combine steps into fewer calls where quality allows; consider a cheaper/faster model for the critique pass; cache classification for near-duplicate requests |
| Competitive/existential: vendor-native "improve my prompt" features close the gap entirely | Differentiate on the interview engine, true cross-model adaptation, and the explanation/scoring trust layer — not on "we also rewrite prompts," which is already free everywhere |
| Naming collision with the existing "Prompt Architects" product | Pick a different product name before any public launch |

---

## SECTION 17 — Phase 2 Build Specification

This section is written so a fresh Claude Code session can implement V1 without re-deriving the architecture above.

### Stack
- Frontend: React + Vite (single page, two views: Input/Interview, Result). No routing library needed.
- Backend: a handful of serverless functions (Vercel functions, or a minimal Express/FastAPI app if self-hosting is preferred) — one endpoint per pipeline stage, or one endpoint running the full pipeline with server-sent events for progress updates (matches Section 12's transparent-progress UX; prefer this if time allows).
- AI provider: Claude API only for V1 (the meta-work). No other provider keys needed unless building the Nice-to-Have "test this prompt" feature.

### Directory layout

```
/adapters/
  claude.json
  chatgpt.json
  gemini.json
  perplexity.json
  grok.json
/lib/
  pipeline/
    classify.ts        // task archetype + complexity signals
    interview.ts        // slot templates per archetype, question selection
    components.ts       // Section 5 component table + selection logic
    level.ts            // Quick/Super/Expert selection
    assemble.ts         // builds draft using selected components + adapter
    critique.ts         // Section 4 rubric check, produces quoted weaknesses
    revise.ts           // applies critique, capped at 2 cycles
    score.ts            // Section 9 scoring incl. necessity density (Section 11)
    explain.ts          // Section 10 plain-English generator
  adapterLoader.ts       // reads /adapters/*.json, exposes applyModelRules()
  promptEngine.ts        // orchestrates the full pipeline (see Section 13 diagram)
/prompts/                 // the META-prompts instructing Claude to perform each
  classify.md              // pipeline stage — these are the actual system
  interview.md             // prompts sent to the Claude API, NOT the prompts
  critique.md              // this product generates for the end user
  score.md
  explain.md
/app/  (or /src for Vite)
  InputScreen.tsx
  InterviewScreen.tsx      // can be a sub-view of InputScreen, per Section 12
  ResultScreen.tsx
```

### Slot templates for `interview.ts` (starting set — extend per archetype as needed)

- **writing**: audience, tone/voice, length, point of view (if fiction)
- **business_strategy**: business size/stage, target audience, budget/resources, timeframe
- **marketing**: brand voice, channels, must-include items, audience
- **research**: subject scope, decision this should support, time horizon
- **coding**: language/framework, precise input/output contract, constraints, expected scale
- **data_analysis**: decision this supports, data description, timeframe, definition of "interesting"
- **decision_making**: options being weighed, what matters most (criteria), constraints

Each slot carries: `impact_if_missing` (high/medium/low), `default_if_skipped` (string), `question_text`.

### Adapter interface

```ts
interface ModelAdapter {
  id: string;
  applyRules(components: PromptComponent[], level: Level): AssembledPrompt;
}
```

Each adapter reads its own JSON config (schema shown in Section 13) and applies: structure preference (XML vs. Markdown vs. plain), few-shot count/wrapping, whether to state formatting explicitly, which situational components to suppress because the model already does them by default (the `avoid` list), and any long-context ordering rule.

### Build order (suggested)

1. Component table + level selector (Sections 5 & 7) as pure data/logic, no AI calls yet — testable with fixed inputs.
2. Classify + interview engine (Section 6) — get slot-template-driven question generation working against a few of the Section 15 example requests as test cases.
3. One adapter (Claude) end-to-end: assemble → critique → revise → score → explain, using the Claude API for the meta-work. Validate against Section 15's Example 2 (the marketing-plan case from the product brief) by hand.
4. Add the remaining four adapters as data files; verify each produces a genuinely different assembled prompt for the same input (the fluff-vs-real test in Section 8) before considering the adapter "done."
5. Wire up the frontend (Input/Interview/Result) against the working pipeline.
6. Add the necessity-density anti-bloat metric (Section 11) into scoring.
7. Nice-to-haves only after the above works end-to-end and has been used on real requests by the builder.

### Meta-prompts (what actually gets sent to the Claude API to run each stage)

These are internal, not user-facing — write them once in `/prompts/` and iterate. Each should:
- State its single job plainly (classify only; critique only; etc.) — don't combine stages into one giant meta-prompt, since that makes failures hard to isolate and defeats the "few, focused calls" cost mitigation in Section 16.
- Reference the Section 4 rubric and Section 5 component table directly (paste them in, or a condensed version) so the critique/score stages are checking against the same rubric a human reader of this document would apply — not the model's own free-floating notion of "good."
- For `critique.md` specifically: require quoted weaknesses tied to specific lines, not general impressions — this is what makes Section 9's "never a bare compliment" rule enforceable in practice.

### Definition of done for V1
A user can type a messy request, optionally answer a few skippable questions, pick (or auto-get) a target model, and receive: a final prompt, a score with stated reasoning, and a plain-English explanation — for at least the ten scenarios in Section 15, without the pipeline crashing, and with visibly different outputs across at least two of the five model adapters for the same input (proving the adaptation is real, not cosmetic).

---

*End of Phase 1 blueprint. No application code has been written. Phase 2 begins only when explicitly requested.*
