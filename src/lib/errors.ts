import type { ApiErrorBody, ApiErrorCode } from "./types";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    retryAfterSec?: number,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }

  toJSON(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.retryAfterSec !== undefined
          ? { retryAfterSec: this.retryAfterSec }
          : {}),
      },
    };
  }
}

export function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "VALIDATION":
      return 400;
    case "PAYLOAD_TOO_LARGE":
      return 400;
    case "RATE_LIMITED":
      return 429;
    case "QUOTA_EXCEEDED":
      return 429;
    case "CONFIG":
      return 500;
    case "UPSTREAM_TIMEOUT":
      return 504;
    case "BAD_MODEL_OUTPUT":
      return 502;
    case "UPSTREAM":
    default:
      return 502;
  }
}
