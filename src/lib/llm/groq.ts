import Groq from "groq-sdk";

import { getEnv, requireGroqApiKey } from "../env";
import { AppError } from "../errors";
import { buildExplainPrompt } from "../prompt";
import { explainResponseSchema } from "../schemas";
import type { ExplainRequest, ExplainResponse } from "../types";

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

function parseModelJson(raw: string): ExplainResponse {
  const cleaned = stripMarkdownFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError(
      "BAD_MODEL_OUTPUT",
      "Model returned non-JSON output. Try again with a smaller snippet.",
      502,
    );
  }
  const result = explainResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      "BAD_MODEL_OUTPUT",
      "Model JSON did not match the expected { detectedLanguage, explanation, complexity, notes } shape.",
      502,
    );
  }
  return result.data;
}

export async function explainWithGroq(
  request: ExplainRequest,
): Promise<{ response: ExplainResponse; prompt: string }> {
  const apiKey = requireGroqApiKey();
  const env = getEnv();
  const prompt = buildExplainPrompt(request);

  const client = new Groq({ apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.groqTimeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model: env.groqModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You return only valid JSON objects matching the user's schema. No markdown.",
          },
          { role: "user", content: prompt },
        ],
      },
      { signal: controller.signal },
    );

    const content = completion.choices[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new AppError(
        "BAD_MODEL_OUTPUT",
        "Model returned an empty response.",
        502,
      );
    }

    return { response: parseModelJson(content), prompt };
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "AbortError")
    ) {
      throw new AppError(
        "UPSTREAM_TIMEOUT",
        `Groq request timed out after ${env.groqTimeoutMs}ms.`,
        504,
      );
    }

    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : undefined;

    if (status === 429) {
      throw new AppError(
        "UPSTREAM",
        "Groq rate limit hit. Wait and try again. Do not enable paid billing—lower app limits instead.",
        502,
        30,
      );
    }

    const message =
      err instanceof Error ? err.message : "Unknown upstream error from Groq.";
    throw new AppError("UPSTREAM", message, 502);
  } finally {
    clearTimeout(timer);
  }
}
