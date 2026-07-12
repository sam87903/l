import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, Puzzle } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import FlashcardDeck from "../flashcards/FlashcardDeck.jsx";
import TopicItem from "./TopicItem.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { cx, kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/** Ein Studienmodul: Prüfungsform, Themen, Quiz-Sprung, Lernkarten. */
const ModuleCard = memo(function ModuleCard({ module, color, autoOpen = false }) {
  const [open, setOpen] = useState(false);
  const { quizBest } = useProgress();
  const navigate = useNavigate();
  const toggle = () => setOpen((v) => !v);

  // Von außen angesteuert (z. B. Lernketten-Klick): Modul aufklappen.
  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const hasQuiz = module.quiz?.length > 0;
  const hasCards = module.cards?.length > 0;
  const best = quizBest[module.id];

  return (
    <GlassCard
      id={`modul-${module.id}`}
      tint={open ? color : undefined}
      className={styles.ringCard}
      style={{ "--c": color, borderRadius: "var(--r-md)", scrollMarginTop: "84px" }}
    >
      <div className={`${styles.modHead} hover-pop`} onClick={toggle} {...kb(toggle)} aria-expanded={open}>
        <span className={styles.modCode}>{module.code}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={cx(styles.modName, open && styles.modNameOpen)}>{module.name}</div>
          <div className={styles.modMeta}>
            {module.ects} ECTS{module.sws !== "—" ? ` · ${module.sws} SWS` : ""}
          </div>
        </div>
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div className={styles.modDetail}>
          <p className={styles.modDesc}>{module.desc}</p>

          <GlassCard className={styles.examBox}>
            <div className={styles.examKicker}>📋 Prüfungsform</div>
            <div className={styles.examText}>{module.exam}</div>
          </GlassCard>

          {module.topics?.length > 0 && (
            <>
              <div className={styles.sectionKicker}>
                📚 Themen · antippen für Definition & Beispiel
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)", marginBottom: "var(--s-2)" }}>
                {module.topics.map((topic, i) => (
                  <TopicItem key={i} topic={topic} color={color} />
                ))}
              </div>
            </>
          )}

          {hasQuiz && (
            <GlassCard
              as="button"
              tint={color}
              className="hover-pop"
              onClick={() => navigate("/plan", { state: { openQuizSection: true, openQuiz: module.id } })}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--s-2)",
                padding: "var(--s-3) var(--s-3)", marginBottom: "var(--s-2)",
                borderRadius: "var(--r-sm)", cursor: "pointer", color: "var(--text)",
                fontSize: "var(--fs-sm)", fontWeight: 600, textAlign: "left" }}
            >
              <Puzzle size={16} color={color} aria-hidden="true" />
              <span style={{ flex: 1 }}>
                Quiz zu diesem Modul starten{best ? ` · 🏆 ${best.c}/${best.t}` : ""}
              </span>
              <ArrowRight size={14} color={color} aria-hidden="true" />
            </GlassCard>
          )}

          {hasCards && <FlashcardDeck deckId={module.id} cards={module.cards} color={color} />}

          {!hasQuiz && !hasCards && (
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
              Konkrete Inhalte hängen vom gewählten Wahlmodul ab – siehe Wahlmodul-Verzeichnis unten.
            </p>
          )}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default ModuleCard;
