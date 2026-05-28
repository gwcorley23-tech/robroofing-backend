# Next steps — get the AI assistant live

The backend code is done and committed locally. Three things remain. Steps ① and ② need YOUR
accounts (GitHub, Vercel, Anthropic); Claude does step ③ for you.

Live site (already deployed): https://gwcorley23-tech.github.io/robroofing/

---

## ① Create the backend repo on GitHub  (~30 sec)
1. Open <https://github.com/new>
2. **Repository name:** `robroofing-backend`
3. **Public**. Do **NOT** tick any "Add a file" / README / .gitignore boxes.
4. Click **Create repository**.
5. The repo URL will be: `https://github.com/gwcorley23-tech/robroofing-backend.git`
6. Tell Claude the URL → Claude pushes the code for you. (You can also push it yourself:)
   ```bash
   cd rooftoprob-backend
   git remote add origin https://github.com/gwcorley23-tech/robroofing-backend.git
   git push -u origin main
   ```

---

## ② Deploy on Vercel  (~2 min)
1. Get an Anthropic API key: <https://console.anthropic.com/settings/keys> → **Create Key** → copy
   the `sk-ant-...` value. (Add a little billing credit under **Billing** if the account is new.)
2. Go to <https://vercel.com> → **Log in with GitHub**.
3. **Add New… → Project** → find `robroofing-backend` → **Import**.
4. Expand **Environment Variables** and add these two BEFORE deploying:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your `sk-ant-...` key |
   | `ALLOWED_ORIGINS` | `https://gwcorley23-tech.github.io` |

5. Click **Deploy**. Wait ~1 min.
6. Copy the URL Vercel gives you, e.g. `https://robroofing-backend.vercel.app`.
7. Test it — open `https://robroofing-backend.vercel.app/api/health` in your browser.
   You should see `{"ok":true}`.

> 🔒 Your API key lives only in Vercel's environment. It is never in the website or the public repo.

---

## ③ Connect the website  (Claude does this)
Give Claude your Vercel URL. Claude adds ONE line to the site's `index.html`, just before `</head>`:

```html
<script>window.ROOFTOPROB_API_BASE = "https://robroofing-backend.vercel.app";</script>
```

Then Claude pushes it. ~1 min later, the chat gives real Claude answers and the roof-photo
check analyzes uploads. Until this line is set, the widgets stay in safe "offline mode"
(they point visitors to call (346) 826-4424) — nothing is ever broken.

---

## Cost note
The Anthropic API charges per message (model: `claude-opus-4-7`). A typical chat reply or photo
analysis is a fraction of a cent to a few cents. To cut chat costs later, set a `CHAT_MODEL`
env var in Vercel to `claude-haiku-4-5` (cheaper, still good for front-desk chat).
