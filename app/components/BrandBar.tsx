import type { QuotaStatus } from "@/src/lib/types";

import styles from "./BrandBar.module.css";

type BrandBarProps = {
  quota: QuotaStatus | null;
};

export function BrandBar({ quota }: BrandBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.identity}>
        <h1 className={styles.brand}>Explain This</h1>
        <p className={styles.tagline}>
          Paste a code snippet. Get a plain-English explanation, how hard it is
          to follow, and readability notes.
        </p>
      </div>
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
  );
}
