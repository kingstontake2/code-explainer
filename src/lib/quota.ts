import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { getEnv } from "./env";
import { AppError } from "./errors";
import type { QuotaStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const QUOTA_PATH = path.join(DATA_DIR, "quota.json");
const QUOTA_TMP_PATH = path.join(DATA_DIR, "quota.json.tmp");

type QuotaState = {
  dayKey: string;
  dayCount: number;
  minuteWindowStartMs: number;
  minuteCount: number;
  inFlight: number;
};

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function emptyState(now = Date.now()): QuotaState {
  return {
    dayKey: utcDayKey(new Date(now)),
    dayCount: 0,
    minuteWindowStartMs: now,
    minuteCount: 0,
    inFlight: 0,
  };
}

/** Normalize windows: roll day and minute counters when expired. */
export function normalizeState(state: QuotaState, now = Date.now()): QuotaState {
  const next = { ...state };
  const today = utcDayKey(new Date(now));
  if (next.dayKey !== today) {
    next.dayKey = today;
    next.dayCount = 0;
  }
  if (now - next.minuteWindowStartMs >= 60_000) {
    next.minuteWindowStartMs = now;
    next.minuteCount = 0;
  }
  if (next.inFlight < 0) next.inFlight = 0;
  return next;
}

export function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / 4);
}

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readState(): Promise<QuotaState> {
  try {
    const raw = await readFile(QUOTA_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<QuotaState>;
    return normalizeState({
      dayKey: typeof parsed.dayKey === "string" ? parsed.dayKey : utcDayKey(),
      dayCount: Number(parsed.dayCount) || 0,
      minuteWindowStartMs: Number(parsed.minuteWindowStartMs) || Date.now(),
      minuteCount: Number(parsed.minuteCount) || 0,
      inFlight: Number(parsed.inFlight) || 0,
    });
  } catch {
    return emptyState();
  }
}

async function writeState(state: QuotaState): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = `${JSON.stringify(state, null, 2)}\n`;
  await writeFile(QUOTA_TMP_PATH, payload, "utf8");
  await rename(QUOTA_TMP_PATH, QUOTA_PATH);
}

function toStatus(state: QuotaState, env = getEnv()): QuotaStatus {
  return {
    remainingDay: Math.max(0, env.rateLimitPerDay - state.dayCount),
    remainingMinute: Math.max(0, env.rateLimitPerMinute - state.minuteCount),
    inFlight: state.inFlight,
  };
}

export type ReserveResult = {
  status: QuotaStatus;
};

/**
 * Atomically reserve a slot: increments day, minute, and in-flight.
 * Throws AppError if any budget is exhausted.
 */
export async function tryReserve(): Promise<ReserveResult> {
  return withLock(async () => {
    const env = getEnv();
    const now = Date.now();
    let state = normalizeState(await readState(), now);

    if (state.inFlight >= env.maxInFlight) {
      throw new AppError(
        "RATE_LIMITED",
        "Another explanation is already in progress. Wait for it to finish.",
        429,
        2,
      );
    }

    if (state.minuteCount >= env.rateLimitPerMinute) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((state.minuteWindowStartMs + 60_000 - now) / 1000),
      );
      throw new AppError(
        "RATE_LIMITED",
        `Minute limit reached (${env.rateLimitPerMinute}/min). Try again shortly.`,
        429,
        retryAfterSec,
      );
    }

    if (state.dayCount >= env.rateLimitPerDay) {
      throw new AppError(
        "QUOTA_EXCEEDED",
        `Daily free-tier budget reached (${env.rateLimitPerDay}/day). Try again tomorrow, or delete .data/quota.json to reset locally.`,
        429,
      );
    }

    state = {
      ...state,
      dayCount: state.dayCount + 1,
      minuteCount: state.minuteCount + 1,
      inFlight: state.inFlight + 1,
    };
    await writeState(state);
    return { status: toStatus(state, env) };
  });
}

export async function releaseInFlight(): Promise<void> {
  await withLock(async () => {
    const state = normalizeState(await readState());
    state.inFlight = Math.max(0, state.inFlight - 1);
    await writeState(state);
  });
}

export async function getStatus(): Promise<QuotaStatus> {
  return withLock(async () => {
    const state = normalizeState(await readState());
    return toStatus(state);
  });
}

export function assertCodeWithinLimits(code: string): void {
  const env = getEnv();
  if (code.length > env.maxCodeChars) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      `Code exceeds MAX_CODE_CHARS (${env.maxCodeChars}). Shorten the snippet.`,
      400,
    );
  }
}

export function assertEstimatedTokensWithinLimits(
  promptAndCodeCharCount: number,
): void {
  const env = getEnv();
  const estimated = estimateTokensFromChars(promptAndCodeCharCount);
  if (estimated > env.maxEstimatedInputTokens) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      `Estimated input tokens (~${estimated}) exceed MAX_ESTIMATED_INPUT_TOKENS (${env.maxEstimatedInputTokens}). Shorten the snippet.`,
      400,
    );
  }
}
