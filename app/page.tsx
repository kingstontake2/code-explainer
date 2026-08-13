"use client";

import { useState, type FormEvent } from "react";

import type {
  ApiErrorBody,
  Audience,
  ExplainSuccessBody,
  QuotaStatus,
} from "@/src/lib/types";
import styles from "./page.module.css";

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "other", label: "Other" },
] as const;

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [audience, setAudience] = useState<Audience>("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainSuccessBody | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [copied, setCopied] = useState(false);

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
      setResult(ok);
      setQuota(ok.quota);
    } catch {
      setError("Network error. Is the server running?");
      setErrorCode("UPSTREAM");
      setResult(null);
    } finally {
      setLoading(false);
    }
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
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Explain This</h1>
        <p className={styles.tagline}>
          Paste a code snippet. Get a plain-English explanation and complexity
          notes.
        </p>
        {quota ? (
          <p className={styles.quota} aria-live="polite">
            Remaining today: {quota.remainingDay} · this minute:{" "}
            {quota.remainingMinute}
          </p>
        ) : (
          <p className={styles.quotaMuted}>
            Free-tier budgets enforced before each Groq call.
          </p>
        )}
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="code">
          Code
        </label>
        <textarea
          id="code"
          className={styles.textarea}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste code here…"
          rows={14}
          spellCheck={false}
          required
        />

        <div className={styles.controls}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="language">
              Language
            </label>
            <select
              id="language"
              className={styles.select}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className={styles.audience}>
            <legend className={styles.label}>Audience</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="audience"
                value="beginner"
                checked={audience === "beginner"}
                onChange={() => setAudience("beginner")}
              />
              Beginner
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="audience"
                value="technical"
                checked={audience === "technical"}
                onChange={() => setAudience("technical")}
              />
              Technical
            </label>
          </fieldset>
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={loading || !code.trim()}
        >
          {loading ? "Explaining…" : "Explain"}
        </button>
      </form>

      {error ? (
        <div
          className={styles.error}
          role="alert"
          data-code={errorCode ?? undefined}
        >
          <strong>{errorCode ?? "ERROR"}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <section className={styles.results} aria-live="polite">
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Explanation</h2>
              <button
                type="button"
                className={styles.copy}
                onClick={copyExplanation}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className={styles.body}>{result.explanation}</p>
          </div>

          <div className={styles.panel}>
            <h2>Complexity</h2>
            <p className={styles.body}>{result.complexity}</p>
          </div>

          <div className={styles.panel}>
            <h2>Readability notes</h2>
            <p className={styles.body}>{result.notes}</p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
