import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ClipboardCopy, FlaskConical, Play, RotateCcw, Send } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import Collapse from "../ui/Collapse.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Quiz from "../quiz/Quiz.jsx";
import { useOpenTopic } from "./useOpenTopic.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useCountdownTimer } from "../../hooks/useCountdownTimer.js";
import { formatClock } from "../../context/TimerContext.jsx";
import { buildExamProfile, buildMockExam, gradeMockExam, EXAM_SIZES, MC_POINTS, OPEN_POINTS } from "../../utils/examSimulator.js";
import { copyText, cx, kb } from "../../utils/misc.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./exams.module.css";
import quizStyles from "../quiz/quiz.module.css";

/* Selbsteinschätzung je offener Aufgabe. */
const SELF_GRADES = [
  { value: 1, label: "✅ Gewusst" },
  { value: 0.5, label: "🌓 Teilweise" },
  { value: 0, label: "❌ Nicht gewusst" },
];

const letter = (i) => String.fromCharCode(97 + i);

/** Probeklausur als kopierbaren Text rendern (inkl. Musterlösungen). */
function mockExamAsText(mock) {
  const lines = [
    `PROBEKLAUSUR (generiert aus ${mock.profile.examCount} Altklausuren)`,
    `Bearbeitungszeit: ${mock.durationMin} Min · ${mock.maxPoints} Punkte`,
    "",
    `TEIL A – MULTIPLE CHOICE (je ${MC_POINTS} Punkte)`,
    ...mock.mc.flatMap((q, i) => [
      "",
      `${i + 1}. ${q.q}`,
      ...q.options.map((o, oi) => `   ${letter(oi)}) ${o}`),
    ]),
    "",
    `TEIL B – OFFENE AUFGABEN (je ${OPEN_POINTS} Punkte)`,
    ...mock.open.flatMap((q, i) => ["", `${mock.mc.length + i + 1}. ${q.prompt}`]),
    "",
    "═".repeat(40),
    "LÖSUNGEN",
    "",
    "Teil A:",
    ...mock.mc.map((q, i) => `${i + 1}. ${letter(q.correct)}) ${q.options[q.correct]}`),
    "",
    "Teil B (Musterlösungen):",
    ...mock.open.flatMap((q, i) => ["", `${mock.mc.length + i + 1}. ${q.term}:`, q.modelAnswer]),
  ];
  return lines.join("\n");
}

/**
 * Klausur-Simulator: generiert aus den gespeicherten Altklausuren eine
 * realistische Probeklausur mit Zeitlimit, MC-Teil (Fragenbank, Richtung
 * Klausurschwerpunkte geboostet) und offenen Aufgaben mit Musterlösung
 * und Selbsteinschätzung.
 */
const ExamSimulator = memo(function ExamSimulator() {
  const { exams, wrongPool, fcKnown, quizBest, recordAnswer, simHistory, addSimResult } = useProgress();
  const { push } = useToast();
  const openTopic = useOpenTopic();
  const [size, setSize] = useState("standard");
  const [phase, setPhase] = useState("setup"); // setup | exam | result
  const [mock, setMock] = useState(null);
  const [mcAnswers, setMcAnswers] = useState({}); // Frage-Index → richtig?
  const [openGrades, setOpenGrades] = useState({}); // Aufgaben-Index → 0|0.5|1
  const [openDrafts, setOpenDrafts] = useState({});
  const [revealed, setRevealed] = useState({});
  // Vergleichswert: der Versuch VOR dem gerade abgegebenen.
  const [prevAttempt, setPrevAttempt] = useState(null);
  const savedRef = useRef(null);

  const progress = useMemo(() => ({ wrongPool, fcKnown, quizBest }), [wrongPool, fcKnown, quizBest]);
  const profile = useMemo(() => buildExamProfile(exams), [exams]);

  const expire = useCallback(() => {
    push("Zeit abgelaufen – die Klausur wird abgegeben.", "⏰");
    setPhase("result");
  }, [push]);
  const timer = useCountdownTimer(EXAM_SIZES[1].mc * 90, expire);

  const start = () => {
    const m = buildMockExam({ exams, progress, size });
    if (!m) return;
    setMock(m);
    setMcAnswers({});
    setOpenGrades({});
    setOpenDrafts({});
    setRevealed({});
    setPhase("exam");
    timer.reset(m.durationMin * 60);
    timer.start();
  };

  const submit = () => {
    timer.pause();
    setPhase("result");
  };

  // Ergebnis genau einmal pro Probeklausur im Verlauf speichern.
  useEffect(() => {
    if (phase !== "result" || !mock || savedRef.current === mock) return;
    savedRef.current = mock;
    const mcCorrect = Object.values(mcAnswers).filter(Boolean).length;
    const result = gradeMockExam({
      mcCorrect,
      mcTotal: mock.mc.length,
      openScores: mock.open.map((_, i) => openGrades[i] ?? 0),
    });
    setPrevAttempt(simHistory[0] ?? null);
    addSimResult({
      size,
      pct: result.pct,
      grade: result.grade,
      points: result.points,
      maxPoints: result.maxPoints,
      passed: result.passed,
    });
  }, [phase, mock, mcAnswers, openGrades, simHistory, addSimResult, size]);

  const backToSetup = () => {
    timer.pause();
    setMock(null);
    setPhase("setup");
  };

  const copyExam = async () => {
    const ok = await copyText(mockExamAsText(mock));
    push(ok ? "Probeklausur als Text kopiert" : "Kopieren fehlgeschlagen", ok ? "📋" : "⚠️");
  };

  /* ── Setup ── */
  if (phase === "setup") {
    return (
      <GlassCard tint={ACCENT.violet} className={styles.radar} style={{ "--c": ACCENT.violet }}>
        <div className={styles.radarHead}>
          <span className={styles.radarTitle} style={{ color: ACCENT.violet }}>
            <FlaskConical size={15} aria-hidden="true" /> Klausur-Simulator
          </span>
          {profile.examCount > 0 && (
            <span className={styles.radarSub}>aus {profile.examCount} Klausur{profile.examCount > 1 ? "en" : ""}</span>
          )}
        </div>
        {profile.examCount === 0 ? (
          <EmptyState icon="🧪">
            Füge zuerst Altklausuren hinzu – der Simulator baut daraus realistische Probeklausuren.
          </EmptyState>
        ) : (
          <>
            <p className={styles.radarLead}>
              Realistische Probeklausur mit Zeitlimit: Multiple Choice aus der Fragenbank
              (Schwerpunkt auf deinen Klausur-Themen) plus offene Aufgaben mit Musterlösung.
              {profile.modules.length > 0 &&
                ` Schwerpunkt: ${profile.modules.slice(0, 3).map((m) => m.module.code).join(", ")}.`}
            </p>
            <div className={quizStyles.smartRow} role="group" aria-label="Umfang wählen">
              {EXAM_SIZES.map((s) => (
                <button
                  key={s.id}
                  className={cx(quizStyles.smartOpt, size === s.id && quizStyles.smartOptActive, "hover-pop")}
                  onClick={() => setSize(s.id)}
                  aria-pressed={size === s.id}
                >
                  {s.label} · {s.mc} MC + {s.open} offen
                </button>
              ))}
            </div>
            <Button tint={ACCENT.violet} style={{ width: "100%", marginTop: "var(--s-2)" }} onClick={start}>
              <Play size={15} aria-hidden="true" /> Probeklausur starten
            </Button>

            {simHistory.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionKicker} style={{ "--c": ACCENT.violet }}>
                  📜 Deine letzten Ergebnisse
                </div>
                {simHistory.slice(0, 5).map((h, i) => (
                  <div key={h.at ?? i} className={styles.simHistRow}>
                    <span className={styles.simHistGrade} data-passed={h.passed || undefined}>{h.grade}</span>
                    <span className={styles.simHistMeta}>
                      {h.pct} % · {EXAM_SIZES.find((s) => s.id === h.size)?.label ?? h.size}
                    </span>
                    <span className={styles.simHistDate}>
                      {h.at ? new Date(h.at).toLocaleDateString("de-DE") : ""}
                    </span>
                  </div>
                ))}
                {simHistory.length >= 2 && (
                  <p className={styles.simTrend}>
                    {simHistory[0].pct > simHistory[1].pct
                      ? `📈 Aufwärtstrend: +${simHistory[0].pct - simHistory[1].pct} Prozentpunkte gegenüber dem Versuch davor.`
                      : simHistory[0].pct < simHistory[1].pct
                        ? `📉 ${simHistory[0].pct - simHistory[1].pct} Prozentpunkte gegenüber dem Versuch davor – dranbleiben!`
                        : "➡️ Stabil auf dem Niveau des letzten Versuchs."}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </GlassCard>
    );
  }

  /* ── Ergebnis ── */
  if (phase === "result" && mock) {
    const mcCorrect = Object.values(mcAnswers).filter(Boolean).length;
    const result = gradeMockExam({
      mcCorrect,
      mcTotal: mock.mc.length,
      openScores: mock.open.map((_, i) => openGrades[i] ?? 0),
    });
    const weakOpen = mock.open.filter((_, i) => (openGrades[i] ?? 0) < 1);
    return (
      <GlassCard tint={ACCENT.violet} className={styles.radar} style={{ "--c": ACCENT.violet }}>
        <div className={styles.radarHead}>
          <span className={styles.radarTitle} style={{ color: ACCENT.violet }}>
            <FlaskConical size={15} aria-hidden="true" /> Ergebnis der Probeklausur
          </span>
        </div>
        <div className={styles.simGradeHero}>
          <span className={styles.simGradeNote} data-passed={result.passed || undefined}>{result.grade}</span>
          <span className={styles.simGradeLabel}>
            {result.gradeLabel} · {result.points} von {result.maxPoints} Punkten ({result.pct} %)
          </span>
        </div>
        <ProgressBar value={result.pct} from={ACCENT.violet} to={ACCENT.teal} height={6} label="Ergebnis" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-1)", margin: "var(--s-3) 0" }}>
          <span className={styles.badge}>Teil A: {mcCorrect}/{mock.mc.length} MC ({mcCorrect * MC_POINTS} P)</span>
          <span className={styles.badge}>
            Teil B: {mock.open.reduce((s, _, i) => s + (openGrades[i] ?? 0) * OPEN_POINTS, 0)} von {mock.open.length * OPEN_POINTS} P
          </span>
          {prevAttempt && (
            <span className={styles.badge}>
              {result.pct > prevAttempt.pct
                ? `📈 +${result.pct - prevAttempt.pct} Pp. vs. letzter Versuch (${prevAttempt.grade})`
                : result.pct < prevAttempt.pct
                  ? `📉 ${result.pct - prevAttempt.pct} Pp. vs. letzter Versuch (${prevAttempt.grade})`
                  : `➡️ wie letzter Versuch (${prevAttempt.grade})`}
            </span>
          )}
        </div>
        {weakOpen.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionKicker} style={{ "--c": ACCENT.red }}>🎯 Nochmal lernen</div>
            {weakOpen.map((q) => (
              <div
                key={q.term}
                className={cx(styles.typeRow, "hover-pop")}
                style={{ cursor: "pointer" }}
                onClick={() => openTopic(q)}
                {...kb(() => openTopic(q))}
              >
                <span style={{ flex: 1 }}>{q.term}</span>
                {q.module && <strong>{q.module.code}</strong>}
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: "0 0 var(--s-2)", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
          Falsch beantwortete MC-Fragen sind bereits in deiner Fehler-Kartei gelandet.
        </p>
        <div className={styles.actions}>
          <Button tint={ACCENT.violet} onClick={backToSetup}>
            <RotateCcw size={14} aria-hidden="true" /> Neue Probeklausur
          </Button>
          <Button onClick={copyExam}>
            <ClipboardCopy size={14} aria-hidden="true" /> Als Text kopieren
          </Button>
        </div>
      </GlassCard>
    );
  }

  /* ── Prüfungsmodus ── */
  if (!mock) return null;
  const answeredMc = Object.keys(mcAnswers).length;
  const gradedOpen = Object.keys(openGrades).length;
  return (
    <GlassCard tint={ACCENT.violet} className={styles.radar} style={{ "--c": ACCENT.violet }}>
      <div className={styles.radarHead}>
        <span className={styles.radarTitle} style={{ color: ACCENT.violet }}>
          <FlaskConical size={15} aria-hidden="true" /> Probeklausur läuft
        </span>
        <span className={styles.simClock} aria-hidden="true">{formatClock(timer.remaining)}</span>
      </div>
      <ProgressBar value={timer.remaining} max={mock.durationMin * 60} from={ACCENT.violet} to={ACCENT.red}
        height={4} label="Verbleibende Zeit" />

      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.violet }}>
          Teil A – Multiple Choice ({mock.mc.length} × {MC_POINTS} P)
        </div>
        <Quiz
          questions={mock.mc}
          color={ACCENT.violet}
          shuffleAnswers
          onAnswer={(qi, ok) => {
            setMcAnswers((prev) => ({ ...prev, [qi]: ok }));
            recordAnswer(mock.mc[qi].recordMod, mock.mc[qi].recordKey, ok, mock.mc[qi]);
          }}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionKicker} style={{ "--c": ACCENT.blue }}>
          Teil B – Offene Aufgaben ({mock.open.length} × {OPEN_POINTS} P)
        </div>
        {mock.open.map((q, i) => (
          <div key={q.term} className={styles.openItem}>
            <p className={styles.openPrompt}>
              <strong>{i + 1}.</strong> {q.prompt} <span className={styles.badge}>{q.points} P</span>
            </p>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Deine Antwort (nur für dich – wird nicht gespeichert)…"
              value={openDrafts[i] ?? ""}
              onChange={(e) => setOpenDrafts((prev) => ({ ...prev, [i]: e.target.value }))}
              aria-label={`Antwort zu Aufgabe ${i + 1}`}
            />
            <Button
              style={{ width: "100%", marginTop: "var(--s-1)" }}
              onClick={() => setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
            >
              {revealed[i] ? "Musterlösung verbergen" : "Musterlösung anzeigen"}
            </Button>
            <Collapse open={!!revealed[i]}>
              <div className={styles.modelAnswer}>
                <p style={{ margin: 0, whiteSpace: "pre-line" }}>{q.modelAnswer}</p>
                <div className={quizStyles.smartRow} role="group" aria-label={`Selbsteinschätzung Aufgabe ${i + 1}`}>
                  {SELF_GRADES.map((g) => (
                    <button
                      key={g.value}
                      className={cx(quizStyles.smartOpt, openGrades[i] === g.value && quizStyles.smartOptActive, "hover-pop")}
                      onClick={() => setOpenGrades((prev) => ({ ...prev, [i]: g.value }))}
                      aria-pressed={openGrades[i] === g.value}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </Collapse>
          </div>
        ))}
      </div>

      <Button tint={ACCENT.teal} style={{ width: "100%" }} onClick={submit}>
        {answeredMc === mock.mc.length && gradedOpen === mock.open.length ? (
          <><Check size={15} aria-hidden="true" /> Klausur abgeben</>
        ) : (
          <><Send size={15} aria-hidden="true" /> Vorzeitig abgeben ({answeredMc}/{mock.mc.length} MC · {gradedOpen}/{mock.open.length} offen)</>
        )}
      </Button>
    </GlassCard>
  );
});

export default ExamSimulator;
