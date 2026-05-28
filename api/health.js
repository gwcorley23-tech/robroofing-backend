// Vercel serverless function: GET /api/health — simple uptime check.
export default function handler(_req, res) {
  res.status(200).json({ ok: true });
}
