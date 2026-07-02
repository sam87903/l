import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "./GlassCard.jsx";
import Button from "./Button.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./ui.module.css";

/** Bestätigungs-Dialog (z.B. Fortschritt zurücksetzen, Backup einspielen). */
export default function Modal({ open, title, children, confirmLabel = "OK", danger, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className={styles.modalCard}>
              <h2 className={styles.modalTitle}>{title}</h2>
              <div className={styles.modalBody}>{children}</div>
              <div className={styles.modalActions}>
                <Button ghost onClick={onClose}>Abbrechen</Button>
                <Button tint={danger ? ACCENT.red : ACCENT.teal} onClick={onConfirm}>{confirmLabel}</Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
