import type { ExplainRequest, ExplainResponse } from "../types";
import { explainWithGroq } from "./groq";

export async function explainCode(
  request: ExplainRequest,
): Promise<{ response: ExplainResponse; prompt: string }> {
  return explainWithGroq(request);
}
