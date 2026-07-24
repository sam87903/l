import GlassCard from "./GlassCard.jsx";
import Button from "./Button.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./ui.module.css";

/** Bestätigungs-Dialog (z.B. Fortschritt zurücksetzen, Backup einspielen). */
export default function Modal({ open, title, children, confirmLabel = "OK", danger, onConfirm, onClose }) {
  if (!open) return null;

  return (
    <div
      className={`${styles.modalBackdrop} anim-backdrop`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="anim-modal" onClick={(e) => e.stopPropagation()}>
        <GlassCard className={styles.modalCard}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <div className={styles.modalBody}>{children}</div>
          <div className={styles.modalActions}>
            <Button ghost onClick={onClose}>Abbrechen</Button>
            <Button tint={danger ? ACCENT.red : ACCENT.teal} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
