// Shared Claude logic for both the local Express server and serverless functions.
// The API key lives ONLY on the server — never ship it to the browser.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// Default to Opus 4.7. Override per-endpoint via env if you want cheaper chat.
const CHAT_MODEL = process.env.CHAT_MODEL || "claude-opus-4-7";
const TRIAGE_MODEL = process.env.TRIAGE_MODEL || "claude-opus-4-7";

const COMPANY = `Rooftoprob Roofing & Construction
Owner: Robert Mills ("Rooftop Rob")
Address: 4040 San Felipe #138, Houston, TX 77027
Phone: (346) 826-4424   Email: rooftoprob2.0@gmail.com   Instagram: @rooftoprobroofingllc
Service area: Houston, Harris County and surrounding Texas communities.
Services: roof repair, full roof replacement, storm & hail damage, drone roof inspections, gutters, general construction.
Promise: Licensed. Insured. Trusted. "We do it the right way — because it's the only way."`;

// Stable system prompt for the lead-qualifying chat assistant.
const CHAT_SYSTEM = `You are "Rob's Assistant", the friendly virtual front desk for Rooftoprob Roofing & Construction in Houston, TX.

Company facts (always accurate, never contradict these):
${COMPANY}

Your job: welcome homeowners, answer roofing questions plainly, and gently qualify the lead by collecting — over a natural conversation, not an interrogation:
 1. Name
 2. Property address or at least the city/neighborhood
 3. Best phone number
 4. What's going on with the roof (leak, missing shingles, storm/hail, age, inspection, etc.)
 5. How urgent it is (active leak vs. planning ahead)

Guidance:
 - Be warm, concise, and local. Sound like a trustworthy Houston contractor, not a corporate bot.
 - Roofing damage from storms or hail is often covered by insurance. Mention that Rooftoprob does FREE drone inspections and helps homeowners navigate insurance claims, including Texas Insurance Code §542.052 (which requires insurers to act promptly on claims). Do NOT give legal advice — just point it out.
 - NEVER quote a firm price or guarantee insurance approval. For estimates, say Rob will confirm after a free inspection.
 - When you have enough info (or the person wants to talk to a human), summarize their details back and tell them Rob will reach out, or they can call (346) 826-4424 right now.
 - Keep replies short — 1 to 4 sentences. Ask one question at a time.
 - If asked something off-topic, briefly redirect to roofing/Rooftoprob.`;

// Stable system prompt for the roof-photo triage assistant.
const TRIAGE_SYSTEM = `You are a senior roofing inspector for Rooftoprob Roofing & Construction in Houston, TX. A homeowner has uploaded a photo of their roof. Assess it from the image only.

You are NOT giving a binding quote or a guaranteed insurance outcome — you are giving a helpful preliminary read that encourages a free professional drone inspection.

Respond with ONLY a JSON object (no markdown fences, no prose around it) in exactly this shape:
{
  "roof_type": "string — e.g. asphalt shingle, metal, tile, flat/TPO, unclear",
  "visible_issues": ["short bullet strings of what you can actually see"],
  "severity": "none | minor | moderate | severe | cannot tell",
  "likely_storm_or_hail": true | false,
  "insurance_claim_worth_exploring": true | false,
  "recommended_next_step": "one or two friendly sentences for the homeowner",
  "confidence": "low | medium | high",
  "summary": "2-3 sentence plain-English summary the homeowner will see"
}

Be honest about uncertainty — if the photo is blurry, dark, or doesn't clearly show a roof, say so via low confidence and "cannot tell". Never invent damage that isn't visible.`;

// Pull the assistant's text out of a Messages response.
function textOf(message) {
  return message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export async function runChat(history) {
  // history: [{ role: "user"|"assistant", content: "..." }, ...]
  const message = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: CHAT_SYSTEM,
        cache_control: { type: "ephemeral" }, // frozen prefix → cache hit on every follow-up turn
      },
    ],
    messages: history,
  });

  return {
    reply: textOf(message),
    usage: message.usage, // includes cache_read_input_tokens so you can confirm caching works
  };
}

export async function runTriage({ base64, mediaType, notes }) {
  const userBlocks = [
    {
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    },
    {
      type: "text",
      text: notes
        ? `Homeowner note: ${notes}\n\nAssess this roof photo.`
        : "Assess this roof photo.",
    },
  ];

  const message = await client.messages.create({
    model: TRIAGE_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: TRIAGE_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userBlocks }],
  });

  const raw = textOf(message);
  let assessment;
  try {
    assessment = JSON.parse(raw);
  } catch {
    // If the model wrapped it in fences or added prose, salvage the JSON object.
    const match = raw.match(/\{[\s\S]*\}/);
    assessment = match ? JSON.parse(match[0]) : { summary: raw };
  }

  return { assessment, usage: message.usage };
}
