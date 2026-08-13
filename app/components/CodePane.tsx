import type { FormEvent } from "react";

import type { Audience } from "@/src/lib/types";

import styles from "./CodePane.module.css";

export const LANGUAGES = [
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

export function languageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label ?? value;
}

type CodePaneProps = {
  code: string;
  language: string;
  audience: Audience;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onAudienceChange: (value: Audience) => void;
  onSubmit: (e: FormEvent) => void;
};

export function CodePane({
  code,
  language,
  audience,
  loading,
  onCodeChange,
  onLanguageChange,
  onAudienceChange,
  onSubmit,
}: CodePaneProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.codeField}>
        <label className={styles.label} htmlFor="code">
          Code
        </label>
        <textarea
          id="code"
          className={styles.textarea}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Paste code here…"
          rows={14}
          spellCheck={false}
          required
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="language">
            Language
          </label>
          <select
            id="language"
            className={styles.select}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
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
          <div className={styles.segment} role="presentation">
            <label className={styles.segmentOption}>
              <input
                type="radio"
                name="audience"
                value="beginner"
                checked={audience === "beginner"}
                onChange={() => onAudienceChange("beginner")}
              />
              <span className={styles.segmentLabel}>Beginner</span>
            </label>
            <label className={styles.segmentOption}>
              <input
                type="radio"
                name="audience"
                value="technical"
                checked={audience === "technical"}
                onChange={() => onAudienceChange("technical")}
              />
              <span className={styles.segmentLabel}>Technical</span>
            </label>
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        className={`${styles.button}${loading ? ` ${styles.buttonLoading}` : ""}`}
        disabled={loading || !code.trim()}
      >
        {loading ? "Explaining…" : "Explain"}
      </button>
    </form>
  );
}
