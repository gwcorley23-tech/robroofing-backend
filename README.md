# Rooftoprob Claude Backend

Two Claude-powered endpoints for the Rooftoprob Roofing website:

- **`POST /api/chat`** — a friendly, lead-qualifying chat assistant ("Rob's Assistant").
- **`POST /api/triage`** — uploads a roof photo and returns a structured preliminary assessment using Claude's vision.

Both share `claude.js`, which holds the system prompts and Anthropic SDK calls. The model is **`claude-opus-4-7`** with adaptive thinking, and the (stable) system prompts are sent with `cache_control: ephemeral` so repeat calls get prompt-cache hits.

> 🔒 **Security:** your `ANTHROPIC_API_KEY` lives only on the server (in `.env` locally, or the host's env vars in production). It is **never** sent to the browser. The website calls *this* backend; this backend calls Anthropic.

---

## Run locally

```bash
cd rooftoprob-backend
npm install
cp .env.example .env        # then edit .env and paste your real ANTHROPIC_API_KEY
npm start                   # → http://localhost:8787
```

Quick test:

```bash
curl http://localhost:8787/api/health

curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"My roof is leaking after the storm, can you help?"}]}'
```

The `usage` field in each response includes `cache_read_input_tokens` — once you've made more than one chat call, that number going up confirms prompt caching is working.

---

## Connect the website

In `rooftoprob.html` the widgets read a single config value, `API_BASE`. Point it at wherever this backend runs:

- Local test: `http://localhost:8787`
- Production: your deployed URL, e.g. `https://rooftoprob-backend.vercel.app`

Set `ALLOWED_ORIGINS` in `.env` (or your host's env) to the site's origin so the browser is allowed to call the API.

---

## Deploy (the AI part needs a real server)

GitHub Pages serves **static files only** — it cannot run these endpoints or hold a secret key. Host the backend separately:

### Vercel (easiest — `api/chat.js` and `api/triage.js` are ready to go)

```bash
npm i -g vercel
vercel            # follow prompts
vercel env add ANTHROPIC_API_KEY     # paste your key (Production + Preview)
vercel env add ALLOWED_ORIGINS       # e.g. https://rooftoprobroofing.com
vercel --prod
```

Your endpoints will be `https://<project>.vercel.app/api/chat` and `/api/triage`.

### Any Node host (Render, Railway, Fly, a VPS)

Run `npm start` (the Express `server.js`) with `ANTHROPIC_API_KEY` set in the environment.

---

## Files

| File | Purpose |
|---|---|
| `claude.js` | Shared Anthropic SDK calls + system prompts (chat & triage) |
| `server.js` | Local Express server exposing `/api/chat`, `/api/triage`, `/api/health` |
| `api/chat.js`, `api/triage.js` | Vercel serverless wrappers around the same logic |
| `.env.example` | Template — copy to `.env`, add your key |
