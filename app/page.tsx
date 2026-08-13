"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

import { BrandBar } from "@/app/components/BrandBar";
import { CodePane, languageLabel } from "@/app/components/CodePane";
import { HistoryList } from "@/app/components/HistoryList";
import { ResultsPane } from "@/app/components/ResultsPane";
import {
  clearHistory,
  getHistorySnapshot,
  getServerHistorySnapshot,
  pushHistory,
  subscribeHistory,
  type HistoryEntry,
} from "@/src/lib/history";
import type {
  ApiErrorBody,
  Audience,
  ExplainResponse,
  ExplainSuccessBody,
  QuotaStatus,
} from "@/src/lib/types";

import styles from "./page.module.css";

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [audience, setAudience] = useState<Audience>("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setCopied(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, audience }),
      });

      const data = (await res.json()) as ExplainSuccessBody | ApiErrorBody;

      if (!res.ok) {
        const errBody = data as ApiErrorBody;
        setError(errBody.error?.message ?? "Request failed.");
        setErrorCode(errBody.error?.code ?? "UPSTREAM");
        setResult(null);
        return;
      }

      const ok = data as ExplainSuccessBody;
      setResult({
        detectedLanguage: ok.detectedLanguage,
        explanation: ok.explanation,
        complexity: ok.complexity,
        notes: ok.notes,
      });
      setQuota(ok.quota);
      pushHistory({
        code,
        language,
        audience,
        detectedLanguage: ok.detectedLanguage,
        explanation: ok.explanation,
        complexity: ok.complexity,
        notes: ok.notes,
      });
    } catch {
      setError("Network error. Is the server running?");
      setErrorCode("UPSTREAM");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function restoreEntry(entry: HistoryEntry) {
    setCode(entry.code);
    setLanguage(entry.language);
    setAudience(entry.audience);
    setResult({
      detectedLanguage: entry.detectedLanguage ?? languageLabel(entry.language),
      explanation: entry.explanation,
      complexity: entry.complexity,
      notes: entry.notes,
    });
    setError(null);
    setErrorCode(null);
    setCopied(false);
  }

  function onClearHistory() {
    clearHistory();
  }

  async function copyExplanation() {
    if (!result?.explanation) return;
    try {
      await navigator.clipboard.writeText(result.explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
      setErrorCode("VALIDATION");
    }
  }

  return (
    <div className={styles.shell}>
      <BrandBar quota={quota} />
      <div className={styles.workspace}>
        <div className={`${styles.column} ${styles.columnLeft}`}>
          <CodePane
            code={code}
            language={language}
            audience={audience}
            loading={loading}
            onCodeChange={setCode}
            onLanguageChange={setLanguage}
            onAudienceChange={setAudience}
            onSubmit={onSubmit}
          />
        </div>
        <div className={`${styles.column} ${styles.columnRight}`}>
          <ResultsPane
            result={result}
            loading={loading}
            error={error}
            errorCode={errorCode}
            copied={copied}
            onCopy={copyExplanation}
          />
        </div>
        {history.length > 0 ? (
          <div className={styles.historySlot}>
            <HistoryList
              history={history}
              onRestore={restoreEntry}
              onClear={onClearHistory}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
