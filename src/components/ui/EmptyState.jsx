import { memo } from "react";
import styles from "./ui.module.css";

/** Leerer Zustand mit Icon und Hinweistext. */
const EmptyState = memo(function EmptyState({ icon = "🤷", children }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon} aria-hidden="true">{icon}</div>
      <div style={{ fontSize: "var(--fs-md)" }}>{children}</div>
    </div>
  );
});

export default EmptyState;
