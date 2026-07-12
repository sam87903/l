import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCountdownTimer } from "../hooks/useCountdownTimer.js";
import { useProgress } from "./ProgressContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { playChime, vibrate } from "../services/audio.js";
import { notify } from "../services/notifications.js";
import { storage } from "../services/storage.js";
import {
  BREAK_MINUTES,
  STORAGE_KEYS,
  TIMER_CUSTOM_MAX,
  TIMER_CUSTOM_MIN,
  TIMER_PRESETS,
} from "../constants/config.js";

const TimerContext = createContext(null);
const SECONDS_PER_MINUTE = 60;

/** mm:ss-Anzeige für Timer-Restzeit. */
export const formatClock = (s) =>
  `${String(Math.floor(s / SECONDS_PER_MINUTE)).padStart(2, "0")}:${String(s % SECONDS_PER_MINUTE).padStart(2, "0")}`;

const clampMinutes = (value, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < TIMER_CUSTOM_MIN) return fallback;
  return Math.min(TIMER_CUSTOM_MAX, n);
};

/**
 * Hält den Fokus-Timer oberhalb des Routers am Leben: die Session läuft
 * beim Seitenwechsel weiter und überlebt dank Storage-Snapshot sogar
 * einen Reload. Persistiert wird nur bei Zustandsübergängen, nie im Tick.
 */
export function TimerProvider({ children }) {
  const { ready, addFocusMinutes, settings } = useProgress();
  const { push } = useToast();
  const [minutes, setMinutes] = useState(TIMER_PRESETS[0]);
  const [isBreak, setIsBreak] = useState(false);
  // Frei gewählte Fokus-Dauer (dritte Preset-Option).
  const [customMin, setCustomMin] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const handleComplete = useCallback(() => {
    vibrate();
    if (settings.sound) playChime();
    if (isBreak) {
      push("Pause vorbei – weiter geht's!", "🚀");
      if (settings.notifications) notify("Pause vorbei", "Bereit für die nächste Fokus-Session?");
    } else {
      addFocusMinutes(minutes);
      push(`${minutes} Fokus-Minuten gutgeschrieben!`, "🎉");
      if (settings.notifications) notify("Session geschafft! 🎉", `${minutes} Minuten fokussiert gelernt.`);
    }
  }, [isBreak, minutes, addFocusMinutes, push, settings]);

  const timer = useCountdownTimer(minutes * SECONDS_PER_MINUTE, handleComplete);

  // Ref statt Abhängigkeit: der Restore-Effekt soll genau einmal laufen,
  // aber immer die aktuellen Timer-Funktionen sehen.
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const restoredRef = useRef(false);

  // Gespeicherte Session wiederherstellen – erst wenn der Fortschritt
  // geladen ist (addFocusMinutes darf keine ungeladenen Slices anfassen).
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    let cancelled = false;
    (async () => {
      const raw = await storage.get(STORAGE_KEYS.timer);
      if (cancelled) {
        setHydrated(true);
        return;
      }
      // Merker: Läuft schon etwas / wurde bewusst pausiert? Dann NICHT
      // automatisch (neu) starten.
      let didResume = false;
      let didPause = false;
      try {
        const snap = JSON.parse(raw || "null");
        if (snap && typeof snap === "object") {
          const m = clampMinutes(snap.minutes, TIMER_PRESETS[0]);
          const brk = snap.isBreak === true;
          const custom = snap.customMin == null ? null : clampMinutes(snap.customMin, null);
          setMinutes(m);
          setIsBreak(brk);
          setCustomMin(custom);
          const now = Date.now();
          const totalSec = (brk ? BREAK_MINUTES : m) * SECONDS_PER_MINUTE;
          if (Number.isFinite(snap.endAt) && snap.endAt > now) {
            // Session läuft noch – nahtlos weiterzählen.
            timerRef.current.reset(Math.max(1, Math.round((snap.endAt - now) / 1000)));
            timerRef.current.start();
            didResume = true;
          } else if (Number.isFinite(snap.endAt)) {
            // Während der Abwesenheit abgelaufen: erst den Snapshot
            // löschen, dann gutschreiben (keine Doppel-Gutschrift).
            await storage.remove(STORAGE_KEYS.timer);
            if (brk) {
              push("Pause vorbei – weiter geht's!", "🚀");
            } else {
              addFocusMinutes(m);
              push(`Session im Hintergrund beendet – ${m} Fokus-Minuten gutgeschrieben!`, "🎉");
            }
            setIsBreak(false);
            timerRef.current.reset(m * SECONDS_PER_MINUTE);
          } else if (Number.isFinite(snap.remaining) && snap.remaining > 0 && snap.remaining < totalSec) {
            // Mitten in der Session pausiert – bewusste Pause respektieren.
            timerRef.current.reset(Math.round(snap.remaining));
            didPause = true;
          } else {
            timerRef.current.reset(totalSec);
          }
        }
      } catch {
        /* defekter Snapshot – frisch starten */
      }
      // Auto-Start beim App-Öffnen: frische Fokus-Session automatisch
      // beginnen, sofern nicht ohnehin schon eine läuft oder bewusst
      // pausiert wurde (Einstellung, standardmäßig an).
      if (!cancelled && !didResume && !didPause && settings.autoStartTimer !== false) {
        setIsBreak(false);
        timerRef.current.start();
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Snapshot bei Zustandsübergängen schreiben (endAt ändert sich nur bei
  // Start/Pause/Reset/Ablauf – nie im 300-ms-Tick).
  const remainingRef = useRef(timer.remaining);
  remainingRef.current = timer.remaining;
  useEffect(() => {
    if (!hydrated) return;
    storage.set(
      STORAGE_KEYS.timer,
      JSON.stringify({ endAt: timer.endAt, remaining: remainingRef.current, minutes, isBreak, customMin })
    );
  }, [hydrated, timer.endAt, minutes, isBreak, customMin]);

  const selectPreset = useCallback(
    (m) => {
      setIsBreak(false);
      setMinutes(m);
      timerRef.current.reset(m * SECONDS_PER_MINUTE);
    },
    []
  );

  /** Eigene Dauer übernehmen (begrenzt auf 1–180 Min) und Timer setzen. */
  const setCustom = useCallback(
    (value) => {
      const clamped = clampMinutes(value, null);
      if (clamped == null) return;
      setCustomMin(clamped);
      selectPreset(clamped);
    },
    [selectPreset]
  );

  const startBreak = useCallback(() => {
    setIsBreak(true);
    timerRef.current.reset(BREAK_MINUTES * SECONDS_PER_MINUTE);
    timerRef.current.start();
  }, []);

  const resetTimer = useCallback(() => {
    setIsBreak(false);
    timerRef.current.reset(minutes * SECONDS_PER_MINUTE);
  }, [minutes]);

  const total = (isBreak ? BREAK_MINUTES : minutes) * SECONDS_PER_MINUTE;
  const done = timer.remaining === 0;
  const elapsedSec = total - timer.remaining;
  const canFinish = !isBreak && !done && elapsedSec > 0;

  /** Session vorzeitig beenden und die bisher gelernten Minuten gutschreiben. */
  const finishEarly = useCallback(() => {
    const earned = Math.max(1, Math.round(elapsedSec / SECONDS_PER_MINUTE));
    addFocusMinutes(earned);
    push(`${earned} Fokus-Minuten gespeichert – gut gemacht!`, "✅");
    if (settings.sound) playChime();
    setIsBreak(false);
    timerRef.current.reset(minutes * SECONDS_PER_MINUTE);
  }, [elapsedSec, minutes, addFocusMinutes, push, settings]);

  const value = useMemo(
    () => ({
      remaining: timer.remaining,
      running: timer.running,
      done,
      minutes,
      isBreak,
      customMin,
      total,
      pct: Math.round((elapsedSec / total) * 100),
      elapsedSec,
      canFinish,
      selectPreset,
      setCustom,
      start: timer.start,
      pause: timer.pause,
      resetTimer,
      startBreak,
      finishEarly,
    }),
    [timer.remaining, timer.running, timer.start, timer.pause, done, minutes, isBreak, customMin, total, elapsedSec, canFinish, selectPreset, setCustom, resetTimer, startBreak, finishEarly]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer muss innerhalb von <TimerProvider> verwendet werden");
  return ctx;
}
