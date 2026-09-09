import { generateContent, CHAT_MODEL } from "./lib/ai/models.js";
import { CHAT_SYSTEM_PROMPT, formatContextBlock } from "./lib/ai/prompts.js";
import { retrievePortfolioContext } from "./lib/ai/tools.js";
import { ChatRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits.js";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = rateLimit(`chat:${ip}`, 20, 5 * 60 * 1000);
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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const message = stripControlCharacters(parsed.data.message);
  const history = parsed.data.history ?? [];

  try {
    const context = await retrievePortfolioContext(message);
    const contextBlock = formatContextBlock(context);

    const contents = [
      ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.content }] })),
      { role: "user" as const, parts: [{ text: `${contextBlock}\n\nVisitor question: ${message}` }] },
    ];

    const result = await generateContent({
      model: CHAT_MODEL,
      contents,
      config: { systemInstruction: CHAT_SYSTEM_PROMPT },
    });

    const reply = result.text;
    if (!reply) {
      return Response.json({ error: "No response generated" }, { status: 502 });
    }

    return Response.json({ reply });
  } catch (err) {
    console.error("[api/chat]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
