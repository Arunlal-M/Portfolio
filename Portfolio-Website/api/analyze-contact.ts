import { generateContent, CHAT_MODEL } from "./lib/ai/models.js";
import { CONTACT_ANALYSIS_SYSTEM_PROMPT, ContactAnalysisResultSchema } from "./lib/ai/prompts.js";
import { insertContactMessage } from "./lib/db/queries.js";
import { AnalyzeContactRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits.js";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = rateLimit(`analyze-contact:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return Response.json(
      { error: "Too many requests, please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 0) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnalyzeContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
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
      return Response.json({ error: "No response generated" }, { status: 502 });
    }

    const analysisParsed = ContactAnalysisResultSchema.safeParse(JSON.parse(rawText));
    if (!analysisParsed.success) {
      console.error("[api/analyze-contact] model returned unexpected shape", analysisParsed.error.flatten());
      return Response.json({ error: "Analysis failed" }, { status: 502 });
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

    return Response.json({ id: saved.id, analysis });
  } catch (err) {
    console.error("[api/analyze-contact]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
