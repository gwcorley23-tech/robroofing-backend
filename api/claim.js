// Vercel serverless function: POST /api/claim
// Generates a structured preliminary roof inspection & insurance claim report
// from an uploaded photo. The front-end turns this JSON into a branded PDF.
import { runClaimReport } from "../claude.js";
import { applyCors } from "./_cors.js";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handled OPTIONS preflight
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    let { image, mediaType, notes, owner, address } = req.body || {};
    if (!image) return res.status(400).json({ error: "Body must include { image }" });

    const m = image.match(/^data:(.+?);base64,(.*)$/s);
    if (m) {
      mediaType = mediaType || m[1];
      image = m[2];
    }
    mediaType = mediaType || "image/jpeg";

    const { report, usage } = await runClaimReport({ base64: image, mediaType, notes, owner, address });
    res.status(200).json({ report, usage });
  } catch (err) {
    console.error("claim error:", err);
    res.status(500).json({ error: "claim_failed", detail: err.message });
  }
}
