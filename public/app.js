const screens = {
  lock: document.getElementById("screen-lock"),
  input: document.getElementById("screen-input"),
  questions: document.getElementById("screen-questions"),
  loading: document.getElementById("screen-loading"),
  result: document.getElementById("screen-result"),
};

const PASSWORD_STORAGE_KEY = "prompt-architect-password";

function getStoredPassword() {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function authHeaders() {
  return { "x-app-password": getStoredPassword() };
}

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].hidden = key !== name;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const state = {
  request: "",
  targetModel: "claude",
  mode: "fast",
  level: "auto",
  interview: null,
  answers: [],
  lastResult: null,
};

const modelSelect = document.getElementById("model-select");
const modeSelect = document.getElementById("mode-select");
const levelSelect = document.getElementById("level-select");
const requestInput = document.getElementById("request-input");
const inputError = document.getElementById("input-error");
const resultError = document.getElementById("result-error");

async function loadModels() {
  try {
    const res = await fetch("/api/models");
    const models = await res.json();
    modelSelect.innerHTML = models
      .map((m) => `<option value="${m.id}" ${m.id === "claude" ? "selected" : ""}>${m.displayName}</option>`)
      .join("");
  } catch {
    modelSelect.innerHTML = `<option value="claude">Claude</option>`;
  }
}

if (getStoredPassword()) {
  loadModels();
  showScreen("input");
} else {
  showScreen("lock");
}

function handleUnauthorized() {
  stopLoading();
  try {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch {
    // ignore — worst case the wrong password just gets re-sent once more
  }
  document.getElementById("password-input").value = "";
  document.getElementById("lock-error").textContent = "Wrong password — try again.";
  document.getElementById("lock-error").hidden = false;
  showScreen("lock");
}

document.getElementById("unlock-btn").addEventListener("click", () => {
  const value = document.getElementById("password-input").value;
  if (!value) return;
  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, value);
  } catch {
    // localStorage unavailable — password will just be re-sent from memory
    // via getStoredPassword() failing gracefully; not worth blocking on.
  }
  document.getElementById("lock-error").hidden = true;
  loadModels();
  showScreen("input");
});

const LOADING_STAGES = [
  "Understanding your goal…",
  "Selecting what the prompt needs…",
  "Drafting…",
  "Checking it for weaknesses…",
  "Refining…",
  "Scoring it…",
];
let loadingInterval = null;
function startLoading() {
  showScreen("loading");
  let i = 0;
  const statusEl = document.getElementById("loading-status");
  statusEl.textContent = LOADING_STAGES[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_STAGES.length;
    statusEl.textContent = LOADING_STAGES[i];
  }, 1400);
}
function stopLoading() {
  clearInterval(loadingInterval);
  loadingInterval = null;
}

document.getElementById("generate-btn").addEventListener("click", async () => {
  const value = requestInput.value.trim();
  inputError.hidden = true;
  if (!value) {
    inputError.textContent = "Tell Prompt Architect what you want help with first.";
    inputError.hidden = false;
    return;
  }

  state.request = value;
  state.targetModel = modelSelect.value;
  state.mode = modeSelect.value;
  state.level = levelSelect.value;
  state.answers = [];

  startLoading();
  try {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ request: state.request, targetModel: state.targetModel, mode: state.mode }),
    });
    if (res.status === 401) return handleUnauthorized();
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    const interview = await res.json();
    state.interview = interview;
    stopLoading();

    if (interview.questions.length === 0) {
      await doGenerate();
    } else {
      renderQuestions(interview.questions);
      showScreen("questions");
    }
  } catch (err) {
    stopLoading();
    showScreen("input");
    inputError.textContent = err.message || "Something went wrong. Please try again.";
    inputError.hidden = false;
  }
});

function renderQuestions(questions) {
  const list = document.getElementById("questions-list");
  list.innerHTML = questions
    .map(
      (q, i) => `
    <div class="question-card">
      <label for="q-${i}">${q.question}</label>
      <p class="why">${q.why_it_matters}</p>
      <input type="text" id="q-${i}" placeholder="Leave blank to skip" />
      <p class="default-hint">If skipped: ${q.default_if_skipped}</p>
    </div>`
    )
    .join("");
  list.dataset.questions = JSON.stringify(questions);
}

document.getElementById("back-btn").addEventListener("click", () => showScreen("input"));

document.getElementById("continue-btn").addEventListener("click", async () => {
  const questions = JSON.parse(document.getElementById("questions-list").dataset.questions || "[]");
  state.answers = questions.map((q, i) => ({
    question: q.question,
    answer: document.getElementById(`q-${i}`).value,
    default_if_skipped: q.default_if_skipped,
  }));
  await doGenerate();
});

const UNAUTHORIZED = Symbol("unauthorized");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generation can take well over a minute. Rather than one long request
// (which serverless hosting can't reliably keep open that long), this
// starts a job and polls for its result — works the same locally and when
// deployed.
async function pollForResult(jobId) {
  const POLL_INTERVAL_MS = 2500;
  const MAX_WAIT_MS = 3 * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(`/api/generate-status?jobId=${encodeURIComponent(jobId)}`, {
      headers: authHeaders(),
    });
    if (res.status === 401) return UNAUTHORIZED;
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    const job = await res.json();
    if (job.status === "done") return job.result;
    if (job.status === "error") throw new Error(job.error || "Generation failed.");
    // else "pending" — keep polling
  }
  throw new Error("This is taking longer than expected. Please try again.");
}

async function doGenerate(regenerate) {
  startLoading();
  resultError.hidden = true;
  try {
    const startRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        request: state.request,
        targetModel: state.targetModel,
        mode: state.mode,
        level: regenerate ? "auto" : state.level,
        interview: state.interview,
        answers: state.answers,
        regenerate,
      }),
    });
    if (startRes.status === 401) return handleUnauthorized();
    if (!startRes.ok) throw new Error((await startRes.json()).error || "Request failed");
    const { jobId } = await startRes.json();

    const result = await pollForResult(jobId);
    if (result === UNAUTHORIZED) return handleUnauthorized();

    state.lastResult = result;
    stopLoading();
    renderResult(result);
    showScreen("result");
  } catch (err) {
    stopLoading();
    if (state.lastResult) {
      showScreen("result");
    } else {
      showScreen("input");
    }
    resultError.textContent = err.message || "Something went wrong. Please try again.";
    resultError.hidden = false;
  }
}

function renderResult(result) {
  document.getElementById("prompt-text").textContent = result.generated_prompt;

  const expList = document.getElementById("explanation-list");
  expList.innerHTML = result.explanation
    .map((e) => `<li><strong>${escapeHtml(e.component)}</strong> — ${escapeHtml(e.text)}</li>`)
    .join("") || "<li>No components needed explaining for a prompt this simple.</li>";

  document.getElementById("score-overall").textContent = `${Math.round(result.score.overall)}/100`;
  document.getElementById("score-limiting").textContent = result.score.limiting_factor
    ? `Held back by: ${result.score.limiting_factor}`
    : "";
  document.getElementById("score-rationale").textContent = result.score.rationale;

  const categories = [
    ["Goal clarity", result.score.goal_clarity],
    ["Completeness", result.score.completeness],
    ["Context quality", result.score.context_quality],
    ["Constraint quality", result.score.constraint_quality],
    ["Output clarity", result.score.output_clarity],
    ["Ambiguity reduction", result.score.ambiguity_reduction],
    ["Model fit", result.score.model_fit],
    ["Efficiency", result.score.efficiency],
  ];
  document.getElementById("score-categories").innerHTML = categories
    .map(
      ([label, value]) => `
      <div class="score-cat">
        ${label}
        <div class="score-cat-bar"><div class="score-cat-bar-fill" style="width:${value}%"></div></div>
      </div>`
    )
    .join("");

  document.getElementById("detail-model").textContent = result.model_adapter_used;
  document.getElementById("detail-level").textContent = result.level_used + " — " + result.level_reason;
  document.getElementById("detail-components").innerHTML = result.components_used
    .map((c) => `<span class="chip" title="${escapeHtml(c.why)}">${escapeHtml(c.name)}</span>`)
    .join("");

  fillList("detail-refinements", result.refinements_made, "No changes were needed after the first draft.");
  fillList("detail-bloat", result.bloat_removed, "Nothing needed removing.");
  fillList("detail-assumptions", result.assumptions_made, "No assumptions were necessary.");
}

function fillList(id, items, emptyText) {
  const el = document.getElementById(id);
  el.innerHTML = items.length
    ? items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : `<li>${emptyText}</li>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("copy-btn").addEventListener("click", async () => {
  const text = document.getElementById("prompt-text").textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copy-btn");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  } catch {
    resultError.textContent = "Couldn't copy automatically — please select and copy the text manually.";
    resultError.hidden = false;
  }
});

document.getElementById("simpler-btn").addEventListener("click", () => {
  doGenerate({ direction: "simpler", previousPrompt: state.lastResult.generated_prompt });
});
document.getElementById("stronger-btn").addEventListener("click", () => {
  doGenerate({ direction: "stronger", previousPrompt: state.lastResult.generated_prompt });
});

document.getElementById("start-over-btn").addEventListener("click", () => {
  requestInput.value = "";
  state.interview = null;
  state.answers = [];
  state.lastResult = null;
  showScreen("input");
});
