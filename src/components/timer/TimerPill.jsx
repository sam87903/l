import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Pause, Play, Timer } from "lucide-react";
import { formatClock, useTimer } from "../../context/TimerContext.jsx";
import { cx } from "../../utils/misc.js";
import styles from "./timer.module.css";

/**
 * Schwebende Mini-Anzeige des Timers – auf allen Seiten sichtbar, sobald eine
 * Session läuft. Sie bleibt auch sichtbar, wenn pausiert wurde (dann mit
 * Weiter-Knopf), damit die Restzeit nicht verschwindet. Klick springt zum
 * vollen Timer.
 */
const TimerPill = memo(function TimerPill() {
  const { remaining, running, isBreak, done, elapsedSec, pause, start } = useTimer();
  const navigate = useNavigate();

  // Pausiert = mitten in der Session gestoppt (Restzeit übrig, läuft nicht).
  const paused = !running && !done && elapsedSec > 0 && remaining > 0;
  if (!running && !paused) return null;

  return (
    <div className={cx(styles.pillWrap, paused && styles.pillPaused, "anim-pill")}>
      <button
        className={styles.pillMain}
        onClick={() => navigate("/")}
        aria-label={
          paused
            ? "Timer pausiert – zum Dashboard wechseln"
            : isBreak
              ? "Pause läuft – zum Dashboard wechseln"
              : "Fokus-Timer läuft – zum Dashboard wechseln"
        }
      >
        {isBreak ? <Coffee size={14} aria-hidden="true" /> : <Timer size={14} aria-hidden="true" />}
        <span className={styles.pillTime} aria-hidden="true">
          {formatClock(remaining)}
        </span>
      </button>
      {paused ? (
        <button className={styles.pillPause} onClick={start} aria-label="Timer fortsetzen">
          <Play size={14} aria-hidden="true" />
        </button>
      ) : (
        <button className={styles.pillPause} onClick={pause} aria-label="Timer pausieren">
          <Pause size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default TimerPill;
