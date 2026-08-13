import type { Audience } from "./types";

export const HISTORY_STORAGE_KEY = "explain-this:history";
export const HISTORY_MAX = 10;

export type HistoryEntry = {
  id: string;
  createdAt: number;
  code: string;
  language: string;
  audience: Audience;
  detectedLanguage?: string;
  explanation: string;
  complexity: string;
  notes: string;
};

export type HistoryInput = Omit<HistoryEntry, "id" | "createdAt">;

const HISTORY_LISTENERS = new Set<() => void>();
let historyCache: HistoryEntry[] | null = null;

function emitHistoryChange() {
  for (const listener of HISTORY_LISTENERS) listener();
}

export function subscribeHistory(listener: () => void): () => void {
  HISTORY_LISTENERS.add(listener);
  return () => {
    HISTORY_LISTENERS.delete(listener);
  };
}

export function getHistorySnapshot(): HistoryEntry[] {
  if (historyCache === null) {
    historyCache = loadHistory();
  }
  return historyCache;
}

const EMPTY_HISTORY: HistoryEntry[] = [];

export function getServerHistorySnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

function isAudience(value: unknown): value is Audience {
  return value === "beginner" || value === "technical";
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "number" &&
    typeof e.code === "string" &&
    typeof e.language === "string" &&
    isAudience(e.audience) &&
    (e.detectedLanguage === undefined ||
      typeof e.detectedLanguage === "string") &&
    typeof e.explanation === "string" &&
    typeof e.complexity === "string" &&
    typeof e.notes === "string"
  );
}

function sameRequest(a: HistoryEntry, b: HistoryInput): boolean {
  return (
    a.code === b.code &&
    a.language === b.language &&
    a.audience === b.audience
  );
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

export function pushHistory(input: HistoryInput): HistoryEntry[] {
  const existing = loadHistory().filter((e) => !sameRequest(e, input));
  const entry: HistoryEntry = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const next = [entry, ...existing].slice(0, HISTORY_MAX);
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — keep in-memory list for this session
  }
  historyCache = next;
  emitHistoryChange();
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
  historyCache = [];
  emitHistoryChange();
}

export function previewCode(code: string, max = 60): string {
  const oneLine = code.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export function formatHistoryTime(createdAt: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(createdAt));
  } catch {
    return new Date(createdAt).toLocaleString();
  }
}
