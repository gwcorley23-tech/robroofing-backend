// Local Express test server for the Rooftoprob Claude backend.
// Run: npm install && cp .env.example .env  (fill in your key)  && npm start
import "dotenv/config";
import express from "express";
import cors from "cors";
import { runChat, runTriage, runClaimReport } from "./claude.js";

const app = express();
app.use(express.json({ limit: "12mb" })); // roof photos arrive as base64

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl (no Origin header) and any whitelisted origin
      if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed`));
    },
  })
);

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("⚠  ANTHROPIC_API_KEY is not set — copy .env.example to .env and add your key.");
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Body must be { messages: [{role, content}, ...] }" });
    }
    const { reply, usage } = await runChat(messages);
    res.json({ reply, usage });
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "chat_failed", detail: err.message });
  }
});

app.post("/api/triage", async (req, res) => {
  try {
    let { image, mediaType, notes } = req.body || {};
    if (!image) return res.status(400).json({ error: "Body must include { image } (base64 or data URL)" });

    // Accept a full data URL ("data:image/jpeg;base64,....") or a bare base64 string.
    const m = image.match(/^data:(.+?);base64,(.*)$/s);
    if (m) {
      mediaType = mediaType || m[1];
      image = m[2];
    }
    mediaType = mediaType || "image/jpeg";

    const { assessment, usage } = await runTriage({ base64: image, mediaType, notes });
    res.json({ assessment, usage });
  } catch (err) {
    console.error("triage error:", err);
    res.status(500).json({ error: "triage_failed", detail: err.message });
  }
});

app.post("/api/claim", async (req, res) => {
  try {
    let { image, mediaType, notes, owner, address } = req.body || {};
    if (!image) return res.status(400).json({ error: "Body must include { image } (base64 or data URL)" });

    const m = image.match(/^data:(.+?);base64,(.*)$/s);
    if (m) {
      mediaType = mediaType || m[1];
      image = m[2];
    }
    mediaType = mediaType || "image/jpeg";

    const { report, usage } = await runClaimReport({ base64: image, mediaType, notes, owner, address });
    res.json({ report, usage });
  } catch (err) {
    console.error("claim error:", err);
    res.status(500).json({ error: "claim_failed", detail: err.message });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Rooftoprob backend listening on http://localhost:${port}`));
