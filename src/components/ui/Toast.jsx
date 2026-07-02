import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "./GlassCard.jsx";
import styles from "./ui.module.css";

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 3200;

/** Kurzlebige Statusmeldungen unten im Bild. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, icon = "✨") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastWrap} aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <GlassCard className={styles.toast}>
                <span aria-hidden="true">{t.icon}</span>
                {t.message}
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast muss innerhalb von <ToastProvider> verwendet werden");
  return ctx;
}
