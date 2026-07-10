import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Collapse from "../components/ui/Collapse.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ExamUpload from "../components/exams/ExamUpload.jsx";
import ExamReport from "../components/exams/ExamReport.jsx";
import ExamRadar from "../components/exams/ExamRadar.jsx";
import ExamSimulator from "../components/exams/ExamSimulator.jsx";
import ExamHeatmap from "../components/exams/ExamHeatmap.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { ACCENT } from "../constants/theme.js";
import { kb } from "../utils/misc.js";
import examStyles from "../components/exams/exams.module.css";
import styles from "./pages.module.css";

/** Altklausuren analysieren: Themencluster, Aufgabentypen, Muster, Top 10. */
export default function ExamsPage() {
  const { exams, addExam, removeExam } = useProgress();
  const { push } = useToast();
  const [openId, setOpenId] = useState(null);

  // Volle Klausur-Objekte (Name, Datum, Text) – der RAG-Prompt braucht
  // mehr als nur die Texte.
  const otherExamsFor = useMemo(
    () => (examId) => exams.filter((e) => e.id !== examId),
    [exams]
  );

  const handleAdd = (name, text) => {
    const id = addExam(name, text);
    setOpenId(id);
    push("Klausur analysiert & gespeichert", "🔍");
  };

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.teal} className={styles.banner} style={{ "--c": ACCENT.teal }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>📄 Altklausuren analysieren</p>
        <h2 className={styles.bannerTitle}>Prüfungsmuster erkennen, gezielt lernen</h2>
        <p className={styles.bannerText}>
          Füge den Text einer Altklausur ein: Die Analyse erkennt Themencluster, Aufgabentypen,
          Schwierigkeitsniveau und – bei mehreren Klausuren – wiederkehrende Muster inkl.
          „Top 10 Prüfungswahrscheinlichkeit". Alles lokal auf deinem Gerät.
        </p>
      </GlassCard>

      <ExamRadar exams={exams} />

      <ExamHeatmap exams={exams} />

      <ExamSimulator />

      <ExamUpload onAdd={handleAdd} />

      <div className={styles.sectionTitle}>🗂️ Gespeicherte Klausuren ({exams.length})</div>
      {exams.length === 0 && (
        <EmptyState icon="📭">Noch keine Klausur gespeichert – füge oben die erste ein.</EmptyState>
      )}
      {exams.map((exam) => {
        const open = openId === exam.id;
        return (
          <GlassCard key={exam.id} tint={open ? ACCENT.teal : undefined}
            style={{ marginBottom: "var(--s-2)", overflow: "hidden" }}>
            <div className={`${examStyles.examRow} hover-pop`}
              onClick={() => setOpenId(open ? null : exam.id)}
              {...kb(() => setOpenId(open ? null : exam.id))}
              aria-expanded={open}>
              <span aria-hidden="true">📄</span>
              <span className={examStyles.examName}>{exam.name}</span>
              <span className={examStyles.examMeta}>
                {new Date(exam.addedAt).toLocaleDateString("de-DE")} · {Math.round(exam.text.length / 1000)}k Zeichen
              </span>
              <button className={`${examStyles.deleteBtn} hover-pop`}
                onClick={(e) => { e.stopPropagation(); removeExam(exam.id); if (open) setOpenId(null); }}
                aria-label={`Klausur „${exam.name}" löschen`}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
              {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
            </div>
            <Collapse open={open}>
              <div style={{ padding: "0 var(--s-3) var(--s-3)" }}>
                <ExamReport exam={exam} otherExams={otherExamsFor(exam.id)} />
              </div>
            </Collapse>
          </GlassCard>
        );
      })}
    </PageTransition>
  );
}
