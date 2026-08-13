import { NextResponse } from "next/server";

import { AppError } from "@/src/lib/errors";
import { explainCode } from "@/src/lib/llm";
import { buildExplainPrompt } from "@/src/lib/prompt";
import {
  assertCodeWithinLimits,
  assertEstimatedTokensWithinLimits,
  getStatus,
  releaseInFlight,
  tryReserve,
} from "@/src/lib/quota";
import { explainRequestSchema } from "@/src/lib/schemas";
import type { ExplainSuccessBody } from "@/src/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let reserved = false;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION", "Request body must be JSON.", 400);
    }

    const parsed = explainRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      throw new AppError("VALIDATION", msg || "Invalid request.", 400);
    }

    const input = parsed.data;
    assertCodeWithinLimits(input.code);

    const promptPreview = buildExplainPrompt(input);
    assertEstimatedTokensWithinLimits(promptPreview.length);

    await tryReserve();
    reserved = true;

    const { response } = await explainCode(input);

    await releaseInFlight();
    reserved = false;

    const quota = await getStatus();
    const payload: ExplainSuccessBody = {
      ...response,
      quota,
    };

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof AppError) {
      const res = NextResponse.json(err.toJSON(), { status: err.status });
      if (err.retryAfterSec !== undefined) {
        res.headers.set("Retry-After", String(err.retryAfterSec));
      }
      return res;
    }

    console.error("Unexpected /api/explain error", err);
    const appErr = new AppError("UPSTREAM", "Unexpected server error.", 502);
    return NextResponse.json(appErr.toJSON(), { status: 502 });
  } finally {
    if (reserved) {
      try {
        await releaseInFlight();
      } catch (releaseErr) {
        console.error("Failed to release in-flight quota", releaseErr);
      }
    }
  }
}
