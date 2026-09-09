import { generateContent, CHAT_MODEL } from "./lib/ai/models.js";
import { CONTACT_ANALYSIS_SYSTEM_PROMPT, ContactAnalysisResultSchema } from "./lib/ai/prompts.js";
import { insertContactMessage } from "./lib/db/queries.js";
import { AnalyzeContactRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits.js";

export const config = { runtime: "nodejs" };
export const maxDuration = 60; // Set to 60 seconds to prevent AI timeouts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() ?? "unknown";
  
  const { allowed, retryAfterMs } = rateLimit(`analyze-contact:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    res.setHeader("Retry-After", String(Math.ceil((retryAfterMs ?? 0) / 1000)));
    return res.status(429).json({ error: "Too many requests, please try again shortly." });
  }

  const body = req.body;
  const parsed = AnalyzeContactRequestSchema.safeParse(body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const { name, email } = parsed.data;
  const message = stripControlCharacters(parsed.data.message);

  try {
    const result = await generateContent({
      model: CHAT_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` }],
        },
      ],
      config: {
        systemInstruction: CONTACT_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const rawText = result.text;
    if (!rawText) {
      return res.status(502).json({ error: "No response generated" });
    }

    const analysisParsed = ContactAnalysisResultSchema.safeParse(JSON.parse(rawText));
    if (!analysisParsed.success) {
      console.error("[api/analyze-contact] model returned unexpected shape", analysisParsed.error.flatten());
      return res.status(502).json({ error: "Analysis failed" });
    }

    const analysis = analysisParsed.data;
    const saved = await insertContactMessage({
      name,
      email,
      message,
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      priority: analysis.priority,
      category: analysis.category,
      ai_reply: analysis.ai_reply,
    });

    return res.status(200).json({ id: saved.id, analysis });
  } catch (err) {
    console.error("[api/analyze-contact]", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
