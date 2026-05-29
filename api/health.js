// Vercel serverless function: GET /api/health — simple uptime check.
import { applyCors } from "./_cors.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return; // handled OPTIONS preflight
  res.status(200).json({ ok: true });
}
