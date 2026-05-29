// Vercel serverless function: POST /api/triage
import { runTriage } from "../claude.js";
import { applyCors } from "./_cors.js";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handled OPTIONS preflight
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    let { image, mediaType, notes } = req.body || {};
    if (!image) return res.status(400).json({ error: "Body must include { image }" });

    const m = image.match(/^data:(.+?);base64,(.*)$/s);
    if (m) {
      mediaType = mediaType || m[1];
      image = m[2];
    }
    mediaType = mediaType || "image/jpeg";

    const { assessment, usage } = await runTriage({ base64: image, mediaType, notes });
    res.status(200).json({ assessment, usage });
  } catch (err) {
    console.error("triage error:", err);
    res.status(500).json({ error: "triage_failed", detail: err.message });
  }
}
