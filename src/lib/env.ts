import { AppError } from "./errors";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export type AppEnv = {
  groqApiKey: string | undefined;
  groqModel: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  maxInFlight: number;
  maxCodeChars: number;
  maxEstimatedInputTokens: number;
  groqTimeoutMs: number;
};

export function getEnv(): AppEnv {
  return {
    groqApiKey: process.env.GROQ_API_KEY?.trim() || undefined,
    groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    rateLimitPerMinute: parsePositiveInt(process.env.RATE_LIMIT_PER_MINUTE, 5),
    rateLimitPerDay: parsePositiveInt(process.env.RATE_LIMIT_PER_DAY, 50),
    maxInFlight: Math.max(1, parsePositiveInt(process.env.MAX_IN_FLIGHT, 1)),
    maxCodeChars: parsePositiveInt(process.env.MAX_CODE_CHARS, 6000),
    maxEstimatedInputTokens: parsePositiveInt(
      process.env.MAX_ESTIMATED_INPUT_TOKENS,
      4000,
    ),
    groqTimeoutMs: parsePositiveInt(process.env.GROQ_TIMEOUT_MS, 30000),
  };
}

export function requireGroqApiKey(): string {
  const key = getEnv().groqApiKey;
  if (!key) {
    throw new AppError(
      "CONFIG",
      "GROQ_API_KEY is missing. Add it to .env.local (see .env.example).",
      500,
    );
  }
  return key;
}
