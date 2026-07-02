import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Repeat2, BookOpen } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import { buildQuizAnalysis, buildQuizPrompt } from "../../utils/quizAnalysis.js";
import { copyText } from "../../utils/misc.js";
import { useToast } from "../ui/Toast.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./quiz.module.css";

/**
 * Lernanalyse nach einem beendeten Quiz: Stärken, Wissenslücken,
 * priorisierte Lernliste und nächste Lernaktivität – rein lokal berechnet.
 */
const QuizAnalysis = memo(function QuizAnalysis({ module, questions, answers }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const analysis = useMemo(
    () => buildQuizAnalysis(module, questions, answers),
    [module, questions, answers]
  );

  const copyAiPrompt = async () => {
    const ok = await copyText(buildQuizPrompt(module, questions, answers));
    push(ok ? "KI-Prompt kopiert – in ChatGPT/Claude einfügen" : "Kopieren fehlgeschlagen", ok ? "🤖" : "⚠️");
  };

  return (
    <div className={styles.analysis} aria-label="Lernanalyse">
      <div className={styles.analysisHead}>
        <span aria-hidden="true">🧠</span> Lernanalyse · {analysis.score}% richtig
      </div>

      <div className={styles.analysisSection}>
        <div className={styles.analysisKicker} style={{ color: ACCENT.teal }}>1 · Stärken</div>
        {analysis.strengths.length > 0 ? (
          <ul className={styles.analysisList}>
            {analysis.strengths.map((topic) => <li key={topic}>✅ {topic}</li>)}
          </ul>
        ) : (
          <p className={styles.analysisText}>Noch keine sicher beherrschten Themen in diesem Durchlauf.</p>
        )}
      </div>

      <div className={styles.analysisSection}>
        <div className={styles.analysisKicker} style={{ color: ACCENT.red }}>2 · Wissenslücken</div>
        {analysis.gaps.length === 0 ? (
          <p className={styles.analysisText}>Keine – alles richtig! 🎉</p>
        ) : (
          analysis.gaps.map((gap) => (
            <div key={gap.qi} className={styles.analysisGap}>
              <strong>Du hast Probleme mit: {gap.topic}</strong>
              <span>Richtig wäre: „{gap.correctText}"{gap.explain ? ` – ${gap.explain}` : ""}</span>
            </div>
          ))
        )}
      </div>

      {analysis.priorities.length > 0 && (
        <div className={styles.analysisSection}>
          <div className={styles.analysisKicker} style={{ color: ACCENT.violet }}>3 · Priorisierte Lernliste</div>
          <ol className={styles.analysisList}>
            {analysis.priorities.map((p) => (
              <li key={p.topic}>{p.topic}{p.count > 1 ? ` (${p.count}× falsch)` : ""}</li>
            ))}
          </ol>
          {analysis.critical && <p className={styles.analysisCritical}>⚠️ {analysis.critical}</p>}
        </div>
      )}

      <div className={styles.analysisSection}>
        <div className={styles.analysisKicker} style={{ color: ACCENT.blue }}>4 · Nächste Lernaktivität</div>
        <p className={styles.analysisText}>{analysis.nextActivity}</p>
      </div>

      <div className={styles.analysisActions}>
        {analysis.gaps.length > 0 && (
          <Button tint={ACCENT.red} onClick={() => navigate("/plan", { state: { openTrainer: Date.now() } })}>
            <Repeat2 size={14} aria-hidden="true" /> Fehler üben
          </Button>
        )}
        {analysis.priorities[0] && (
          <Button tint={ACCENT.violet}
            onClick={() => navigate("/glossar", { state: { query: analysis.priorities[0].topic.split(/[\s(&,]/)[0] } })}>
            <BookOpen size={14} aria-hidden="true" /> Glossar
          </Button>
        )}
        <Button tint={ACCENT.blue} onClick={copyAiPrompt}>
          <Bot size={14} aria-hidden="true" /> KI-Prompt kopieren
        </Button>
      </div>
    </div>
  );
});

export default QuizAnalysis;
