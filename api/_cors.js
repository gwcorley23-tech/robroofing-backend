// Shared CORS helper for the Vercel serverless functions.
// GitHub Pages (github.io) and the Vercel backend are different origins, so the
// browser enforces CORS — without these headers it blocks the response and the
// site falls back to "offline" mode even when the backend actually answered.
//
// ALLOWED_ORIGINS is a comma-separated list set in the Vercel project env, e.g.
//   https://gwcorley23-tech.github.io
// If it's unset we allow all origins ("*") so nothing silently breaks.

function allowedList() {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Apply CORS headers. Returns true if the request was a preflight (OPTIONS)
// and has already been answered — the caller should then return immediately.
export function applyCors(req, res) {
  const list = allowedList();
  const origin = req.headers.origin;

  if (list.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && list.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    // Origin not on the allow-list: still set the first allowed one so a
    // misconfigured ALLOWED_ORIGINS is easy to spot, but the browser will block.
    res.setHeader("Access-Control-Allow-Origin", list[0]);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
