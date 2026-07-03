import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Check, Play, RotateCcw } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { collectDueCards } from "../../utils/decks.js";
import { LEITNER_MAX_BOX } from "../../constants/config.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./flashcards.module.css";

const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 500;

/**
 * Deck-übergreifendes Karten-Training: sammelt alle heute fälligen
 * Leitner-Karten (Module + Glossar) in eine Session. „Nochmal" reiht die
 * Karte ans Ende der Warteschlange, „Gewusst" hebt sie eine Box höher.
 */
const DueTrainer = memo(function DueTrainer() {
  const { srs, reviewCard } = useProgress();
  const { push } = useToast();
  const [session, setSession] = useState(null);
  const [flipped, setFlipped] = useState(false);

  const due = useMemo(() => collectDueCards(srs), [srs]);
  const deckCount = useMemo(() => new Set(due.map((c) => c.deckId)).size, [due]);

  const start = () => {
    setSession({ queue: due, done: 0, total: due.length });
    setFlipped(false);
  };

  const answer = (known) => {
    const card = session.queue[0];
    reviewCard(card.deckId, card.index, known);
    setFlipped(false);
    setSession((s) => {
      const rest = s.queue.slice(1);
      // Nicht gewusste Karten kommen ans Ende der Session zurück.
      const queue = known ? rest : [...rest, card];
      const done = known ? s.done + 1 : s.done;
      if (queue.length === 0) {
        push(`${s.total} Karten wiederholt – Session geschafft!`, "🎉");
        return null;
      }
      return { ...s, queue, done };
    });
  };

  const onDragEnd = (_e, info) => {
    if (!flipped) return;
    const swipe = info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY
      ? 1
      : info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY
        ? -1
        : 0;
    if (swipe) answer(swipe === 1);
  };

  const current = session?.queue[0];

  return (
    <GlassCard tint={ACCENT.orange} className={styles.deck} style={{ "--c": ACCENT.orange }}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          <CalendarClock size={14} aria-hidden="true" /> Karten-Training
          <span className={cx(styles.count, due.length === 0 && styles.countDone)}>
            {due.length} fällig
          </span>
        </span>
      </div>

      {!session ? (
        due.length > 0 ? (
          <>
            <p className={styles.trainerText}>
              {due.length === 1 ? "Eine Karte ist" : `${due.length} Karten sind`} heute zur
              Wiederholung fällig ({deckCount === 1 ? "1 Deck" : `${deckCount} Decks`}).
              Schwächste Stufen zuerst.
            </p>
            <Button tint={ACCENT.orange} style={{ width: "100%" }} onClick={start}>
              <Play size={15} aria-hidden="true" /> Training starten
            </Button>
          </>
        ) : (
          <p className={styles.trainerText}>
            ✅ Nichts fällig! Gewusste Karten kommen nach 3/7/14/30 Tagen automatisch
            wieder – neue Karten lernst du in den Modulen und im Glossar.
          </p>
        )
      ) : (
        <>
          <ProgressBar value={session.done} max={session.total} from={ACCENT.orange} to={ACCENT.teal}
            height={4} label="Trainings-Fortschritt" />

          <div className={styles.scene}>
            <motion.div
              key={`${current.deckId}#${current.index}`}
              className={styles.cardInner}
              animate={{ rotateY: flipped ? 180 : 0 }}
              initial={false}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={onDragEnd}
              onTap={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFlipped((f) => !f))}
              aria-label={flipped ? "Definition – antippen für Begriff" : "Begriff – antippen für Definition"}
            >
              <div className={styles.face}>
                <span className={styles.pos}>{session.done + 1}/{session.total}</span>
                <span className={styles.boxBadge}>📦 Stufe {current.box}/{LEITNER_MAX_BOX}</span>
                <div className={styles.faceLabel}>{current.deckLabel}</div>
                <div className={styles.faceTerm}>{current.front}</div>
              </div>
              <div className={cx(styles.face, styles.faceBack)}>
                <div className={styles.faceLabel} style={{ color: "var(--c)" }}>Definition</div>
                <div className={styles.faceDef}>{current.back}</div>
              </div>
            </motion.div>
          </div>

          {flipped ? (
            <div className={styles.controls}>
              <Button tint={ACCENT.red} style={{ flex: 1 }} onClick={() => answer(false)}>
                <RotateCcw size={14} aria-hidden="true" /> Nochmal
              </Button>
              <Button tint={ACCENT.teal} style={{ flex: 1 }} onClick={() => answer(true)}>
                <Check size={14} aria-hidden="true" /> Gewusst
              </Button>
            </div>
          ) : (
            <p className={styles.swipeHint}>Antippen, um die Definition zu sehen</p>
          )}
        </>
      )}
    </GlassCard>
  );
});

export default DueTrainer;
