import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set in the server environment.");
}

export const CHAT_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 768;

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/** Gemini models occasionally return transient 503/UNAVAILABLE under load; retry with backoff before giving up. */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 500): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number }).status;
      const isRetryable = typeof status === "number" && RETRYABLE_STATUS_CODES.has(status);
      if (!isRetryable || attempt >= retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
}

export async function embedText(text: string): Promise<number[]> {
  const res = await withRetry(() =>
    ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    }),
  );

  const values = res.embeddings?.[0]?.values;
  if (!values) throw new Error("Gemini returned no embedding for the given text.");
  return values;
}

export async function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  return withRetry(() => ai.models.generateContent(params));
}
