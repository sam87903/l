import { memo, useCallback, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { useSwipeCard } from "../../hooks/useSwipeCard.js";
import { isDue } from "../../utils/decks.js";
import { LEITNER_MAX_BOX } from "../../constants/config.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, shuffleArray } from "../../utils/misc.js";
import styles from "./flashcards.module.css";

const fmtShort = (iso) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.` : "");

/**
 * Lernkarten-Deck mit 3D-Flip, Leitner-Boxen (1–5), Fällig-/Neu-Filter,
 * Wisch-Gesten (rechts = Gewusst, links = Nochmal) und Shuffle.
 */
const FlashcardDeck = memo(function FlashcardDeck({ deckId, cards, color = ACCENT.violet }) {
  const { fcKnown, srs, reviewCard } = useProgress();
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState("all");

  const known = useMemo(() => new Set(fcKnown[deckId] || []), [fcKnown, deckId]);
  const deckSrs = srs[deckId] || {};

  const newIndices = useMemo(
    () => order.filter((i) => !known.has(i) && !deckSrs[i]),
    [order, known, deckSrs]
  );
  const dueIndices = useMemo(() => order.filter((i) => isDue(deckSrs[i])), [order, deckSrs]);
  const sequence = filter === "new" ? newIndices : filter === "due" ? dueIndices : order;

  const safePos = sequence.length ? Math.min(pos, sequence.length - 1) : 0;
  const cardIndex = sequence.length ? sequence[safePos] : null;
  const card = cardIndex != null ? cards[cardIndex] : null;
  const entry = cardIndex != null ? deckSrs[cardIndex] : null;

  // Verteilung auf die Leitner-Boxen (für die Mini-Übersicht).
  const boxCounts = useMemo(() => {
    const counts = new Array(LEITNER_MAX_BOX).fill(0);
    for (const e of Object.values(deckSrs)) {
      if (e?.box >= 1 && e.box <= LEITNER_MAX_BOX) counts[e.box - 1] += 1;
    }
    return counts;
  }, [deckSrs]);
  const hasSrs = boxCounts.some((n) => n > 0);

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

  const selectFilter = (id) => {
    setFilter((f) => (f === id ? "all" : id));
    setPos(0);
    setFlipped(false);
  };

  const mark = (isKnown) => {
    if (cardIndex == null) return;
    reviewCard(deckId, cardIndex, isKnown);
    setFlipped(false);
    // Verlässt die Karte den aktiven Filter, rückt die nächste automatisch nach.
    const leaves = filter === "new" || (filter === "due" && isKnown);
    if (!leaves) go(1);
  };

  /** Wischen: umgedreht = bewerten (→ Gewusst / ← Nochmal), sonst blättern. */
  const onSwipe = (dir) => {
    const right = dir === "right";
    if (flipped) mark(right);
    else go(right ? -1 : 1);
  };
  const swipe = useSwipeCard({ onSwipe, onTap: () => setFlipped((f) => !f) });

  /**
   * Tastatur auf der Karte: Leertaste/Enter dreht um, ←/→ machen dasselbe wie
   * das Wischen. Bewusst am Kartenelement statt am Fenster – auf der
   * Semester-Seite können mehrere Stapel gleichzeitig offen sein, und dann
   * dürfen die Pfeiltasten nur den Stapel bewegen, der gerade den Fokus hat.
   */
  const onCardKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped((f) => !f);
      return;
    }
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const forward = e.key === "ArrowRight";
    // Umgedreht bewerten, sonst blättern – Pfeile folgen dabei der
    // Leserichtung (→ weiter / gewusst), nicht der Wisch-Mechanik.
    if (flipped) mark(forward);
    else go(forward ? 1 : -1);
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
            className={cx(styles.tool, filter === "new" && styles.toolActive, "hover-pop")}
            onClick={() => selectFilter("new")}
            aria-pressed={filter === "new"}
          >
            Neu · {newIndices.length}
          </button>
          <button
            className={cx(styles.tool, filter === "due" && styles.toolActive, dueIndices.length > 0 && filter !== "due" && styles.toolAlert, "hover-pop")}
            onClick={() => selectFilter("due")}
            aria-pressed={filter === "due"}
          >
            Fällig · {dueIndices.length}
          </button>
        </div>
      </div>

      <ProgressBar value={known.size} max={cards.length} from={ACCENT.teal} to={color} height={4}
        label="Gewusste Karten" />

      {hasSrs && (
        <div className={styles.boxRow} aria-label="Leitner-Boxen">
          {boxCounts.map((n, i) => (
            <span key={i} className={cx(styles.boxPill, n > 0 && styles.boxPillFilled)} title={`Box ${i + 1}: ${n} Karten`}>
              <span className={styles.boxNr}>B{i + 1}</span> {n}
            </span>
          ))}
        </div>
      )}

      {card ? (
        <>
          <div className={styles.scene}>
            <div
              className={cx(styles.cardInner, "anim-card", swipe.dragging && "anim-cardDragging")}
              style={{ "--flip": flipped ? "180deg" : "0deg" }}
              {...swipe.handlers}
              role="button"
              tabIndex={0}
              onKeyDown={onCardKey}
              // Tastenkürzel gehören in aria-keyshortcuts, nicht ins Label:
              // Vorlesesoftware liest das Label bei jedem Kartenwechsel vor,
              // und eine Bedienungsanleitung darin wäre nur Lärm.
              aria-keyshortcuts="Space ArrowRight ArrowLeft"
              aria-label={flipped ? "Definition – antippen für Begriff" : "Begriff – antippen für Definition"}
            >
              <div className={styles.face}>
                <span className={styles.pos}>{safePos + 1}/{sequence.length}</span>
                {entry ? (
                  <span className={cx(styles.boxBadge, isDue(entry) && styles.boxBadgeDue)}>
                    📦 Stufe {entry.box}/{LEITNER_MAX_BOX}
                    {isDue(entry) ? " · fällig" : ` · ab ${fmtShort(entry.due)}`}
                  </span>
                ) : known.has(cardIndex) ? (
                  <span className={styles.knownBadge}>✓ gewusst</span>
                ) : null}
                <div className={styles.faceLabel}>Begriff</div>
                <div className={styles.faceTerm}>{card.front}</div>
              </div>
              <div className={cx(styles.face, styles.faceBack)}>
                <div className={styles.faceLabel} style={{ color: "var(--c)" }}>Definition</div>
                <div className={styles.faceDef}>{card.back}</div>
              </div>
            </div>
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
          <p className={styles.swipeHint}>
            {flipped
              ? "Wischen: rechts = Gewusst · links = Nochmal"
              : "Antippen zum Umdrehen · Wischen zum Blättern"}
          </p>
        </>
      ) : (
        <div className={styles.doneBox}>
          <div style={{ fontSize: "1.5rem", marginBottom: "var(--s-1)" }} aria-hidden="true">
            {filter === "due" ? "✅" : "🎉"}
          </div>
          <p style={{ margin: "0 0 var(--s-3)", fontWeight: 700, fontSize: "var(--fs-md)" }}>
            {filter === "due"
              ? "Nichts fällig – alles im grünen Bereich!"
              : filter === "new"
                ? "Keine neuen Karten mehr – stark!"
                : "Alle Karten gewusst – stark!"}
          </p>
          <Button tint={color} onClick={() => { setFilter("all"); setPos(0); }}>
            Alle Karten zeigen
          </Button>
        </div>
      )}
    </GlassCard>
  );
});

export default FlashcardDeck;
