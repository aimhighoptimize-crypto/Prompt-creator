// In-memory job store for local dev only. A long-running Node process has no
// serverless timeout to work around, but the frontend always talks to the
// app through a start-job/poll-for-result flow (see routes/generate.js and
// netlify/functions/generate*.js), so this keeps local behavior identical to
// deployed behavior instead of branching the client on environment.
const jobs = new Map();

export function createLocalJob(jobId) {
  jobs.set(jobId, { status: "pending" });
}

export function runLocalJob(jobId, workPromise) {
  workPromise
    .then((result) => jobs.set(jobId, { status: "done", result }))
    .catch((err) => {
      console.error("generate error:", err);
      jobs.set(jobId, {
        status: "error",
        error: "Prompt Architect couldn't generate a prompt right now. Please try again.",
      });
    });
}

export function getLocalJob(jobId) {
  return jobs.get(jobId) || { status: "pending" };
}
