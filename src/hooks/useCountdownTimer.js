import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Zeitstempel-basierter Countdown (driftet nicht, auch wenn der Tab
 * pausiert). `onComplete` feuert genau einmal pro abgelaufener Session.
 */
export function useCountdownTimer(initialSeconds, onComplete) {
  const [duration, setDuration] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [endAt, setEndAt] = useState(null); // null = pausiert/idle
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const running = endAt != null;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const rest = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(rest);
      if (rest === 0) {
        setEndAt(null);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      }
    };
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [endAt, running]);

  const start = useCallback(() => {
    setRemaining((rest) => {
      const base = rest > 0 ? rest : duration;
      completedRef.current = false;
      setEndAt(Date.now() + base * 1000);
      return base;
    });
  }, [duration]);

  const pause = useCallback(() => {
    setEndAt((end) => {
      if (end) setRemaining(Math.max(0, Math.round((end - Date.now()) / 1000)));
      return null;
    });
  }, []);

  const reset = useCallback((seconds) => {
    const s = seconds ?? duration;
    completedRef.current = false;
    setEndAt(null);
    setDuration(s);
    setRemaining(s);
  }, [duration]);

  return { duration, remaining, running, start, pause, reset };
}
