export type Audience = "beginner" | "technical";

export type ExplainRequest = {
  code: string;
  language?: string;
  audience: Audience;
};

export type ExplainResponse = {
  detectedLanguage: string;
  explanation: string;
  complexity: string;
  notes: string;
};

export type QuotaStatus = {
  remainingDay: number;
  remainingMinute: number;
  inFlight: number;
};

export type ApiErrorCode =
  | "VALIDATION"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "UPSTREAM"
  | "UPSTREAM_TIMEOUT"
  | "BAD_MODEL_OUTPUT"
  | "CONFIG";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    retryAfterSec?: number;
  };
};

export type ExplainSuccessBody = ExplainResponse & {
  quota: QuotaStatus;
};
