import { useCallback, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "./GlassCard.jsx";
import Button from "./Button.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./ui.module.css";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Bestätigungs-Dialog (z.B. Fortschritt zurücksetzen, Backup einspielen).
 * Vollständig tastaturbedienbar: Escape schließt, der Fokus wird beim Öffnen
 * in den Dialog gelegt, in ihm gefangen gehalten (WCAG 2.4.3) und beim
 * Schließen an das auslösende Element zurückgegeben.
 */
export default function Modal({ open, title, children, confirmLabel = "OK", danger, onConfirm, onClose }) {
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef(null);
  const confirmRef = useRef(null);
  const restoreRef = useRef(null);

  // Fokus beim Öffnen sichern und auf die Primäraktion legen; beim Schließen
  // an das zuvor fokussierte Element zurückgeben.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    const id = requestAnimationFrame(() => confirmRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      const el = restoreRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      // Fokus-Falle: Tab-Zyklus innerhalb des Dialogs halten.
      const items = cardRef.current?.querySelectorAll(FOCUSABLE);
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onKeyDown={onKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
        >
          <motion.div
            ref={cardRef}
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className={styles.modalCard}>
              <h2 className={styles.modalTitle} id={titleId}>{title}</h2>
              <div className={styles.modalBody} id={bodyId}>{children}</div>
              <div className={styles.modalActions}>
                <Button ghost onClick={onClose}>Abbrechen</Button>
                <Button ref={confirmRef} tint={danger ? ACCENT.red : ACCENT.teal} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
