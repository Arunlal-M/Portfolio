import { recommendProjects } from "./lib/ai/tools.js";
import { RecommendProjectRequestSchema, rateLimit, stripControlCharacters } from "./lib/security/limits.js";

export const config = { runtime: "nodejs" };
export const maxDuration = 60; // Set to 60 seconds to prevent AI timeouts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() ?? "unknown";
  
  const { allowed, retryAfterMs } = rateLimit(`recommend-project:${ip}`, 20, 5 * 60 * 1000);
  if (!allowed) {
    res.setHeader("Retry-After", String(Math.ceil((retryAfterMs ?? 0) / 1000)));
    return res.status(429).json({ error: "Too many requests, please try again shortly." });
  }

  const body = req.body;
  const parsed = RecommendProjectRequestSchema.safeParse(body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const query = stripControlCharacters(parsed.data.query);

  try {
    const projects = await recommendProjects(query);
    return res.status(200).json({ projects });
  } catch (err) {
    console.error("[api/recommend-project]", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
