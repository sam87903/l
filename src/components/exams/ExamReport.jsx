import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Puzzle } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { analyzeExam, buildExamPrompt } from "../../utils/examAnalysis.js";
import { copyText } from "../../utils/misc.js";
import { useToast } from "../ui/Toast.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./exams.module.css";

/** Vollständiger Analyse-Report einer gespeicherten Altklausur. */
const ExamReport = memo(function ExamReport({ exam, otherTexts }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const analysis = useMemo(() => analyzeExam(exam.text, otherTexts), [exam, otherTexts]);

  const copyAiPrompt = async () => {
    const ok = await copyText(buildExamPrompt(exam.name, exam.text));
    push(ok ? "KI-Prompt kopiert – in ChatGPT/Claude einfügen" : "Kopieren fehlgeschlagen", ok ? "🤖" : "⚠️");
  };

  if (analysis.top10.length === 0) {
    return (
      <EmptyState icon="🔍">
        Keine bekannten Themen erkannt – prüfe, ob der Text vollständig eingefügt wurde.
      </EmptyState>
    );
  }

  const topModule = analysis.modules[0];

  return (
    <div style={{ padding: "0 var(--s-1)" }}>
      {/* Top 10 Prüfungswahrscheinlichkeit */}
      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.teal }}>
          🎯 Top {analysis.top10.length} Prüfungswahrscheinlichkeit
        </div>
        {analysis.top10.map((t) => (
          <div key={t.rank} className={styles.topRow}
            title={`${t.count}× in dieser Klausur${t.recurrence ? ` · auch in ${t.recurrence} weiteren` : ""}`}>
            <span className={styles.topRank}>{t.rank}.</span>
            <span className={styles.topTerm}>{t.term}</span>
            <div className={styles.topBarTrack} role="progressbar" aria-valuenow={t.probability}
              aria-valuemin={0} aria-valuemax={100}
              aria-valuetext={`${t.term}: ${t.probability}% relative Prüfungswahrscheinlichkeit`}>
              <div className={styles.topBarFill} style={{ width: `${t.probability}%` }} />
            </div>
            <span className={styles.topPct}>{t.probability}%</span>
          </div>
        ))}
      </div>

      {/* Themencluster / geprüfte Module */}
      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.blue }}>📚 Geprüfte Module</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-1)" }}>
          {analysis.modules.map((m) => (
            <span key={m.module.id} className={styles.badge}>
              {m.module.code} · {[...new Set(m.terms)].length} Themen
            </span>
          ))}
          {analysis.modules.length === 0 && (
            <span className={styles.badge}>Kein Modul eindeutig zuordenbar</span>
          )}
        </div>
      </div>

      {/* Aufgabentypen */}
      {analysis.taskTypes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionKicker} style={{ "--c": ACCENT.violet }}>📝 Aufgabentypen</div>
          {analysis.taskTypes.map((t) => (
            <div key={t.id} className={styles.typeRow}>
              <span aria-hidden="true">{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              <strong>{t.count}× erkannt</strong>
            </div>
          ))}
        </div>
      )}

      {/* Schwierigkeitsniveau */}
      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.red }}>⚖️ Schwierigkeitsniveau</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-1)", marginBottom: "var(--s-1)" }}>
          {analysis.difficulty.map((d) => (
            <span key={d.id} className={styles.badge}>{d.label}: {d.share}%</span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
          Gesamteinschätzung: <strong>{analysis.overallDifficulty}</strong>.
          {analysis.heavyShare >= 25 && analysis.top10[0] &&
            ` Typische Stolperstellen: Transfer-/Rechenaufgaben zu „${analysis.top10[0].term}"${analysis.top10[1] ? ` und „${analysis.top10[1].term}"` : ""}.`}
        </p>
      </div>

      {/* Wiederkehrende Muster */}
      {analysis.recurring.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionKicker} style={{ "--c": ACCENT.teal }}>🔁 Wiederkehrende Muster</div>
          {analysis.recurring.map((r) => (
            <div key={r.term} className={styles.typeRow}>
              <span style={{ flex: 1 }}>{r.term}</span>
              <strong>in {r.inExams} von {r.total} Klausuren</strong>
            </div>
          ))}
        </div>
      )}

      {/* Lernstrategie */}
      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.blue }}>🧭 Lernstrategie</div>
        <ol style={{ margin: "0 0 var(--s-2)", paddingLeft: "1.2rem", fontSize: "var(--fs-sm)", lineHeight: 1.7 }}>
          {analysis.top10.slice(0, 3).map((t) => (
            <li key={t.rank}>
              <strong>{t.term}</strong> zuerst lernen
              {t.module ? ` (Modul ${t.module.code}, Prüfung: ${t.module.exam})` : ""}
            </li>
          ))}
          {analysis.taskTypes[0] && (
            <li>Aufgabentyp „{analysis.taskTypes[0].label}" gezielt üben – häufigster Typ dieser Klausur</li>
          )}
        </ol>
        <div className={styles.actions}>
          {topModule?.module?.quiz?.length > 0 && (
            <Button tint={ACCENT.teal}
              onClick={() => navigate("/plan", { state: { openQuizSection: true, openQuiz: topModule.module.id } })}>
              <Puzzle size={14} aria-hidden="true" /> Quiz {topModule.module.code}
            </Button>
          )}
          <Button tint={ACCENT.blue} onClick={copyAiPrompt}>
            <Bot size={14} aria-hidden="true" /> KI-Prompt kopieren
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ExamReport;
