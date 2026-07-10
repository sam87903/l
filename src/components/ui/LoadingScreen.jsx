import MoroccoFlag from "./MoroccoFlag.jsx";
import Skeleton from "./Skeleton.jsx";
import styles from "./ui.module.css";

/**
 * Ladeansicht beim App-Start und für Suspense-Fallbacks: Flagge, Status
 * und Karten-Skelette in Dashboard-Anmutung statt leerer Fläche.
 */
export default function LoadingScreen() {
  return (
    <div className={styles.loading} role="status">
      <div className={styles.loadingFlag} aria-hidden="true">
        <MoroccoFlag size={54} />
      </div>
      Lernplan wird geladen…
      <div className={styles.loadingBar} aria-hidden="true">
        <span className={styles.loadingBarFill} />
      </div>
      <div className={styles.loadingSkeletons} aria-hidden="true">
        <Skeleton height={92} />
        <Skeleton height={64} />
        <Skeleton height={120} />
      </div>
    </div>
  );
}
