import type { ExplainResponse } from "@/src/lib/types";

import styles from "./ResultsPane.module.css";

type ResultsPaneProps = {
  result: ExplainResponse | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  copied: boolean;
  onCopy: () => void;
};

export function ResultsPane({
  result,
  loading,
  error,
  errorCode,
  copied,
  onCopy,
}: ResultsPaneProps) {
  return (
    <div className={styles.pane}>
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

      {loading && !result ? (
        <p className={styles.loading} aria-live="polite">
          Explaining…
        </p>
      ) : null}

      {!loading && !result && !error ? (
        <p className={styles.empty}>Paste code and explain…</p>
      ) : null}

      {result ? (
        <section
          className={styles.results}
          aria-live="polite"
          key={`${result.explanation.slice(0, 48)}-${result.detectedLanguage}`}
        >
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Explanation</h2>
              <button
                type="button"
                className={`${styles.copy}${copied ? ` ${styles.copyDone}` : ""}`}
                onClick={onCopy}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className={styles.detectedLanguage}>
              Language: {result.detectedLanguage}
            </p>
            <p className={styles.body}>{result.explanation}</p>
          </div>

          <div className={styles.section}>
            <h2>How complex is this?</h2>
            <p className={styles.body}>{result.complexity}</p>
          </div>

          <div className={styles.section}>
            <h2>Readability notes</h2>
            <p className={styles.body}>{result.notes}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
