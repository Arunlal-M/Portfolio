import { generateContent, CHAT_MODEL } from "./lib/ai/models.js";
import { CHAT_SYSTEM_PROMPT, formatContextBlock } from "./lib/ai/prompts.js";
import { retrievePortfolioContext } from "./lib/ai/tools.js";
import { ChatRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits.js";

export const config = { runtime: "nodejs" };
export const maxDuration = 60; // Set to 60 seconds to prevent AI timeouts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() ?? "unknown";
  
  const { allowed, retryAfterMs } = rateLimit(`chat:${ip}`, 20, 5 * 60 * 1000);
  if (!allowed) {
    res.setHeader("Retry-After", String(Math.ceil((retryAfterMs ?? 0) / 1000)));
    return res.status(429).json({ error: "Too many requests, please try again shortly." });
  }

  const body = req.body;
  const parsed = ChatRequestSchema.safeParse(body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const message = stripControlCharacters(parsed.data.message);
  const history = parsed.data.history ?? [];

  try {
    const context = await retrievePortfolioContext(message);
    const contextBlock = formatContextBlock(context);

    const contents = [
      ...history.map((turn: any) => ({ role: turn.role, parts: [{ text: turn.content }] })),
      { role: "user" as const, parts: [{ text: `${contextBlock}\n\nVisitor question: ${message}` }] },
    ];

    const result = await generateContent({
      model: CHAT_MODEL,
      contents,
      config: { systemInstruction: CHAT_SYSTEM_PROMPT },
    });

    const reply = result.text;
    if (!reply) {
      return res.status(502).json({ error: "No response generated" });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[api/chat]", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
