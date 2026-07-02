import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import Quiz from "./Quiz.jsx";
import { SEMESTERS } from "../../data/semesters/index.js";
import { ACCENT } from "../../constants/theme.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { kb } from "../../utils/misc.js";
import quizStyles from "./quiz.module.css";
import cardStyles from "../cards/cards.module.css";

/** Alle Modul-Quizze, nach Semester gruppiert, mit Bestscores. */
const QuizDirectory = memo(function QuizDirectory({ open, onToggle, openQuizIds, onToggleQuiz }) {
  const { quizBest, saveQuizResult } = useProgress();
  const [expandedSemesters, setExpandedSemesters] = useState(() => new Set(["1"]));

  const grouped = useMemo(
    () =>
      SEMESTERS.map((sem) => ({
        nr: sem.nr,
        modules: sem.modules.filter((m) => m.quiz?.length > 0),
      })).filter((g) => g.modules.length > 0),
    []
  );

  const toggleSemester = (nr) =>
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      next.has(nr) ? next.delete(nr) : next.add(nr);
      return next;
    });

  return (
    <GlassCard tint={ACCENT.teal} id="quiz-verzeichnis" style={{ marginBottom: "var(--s-4)", overflow: "hidden" }}>
      <div className={`${cardStyles.head} hover-pop`} onClick={onToggle} {...kb(onToggle)} aria-expanded={open}>
        <span aria-hidden="true">🧩</span>
        <span style={{ flex: 1, fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT.teal }}>
          Quiz-Verzeichnis
        </span>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
          {grouped.reduce((n, g) => n + g.modules.length, 0)} Module
        </span>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
          {grouped.map((group) => {
            const expanded = expandedSemesters.has(String(group.nr));
            const visible = expanded ? group.modules : group.modules.slice(0, 1);
            return (
              <div key={group.nr}>
                <div className={quizStyles.dirSem}>
                  Semester {group.nr}
                  {group.modules.length > 1 && (
                    <button
                      className="hover-pop"
                      onClick={() => toggleSemester(String(group.nr))}
                      style={{ marginLeft: "auto", minHeight: 26, padding: "0.1rem 0.55rem",
                        borderRadius: "var(--r-full)", border: `1px solid color-mix(in srgb, ${ACCENT.teal} 40%, transparent)`,
                        background: "transparent", color: ACCENT.teal, fontSize: "0.58rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      {expanded ? "▲ weniger" : `▾ +${group.modules.length - 1} weitere`}
                    </button>
                  )}
                </div>
                {visible.map((mod) => {
                  const isOpen = openQuizIds.has(mod.id);
                  const best = quizBest[mod.id];
                  return (
                    <GlassCard key={mod.id} tint={isOpen ? ACCENT.teal : undefined} style={{ borderRadius: "var(--r-sm)", marginBottom: "var(--s-1)", overflow: "hidden" }}>
                      <div
                        className={`${quizStyles.dirRow} hover-pop`}
                        onClick={() => onToggleQuiz(mod.id)}
                        {...kb(() => onToggleQuiz(mod.id))}
                        aria-expanded={isOpen}
                      >
                        <span className={quizStyles.dirCode}>{mod.code}</span>
                        <span style={{ flex: 1, fontWeight: isOpen ? 700 : 500 }}>{mod.name}</span>
                        {best && (
                          <span style={{ fontSize: "0.56rem", fontWeight: 800, color: best.c === best.t ? ACCENT.teal : "var(--muted)" }}>
                            🏆{best.c}/{best.t}
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                      </div>
                      <Collapse open={isOpen}>
                        <div style={{ padding: "0 var(--s-2) var(--s-2)" }}>
                          <Quiz
                            questions={mod.quiz}
                            best={best}
                            onDone={(c, t) => saveQuizResult(mod.id, c, t)}
                          />
                        </div>
                      </Collapse>
                    </GlassCard>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default QuizDirectory;
