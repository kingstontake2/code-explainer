import {
  formatHistoryTime,
  previewCode,
  type HistoryEntry,
} from "@/src/lib/history";

import { languageLabel } from "./CodePane";
import styles from "./HistoryList.module.css";

type HistoryListProps = {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
};

export function HistoryList({ history, onRestore, onClear }: HistoryListProps) {
  if (history.length === 0) return null;

  return (
    <section className={styles.history} aria-label="Recent explanations">
      <div className={styles.historyHead}>
        <h2 className={styles.historyTitle}>Recent</h2>
        <button
          type="button"
          className={styles.clearHistory}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <ul className={styles.historyList}>
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={styles.historyItem}
              onClick={() => onRestore(entry)}
            >
              <span className={styles.historyPreview}>
                {previewCode(entry.code)}
              </span>
              <span className={styles.historyMeta}>
                {languageLabel(entry.language)} · {entry.audience} ·{" "}
                {formatHistoryTime(entry.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
