import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useStorageHealth } from "../../hooks/useStorageHealth.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./ui.module.css";

/**
 * Unübersehbare Warnung, wenn der Browser nichts mehr speichern kann.
 *
 * Ohne diesen Hinweis läuft die App scheinbar normal weiter, während jeder
 * abgehakte Tag und jedes Quiz-Ergebnis ins Leere geht. Auf einer Reise ohne
 * Internet fällt das erst auf, wenn wochenlanger Fortschritt verloren ist.
 */
export default function StorageWarning() {
  const error = useStorageHealth();
  const navigate = useNavigate();
  if (!error) return null;

  const full = error === "quota";
  return (
    <div className={styles.storageWarn} role="alert" style={{ "--c": ACCENT.red }}>
      <AlertTriangle size={16} aria-hidden="true" />
      <div className={styles.storageWarnBody}>
        <strong>
          {full ? "Speicher voll – dein Fortschritt wird nicht mehr gesichert." : "Speichern blockiert."}
        </strong>{" "}
        {full
          ? "Lösche unter \u201eKlausuren\u201c ein paar Altklausuren – das sind die größten Brocken. Danach läuft es sofort weiter."
          : "Im privaten Modus erlaubt der Browser kein Speichern. Öffne die App in einem normalen Tab."}
      </div>
      {full && (
        <button className={styles.storageWarnBtn} onClick={() => navigate("/klausuren")}>
          Aufräumen
        </button>
      )}
    </div>
  );
}
