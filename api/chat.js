// Vercel serverless function: POST /api/chat
// Deploy this folder to Vercel and set ANTHROPIC_API_KEY in the project env.
import { runChat } from "../claude.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Body must be { messages: [{role, content}, ...] }" });
    }
    const { reply, usage } = await runChat(messages);
    res.status(200).json({ reply, usage });
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "chat_failed", detail: err.message });
  }
}
