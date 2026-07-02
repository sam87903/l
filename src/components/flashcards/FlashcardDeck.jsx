import { memo, useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { ACCENT } from "../../constants/theme.js";
import { cx, shuffleArray } from "../../utils/misc.js";
import styles from "./flashcards.module.css";

/**
 * Lernkarten-Deck mit 3D-Flip, Shuffle, "Nur neue"-Filter und
 * Gewusst/Nochmal-Tracking (Spaced-Repetition light).
 */
const FlashcardDeck = memo(function FlashcardDeck({ cards, color = ACCENT.violet, known, onKnown }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  const sequence = useMemo(
    () => (onlyNew ? order.filter((i) => !known.has(i)) : order),
    [order, onlyNew, known]
  );
  const safePos = sequence.length ? Math.min(pos, sequence.length - 1) : 0;
  const cardIndex = sequence.length ? sequence[safePos] : null;
  const card = cardIndex != null ? cards[cardIndex] : null;

  const go = useCallback(
    (dir) => {
      setFlipped(false);
      setPos((p) => {
        const n = sequence.length;
        return n ? (Math.min(p, n - 1) + dir + n) % n : 0;
      });
    },
    [sequence.length]
  );

  const shuffle = () => {
    setOrder(shuffleArray(order));
    setPos(0);
    setFlipped(false);
  };

  const mark = (isKnown) => {
    if (cardIndex == null) return;
    onKnown(cardIndex, isKnown);
    setFlipped(false);
    // Im "Nur neue"-Modus rückt eine gewusste Karte automatisch nach.
    if (!(onlyNew && isKnown)) go(1);
  };

  return (
    <GlassCard tint={color} className={styles.deck} style={{ "--c": color }}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          <span aria-hidden="true">🃏</span> Lernkarten
          <span className={cx(styles.count, known.size === cards.length && cards.length > 0 && styles.countDone)}>
            {known.size}/{cards.length} gewusst
          </span>
        </span>
        <div className={styles.tools}>
          <button className={`${styles.tool} hover-pop`} onClick={shuffle} aria-label="Karten mischen">
            <Shuffle size={12} aria-hidden="true" />
          </button>
          <button
            className={cx(styles.tool, onlyNew && styles.toolActive, "hover-pop")}
            onClick={() => { setOnlyNew((v) => !v); setPos(0); setFlipped(false); }}
            aria-pressed={onlyNew}
          >
            Nur neue{onlyNew ? " ✓" : ""}
          </button>
        </div>
      </div>

      <ProgressBar value={known.size} max={cards.length} from={ACCENT.teal} to={color} height={4}
        label="Gewusste Karten" />

      {card ? (
        <>
          <div className={styles.scene}>
            <motion.div
              className={styles.cardInner}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFlipped((f) => !f))}
              aria-label={flipped ? "Definition – antippen für Begriff" : "Begriff – antippen für Definition"}
            >
              <div className={styles.face}>
                <span className={styles.pos}>{safePos + 1}/{sequence.length}</span>
                {known.has(cardIndex) && <span className={styles.knownBadge}>✓ gewusst</span>}
                <div className={styles.faceLabel}>Begriff</div>
                <div className={styles.faceTerm}>{card.front}</div>
              </div>
              <div className={cx(styles.face, styles.faceBack)}>
                <div className={styles.faceLabel} style={{ color: "var(--c)" }}>Definition</div>
                <div className={styles.faceDef}>{card.back}</div>
              </div>
            </motion.div>
          </div>

          <div className={styles.controls}>
            {flipped ? (
              <>
                <Button tint={ACCENT.red} style={{ flex: 1 }} onClick={() => mark(false)}>
                  <RotateCcw size={14} aria-hidden="true" /> Nochmal
                </Button>
                <Button tint={ACCENT.teal} style={{ flex: 1 }} onClick={() => mark(true)}>
                  <Check size={14} aria-hidden="true" /> Gewusst
                </Button>
              </>
            ) : (
              <>
                <Button style={{ flex: 1 }} onClick={() => go(-1)} aria-label="Vorherige Karte">
                  <ArrowLeft size={14} aria-hidden="true" /> Zurück
                </Button>
                <Button tint={color} style={{ flex: 1 }} onClick={() => go(1)} aria-label="Nächste Karte">
                  Weiter <ArrowRight size={14} aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className={styles.doneBox}>
          <div style={{ fontSize: "1.5rem", marginBottom: "var(--s-1)" }} aria-hidden="true">🎉</div>
          <p style={{ margin: "0 0 var(--s-3)", fontWeight: 700, fontSize: "var(--fs-md)" }}>
            Alle Karten gewusst – stark!
          </p>
          <Button tint={color} onClick={() => { setOnlyNew(false); setPos(0); }}>
            Alle Karten zeigen
          </Button>
        </div>
      )}
    </GlassCard>
  );
});

export default FlashcardDeck;
