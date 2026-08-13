import type { Audience } from "./types";

export function buildExplainPrompt(input: {
  code: string;
  language?: string;
  audience: Audience;
}): string {
  const languageHint =
    input.language && input.language !== "auto"
      ? `Language hint from the user: ${input.language}.`
      : "Language: detect from the snippet if possible.";

  const audienceInstructions =
    input.audience === "beginner"
      ? `Audience: beginner. Use plain language, avoid jargon, define terms briefly when needed.`
      : `Audience: technical. Be precise; you may use standard CS terms freely.`;

  return `You are a code explanation assistant. Analyze the code snippet and respond with JSON only.

${audienceInstructions}
${languageHint}

Return a single JSON object with exactly these string fields:
- "detectedLanguage": the programming language of the snippet (use the user hint when given and plausible; otherwise detect). Use a short common name (e.g. "TypeScript", "Python"). If unclear, use "Unknown".
- "explanation": plain-English what the code does and how it works
- "complexity": How hard a human would find this snippet to understand and change — not runtime Big-O. Start with a level (Low, Moderate, or High), then a short reason about structure: nesting, branching, indirection, abstractions, mental load. Example: "Moderate — nested conditionals and a helper callback make the flow take a second look." Never use Big-O or "n/a".
- "notes": Specific readability / red-flag notes (unclear naming, fragile patterns, surprising side effects). Do not repeat the overall complexity rating; focus on concrete issues. If none, say so briefly.

Rules:
- Output valid JSON only. No markdown fences. No commentary outside JSON.
- Do not invent behavior that is not in the code.
- "complexity" is perceived structural difficulty for a human, never algorithmic time/space complexity.

Code:
\`\`\`
${input.code}
\`\`\`
`;
}
