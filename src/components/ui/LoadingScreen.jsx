import styles from "./ui.module.css";

/** Ladeansicht beim App-Start und für Suspense-Fallbacks. */
export default function LoadingScreen() {
  return (
    <div className={styles.loading} role="status">
      <div className={styles.loadingFlag} aria-hidden="true">🇲🇦</div>
      Lernplan wird geladen…
    </div>
  );
}
