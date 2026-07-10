import { memo, useCallback, useRef, useState } from "react";
import { Check, Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { useCountdownTimer } from "../../hooks/useCountdownTimer.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { playChime, vibrate } from "../../services/audio.js";
import { notify } from "../../services/notifications.js";
import { ACCENT } from "../../constants/theme.js";
import { BREAK_MINUTES, TIMER_CUSTOM_MAX, TIMER_CUSTOM_MIN, TIMER_PRESETS } from "../../constants/config.js";
import { cx } from "../../utils/misc.js";
import styles from "./timer.module.css";

const SECONDS_PER_MINUTE = 60;
const fmt = (s) =>
  `${String(Math.floor(s / SECONDS_PER_MINUTE)).padStart(2, "0")}:${String(s % SECONDS_PER_MINUTE).padStart(2, "0")}`;

/** Pomodoro-Timer mit Presets (20/25/45), Pause, vorzeitigem Beenden, Sound & Vibration. */
const FocusTimer = memo(function FocusTimer() {
  const { addFocusMinutes, settings } = useProgress();
  const { push } = useToast();
  const [minutes, setMinutes] = useState(TIMER_PRESETS[0]);
  const [isBreak, setIsBreak] = useState(false);
  // Selbst gewählte Fokus-Dauer (dritte, frei wählbare Option statt festem Preset).
  const [customMin, setCustomMin] = useState(null);
  const [editingCustom, setEditingCustom] = useState(false);
  const [draft, setDraft] = useState("");
  const customInputRef = useRef(null);

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
  const total = (isBreak ? BREAK_MINUTES : minutes) * SECONDS_PER_MINUTE;
  const done = timer.remaining === 0;
  const pct = Math.round(((total - timer.remaining) / total) * 100);
  // Vorzeitiges Beenden nur sinnvoll, wenn eine laufende Fokus-Session
  // (kein Break) mindestens ein Stück fortgeschritten ist.
  const elapsedSec = total - timer.remaining;
  const canFinish = !isBreak && !done && elapsedSec > 0;

  const selectPreset = (m) => {
    setIsBreak(false);
    setMinutes(m);
    timer.reset(m * SECONDS_PER_MINUTE);
  };

  // Eingabe der eigenen Dauer öffnen und Fokus aufs Feld setzen.
  const openCustom = () => {
    setDraft(customMin ? String(customMin) : "");
    setEditingCustom(true);
    requestAnimationFrame(() => customInputRef.current?.focus());
  };

  // Eigene Dauer übernehmen (auf sinnvolle Grenzen begrenzt) und Timer setzen.
  const confirmCustom = () => {
    setEditingCustom(false);
    const value = parseInt(draft, 10);
    if (!Number.isFinite(value)) return;
    const clamped = Math.min(TIMER_CUSTOM_MAX, Math.max(TIMER_CUSTOM_MIN, value));
    setCustomMin(clamped);
    selectPreset(clamped);
  };

  const startBreak = () => {
    setIsBreak(true);
    timer.reset(BREAK_MINUTES * SECONDS_PER_MINUTE);
    timer.start();
  };

  /** Session vorzeitig beenden und die bisher gelernten Minuten gutschreiben. */
  const finishEarly = () => {
    const earned = Math.max(1, Math.round(elapsedSec / SECONDS_PER_MINUTE));
    addFocusMinutes(earned);
    push(`${earned} Fokus-Minuten gespeichert – gut gemacht!`, "✅");
    if (settings.sound) playChime();
    setIsBreak(false);
    timer.reset(minutes * SECONDS_PER_MINUTE);
  };

  return (
    <GlassCard tint={ACCENT.blue} className={styles.card}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          {isBreak ? <Coffee size={14} aria-hidden="true" /> : <Timer size={14} aria-hidden="true" />}
          {isBreak ? `Pause · ${BREAK_MINUTES} Min` : "Fokus-Timer"}
        </span>
        <div className={styles.presets} role="group" aria-label="Timer-Dauer wählen">
          {TIMER_PRESETS.map((m) => (
            <button
              key={m}
              className={cx(styles.preset, !isBreak && minutes === m && styles.presetActive, "hover-pop")}
              onClick={() => selectPreset(m)}
              aria-pressed={!isBreak && minutes === m}
            >
              {m}′
            </button>
          ))}
          {editingCustom ? (
            <input
              ref={customInputRef}
              className={styles.customInput}
              type="number"
              inputMode="numeric"
              min={TIMER_CUSTOM_MIN}
              max={TIMER_CUSTOM_MAX}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={confirmCustom}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCustom();
                if (e.key === "Escape") setEditingCustom(false);
              }}
              placeholder="Min"
              aria-label="Eigene Dauer in Minuten"
            />
          ) : (
            <button
              className={cx(
                styles.preset,
                customMin != null && !isBreak && minutes === customMin && styles.presetActive,
                "hover-pop"
              )}
              onClick={openCustom}
              aria-pressed={customMin != null && !isBreak && minutes === customMin}
              aria-label={customMin != null ? `Eigene Dauer ${customMin} Minuten – ändern` : "Eigene Dauer wählen"}
              title="Eigene Dauer"
            >
              {customMin != null ? `${customMin}′` : "…"}
            </button>
          )}
        </div>
      </div>

      <div className={cx(styles.time, done && styles.timeDone)} aria-live="polite">
        {done ? "Geschafft! 🎉" : fmt(timer.remaining)}
      </div>
      <ProgressBar value={pct} from={ACCENT.blue} to={ACCENT.teal} height={5} label="Timer-Fortschritt" />

      <div className={styles.controls}>
        {done && !isBreak ? (
          <>
            <Button tint={ACCENT.teal} style={{ flex: 2 }} onClick={startBreak}>
              <Coffee size={15} aria-hidden="true" /> {BREAK_MINUTES} Min Pause
            </Button>
            <Button style={{ flex: 1 }} onClick={() => selectPreset(minutes)}>
              <RotateCcw size={15} aria-hidden="true" /> Neu
            </Button>
          </>
        ) : (
          <>
            <Button
              tint={ACCENT.blue}
              style={{ flex: 2 }}
              onClick={() => (timer.running ? timer.pause() : done ? (timer.reset(total), timer.start()) : timer.start())}
            >
              {timer.running ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              {timer.running ? "Pause" : "Start"}
            </Button>
            <Button style={{ flex: 1 }} onClick={() => { setIsBreak(false); timer.reset(minutes * SECONDS_PER_MINUTE); }}>
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </Button>
          </>
        )}
      </div>

      {canFinish && (
        <Button tint={ACCENT.teal} style={{ width: "100%", marginTop: "var(--s-2)" }} onClick={finishEarly}>
          <Check size={15} aria-hidden="true" />
          Beenden &amp; {Math.max(1, Math.round(elapsedSec / SECONDS_PER_MINUTE))} Min speichern
        </Button>
      )}

      <p className={styles.hint}>5 Min Anki · 10 Min Video/Lesen · 5 Min Takeaways notieren</p>
    </GlassCard>
  );
});

export default FocusTimer;
