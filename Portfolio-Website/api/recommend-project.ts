import { recommendProjects } from "./lib/ai/tools";
import { RecommendProjectRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = rateLimit(`recommend-project:${ip}`, 20, 5 * 60 * 1000);
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

  const parsed = RecommendProjectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const query = stripControlCharacters(parsed.data.query);

  try {
    const projects = await recommendProjects(query);
    return Response.json({ projects });
  } catch (err) {
    console.error("[api/recommend-project]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
