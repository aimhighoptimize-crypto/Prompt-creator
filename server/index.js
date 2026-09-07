import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import interviewRoute from "./routes/interview.js";
import generateRoute from "./routes/generate.js";
import { listAdapters } from "./adapters/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: "100kb" }));

app.get("/api/models", (req, res) => {
  res.json(listAdapters());
});

app.use("/api/interview", interviewRoute);
app.use("/api/generate", generateRoute);

app.use(express.static(join(__dirname, "..", "public")));

// Fallback error handler — never leak internals to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Prompt Architect listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNING: ANTHROPIC_API_KEY is not set. Generation requests will fail until it is.");
  }
});
