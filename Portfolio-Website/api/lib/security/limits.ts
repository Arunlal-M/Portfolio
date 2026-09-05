import { z } from "zod";

// ---------------------------------------------------------------------------
// Input validation schemas
// ---------------------------------------------------------------------------

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(20)
    .optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const RecommendProjectRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
});
export type RecommendProjectRequest = z.infer<typeof RecommendProjectRequestSchema>;

export const AnalyzeContactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(3000),
});
export type AnalyzeContactRequest = z.infer<typeof AnalyzeContactRequestSchema>;

/** Strips control/non-printable characters that don't belong in normal text input. */
export function stripControlCharacters(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// Best-effort, in-memory, per-instance sliding window. Serverless instances
// are ephemeral and may scale to multiple concurrent instances, so this is
// not a hard guarantee — it's a cheap first line of defense against casual
// abuse, appropriate for a low-traffic portfolio site. A durable limiter
// (Upstash/Vercel KV) would be needed for stronger guarantees.

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    requestLog.set(key, timestamps);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return ip?.trim() ?? "unknown";
}
