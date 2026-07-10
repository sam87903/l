import { memo, useRef, useState } from "react";
import { Check, Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { formatClock, useTimer } from "../../context/TimerContext.jsx";
import { ACCENT } from "../../constants/theme.js";
import { BREAK_MINUTES, TIMER_CUSTOM_MAX, TIMER_CUSTOM_MIN, TIMER_PRESETS } from "../../constants/config.js";
import { cx } from "../../utils/misc.js";
import styles from "./timer.module.css";

/**
 * Pomodoro-Timer mit Presets (20/25/eigene Dauer), Pause, vorzeitigem
 * Beenden, Sound & Vibration. Der Zustand lebt im TimerProvider –
 * die Session läuft beim Seitenwechsel weiter.
 */
const FocusTimer = memo(function FocusTimer() {
  const {
    remaining, running, done, minutes, isBreak, customMin, pct, elapsedSec, canFinish,
    selectPreset, setCustom, start, pause, resetTimer, startBreak, finishEarly,
  } = useTimer();
  // Reines Anzeige-/Eingabe-Verhalten bleibt lokal in der Komponente.
  const [editingCustom, setEditingCustom] = useState(false);
  const [draft, setDraft] = useState("");
  const customInputRef = useRef(null);

  // Eingabe der eigenen Dauer öffnen und Fokus aufs Feld setzen.
  const openCustom = () => {
    setDraft(customMin ? String(customMin) : "");
    setEditingCustom(true);
    requestAnimationFrame(() => customInputRef.current?.focus());
  };

  const confirmCustom = () => {
    setEditingCustom(false);
    setCustom(draft);
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
        {done ? "Geschafft! 🎉" : formatClock(remaining)}
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
            <Button tint={ACCENT.blue} style={{ flex: 2 }} onClick={() => (running ? pause() : start())}>
              {running ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button style={{ flex: 1 }} onClick={resetTimer}>
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </Button>
          </>
        )}
      </div>

      {canFinish && (
        <Button tint={ACCENT.teal} style={{ width: "100%", marginTop: "var(--s-2)" }} onClick={finishEarly}>
          <Check size={15} aria-hidden="true" />
          Beenden &amp; {Math.max(1, Math.round(elapsedSec / 60))} Min speichern
        </Button>
      )}

      <p className={styles.hint}>5 Min Anki · 10 Min Video/Lesen · 5 Min Takeaways notieren</p>
    </GlassCard>
  );
});

export default FocusTimer;
