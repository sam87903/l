import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Pause, Timer } from "lucide-react";
import { formatClock, useTimer } from "../../context/TimerContext.jsx";
import styles from "./timer.module.css";

/**
 * Schwebende Mini-Anzeige des laufenden Timers – auf allen Seiten sichtbar,
 * sobald die Zeit läuft. Klick springt zum vollen Timer, Pause pausiert direkt.
 */
const TimerPill = memo(function TimerPill() {
  const { remaining, running, isBreak, pause } = useTimer();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {running && (
        <motion.div
          className={styles.pillWrap}
          initial={{ opacity: 0, y: 14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <button
            className={styles.pillMain}
            onClick={() => navigate("/")}
            aria-label={isBreak ? "Pause läuft – zum Dashboard wechseln" : "Fokus-Timer läuft – zum Dashboard wechseln"}
          >
            {isBreak ? <Coffee size={14} aria-hidden="true" /> : <Timer size={14} aria-hidden="true" />}
            <span className={styles.pillTime} aria-hidden="true">
              {formatClock(remaining)}
            </span>
          </button>
          <button className={styles.pillPause} onClick={pause} aria-label="Timer pausieren">
            <Pause size={14} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default TimerPill;
