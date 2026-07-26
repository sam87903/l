import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Collapse from "../components/ui/Collapse.jsx";
import WeekBanner from "../components/cards/WeekBanner.jsx";
import DayCard from "../components/cards/DayCard.jsx";
import QuizDirectory from "../components/quiz/QuizDirectory.jsx";
import MistakeTrainer from "../components/quiz/MistakeTrainer.jsx";
import SmartQuizCard from "../components/quiz/SmartQuizCard.jsx";
import DueTrainer from "../components/flashcards/DueTrainer.jsx";
import ModuleResources from "../components/resources/ModuleResources.jsx";
import PodcastPlayer from "../components/podcast/PodcastPlayer.jsx";
import FormulaTool from "../components/formulas/FormulaTool.jsx";
import { PLAN, WOCHEN } from "../data/plan.js";
import { WEEK_COLORS } from "../constants/theme.js";
import { todayPlanDay } from "../utils/dates.js";
import { useProgress } from "../context/ProgressContext.jsx";
import { ACCENT } from "../constants/theme.js";
import { cx, kb } from "../utils/misc.js";
import cardStyles from "../components/cards/cards.module.css";
import styles from "./pages.module.css";

/**
 * Zu einem Element scrollen, das erst noch gemountet wird.
 *
 * Eingeklappte Bereiche hängen ihren Inhalt aus dem DOM aus, und während der
 * Aufklapp-Animation hat er noch keine Höhe. Beides würde einen Deep-Link ins
 * Leere laufen lassen: Deshalb wird gewartet, bis das Ziel wirklich Platz
 * einnimmt, und nach der Animation noch einmal nachjustiert.
 */
function scrollToId(id, block = "center", tries = 20) {
  const el = document.getElementById(id);
  if (el && el.getBoundingClientRect().height > 0) {
    el.scrollIntoView({ behavior: "smooth", block });
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block }), 380);
    return;
  }
  if (tries > 0) setTimeout(() => scrollToId(id, block, tries - 1), 80);
}

/** Übungsbereich: Quiz, Karten, Formeln, Podcast – plus den Tagesplan zum Aufklappen. */
export default function PlanPage() {
  const { doneDays, toggleDay, startDate, setStartDate } = useProgress();
  const location = useLocation();
  const [openDays, setOpenDays] = useState(() => new Set());
  const [quizSectionOpen, setQuizSectionOpen] = useState(false);
  const [openQuizIds, setOpenQuizIds] = useState(() => new Set());
  // Der Tagesplan liegt eingeklappt: Die Themen stehen ausführlicher unter
  // „Semester", hier stören sie beim Weg zu den Übungen.
  const [planOpen, setPlanOpen] = useState(false);
  const todayNr = todayPlanDay(startDate, PLAN.length);
  const doneTotal = useMemo(
    () => PLAN.filter((d) => doneDays[d.nr]).length,
    [doneDays]
  );

  const toggleOpenDay = useCallback((nr) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      next.has(nr) ? next.delete(nr) : next.add(nr);
      return next;
    });
  }, []);

  const toggleQuiz = useCallback((id) => {
    setOpenQuizIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Navigation-State: Tag scrollen / Quiz aus anderem Screen öffnen
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.scrollDay) {
      // Ein Tages-Link vom Dashboard muss den eingeklappten Plan mit öffnen.
      setPlanOpen(true);
      setOpenDays((prev) => new Set(prev).add(state.scrollDay));
      scrollToId(`day-${state.scrollDay}`);
    }
    if (state.openTrainer) scrollToId("fehler-training", "start");
    if (state.openQuizSection) {
      setQuizSectionOpen(true);
      if (state.openQuiz) setOpenQuizIds((prev) => new Set(prev).add(state.openQuiz));
      scrollToId("quiz-verzeichnis", "start");
    }
    // Generisches Sprungziel (z. B. „smart-quiz", „karten-training")
    if (state.scrollTo) scrollToId(state.scrollTo, "start");
  }, [location.state]);

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={styles.banner} style={{ "--c": ACCENT.blue }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>🧰 Übungsbereich</p>
        <h2 className={styles.bannerTitle}>Üben, wiederholen, abfragen</h2>
        <p className={styles.bannerText}>
          Smart-Quiz, Karten- und Fehler-Training, Formeln und Podcast an einem Ort.
          Der 21-Tage-Plan liegt eingeklappt darunter.
        </p>
      </GlassCard>

      {/* Tagesplan: eingeklappt, weil die Themen ausführlicher unter
          „Semester" stehen. Abhaken, Streak und XP bleiben unverändert. */}
      <GlassCard tint={ACCENT.blue} id="tagesplan" style={{ marginBottom: "var(--s-4)", overflow: "hidden" }}>
        <div
          className={cx(cardStyles.head, "hover-pop")}
          onClick={() => setPlanOpen((v) => !v)}
          {...kb(() => setPlanOpen((v) => !v))}
          aria-expanded={planOpen}
        >
          <CalendarDays size={16} color={ACCENT.blue} aria-hidden="true" />
          <span style={{ flex: 1, fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase", color: ACCENT.blue }}>
            21-Tage-Plan
          </span>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
            {doneTotal}/{PLAN.length}{todayNr ? ` · heute Tag ${todayNr}` : ""}
          </span>
          {planOpen ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
        </div>

        <Collapse open={planOpen}>
          <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
            <p style={{ margin: "0 0 var(--s-3)", fontSize: "var(--fs-xs)", color: "var(--muted)", lineHeight: 1.6 }}>
              Drei Wochen, drei Modulblöcke: BWL &amp; Buchführung, Handel &amp; E-Commerce,
              Informatik &amp; Java. Hake jeden Tag ab – dein Streak zählt mit.
            </p>

            <GlassCard className={styles.dateRow}>
              <label htmlFor="abreise" style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", whiteSpace: "nowrap" }}>
                ✈️ Abreise:
              </label>
              <input
                id="abreise"
                className={styles.dateInput}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", whiteSpace: "nowrap" }}>→ 31.07.</span>
            </GlassCard>

            {WOCHEN.map((week) => {
              const color = WEEK_COLORS[week.nr];
              const days = PLAN.filter((d) => d.w === week.nr);
              const doneCount = days.filter((d) => doneDays[d.nr]).length;
              return (
                <section key={week.nr} style={{ marginBottom: "var(--s-5)" }} aria-label={`Woche ${week.nr}`}>
                  <WeekBanner week={week} color={color} doneCount={doneCount} totalCount={days.length} />
                  {days.map((day) => (
                    <DayCard
                      key={day.nr}
                      day={day}
                      color={color}
                      startDate={startDate}
                      isOpen={openDays.has(day.nr)}
                      isDone={!!doneDays[day.nr]}
                      isToday={todayNr === day.nr}
                      onToggleOpen={() => toggleOpenDay(day.nr)}
                      onToggleDone={() => toggleDay(day.nr)}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        </Collapse>
      </GlassCard>

      <ModuleResources />

      <FormulaTool />

      <SmartQuizCard />

      <div id="karten-training" style={{ scrollMarginTop: "100px" }}>
        <DueTrainer />
      </div>

      <MistakeTrainer />

      <QuizDirectory
        open={quizSectionOpen}
        onToggle={() => setQuizSectionOpen((v) => !v)}
        openQuizIds={openQuizIds}
        onToggleQuiz={toggleQuiz}
      />

      <PodcastPlayer />

    </PageTransition>
  );
}
