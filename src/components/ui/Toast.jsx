import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
        {toasts.map((t) => (
          <div key={t.id} className="anim-toast">
            <GlassCard className={styles.toast}>
              <span aria-hidden="true">{t.icon}</span>
              {t.message}
            </GlassCard>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast muss innerhalb von <ToastProvider> verwendet werden");
  return ctx;
}
