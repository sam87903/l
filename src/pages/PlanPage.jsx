import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import WeekBanner from "../components/cards/WeekBanner.jsx";
import DayCard from "../components/cards/DayCard.jsx";
import QuizDirectory from "../components/quiz/QuizDirectory.jsx";
import MistakeTrainer from "../components/quiz/MistakeTrainer.jsx";
import SmartQuizCard from "../components/quiz/SmartQuizCard.jsx";
import ResourceLibrary from "../components/resources/ResourceLibrary.jsx";
import { PLAN, WOCHEN } from "../data/plan.js";
import { WEEK_COLORS } from "../constants/theme.js";
import { todayPlanDay } from "../utils/dates.js";
import { useProgress } from "../context/ProgressContext.jsx";
import { ACCENT } from "../constants/theme.js";
import styles from "./pages.module.css";

/** 21-Tage-Lernplan mit Wochen, Quiz-Verzeichnis und Ressourcen. */
export default function PlanPage() {
  const { doneDays, toggleDay, startDate, setStartDate } = useProgress();
  const location = useLocation();
  const [openDays, setOpenDays] = useState(() => new Set());
  const [quizSectionOpen, setQuizSectionOpen] = useState(false);
  const [openQuizIds, setOpenQuizIds] = useState(() => new Set());
  const todayNr = todayPlanDay(startDate, PLAN.length);

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
      setOpenDays((prev) => new Set(prev).add(state.scrollDay));
      setTimeout(() => {
        document.getElementById(`day-${state.scrollDay}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
    if (state.openTrainer) {
      setTimeout(() => {
        document.getElementById("fehler-training")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
    if (state.openQuizSection) {
      setQuizSectionOpen(true);
      if (state.openQuiz) setOpenQuizIds((prev) => new Set(prev).add(state.openQuiz));
      setTimeout(() => {
        document.getElementById("quiz-verzeichnis")?.scrollIntoView({ behavior: "smooth" });
      }, 250);
    }
  }, [location.state]);

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={styles.banner} style={{ "--c": ACCENT.blue }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>📋 21-Tage-Plan · 20 Min/Tag</p>
        <h2 className={styles.bannerTitle}>Dein Fahrplan bis zum Semesterstart</h2>
        <p className={styles.bannerText}>
          Drei Wochen, drei Modulblöcke: BWL &amp; Buchführung, Handel &amp; E-Commerce, Informatik &amp; Java.
          Hake jeden Tag ab – dein Streak zählt mit.
        </p>
      </GlassCard>

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

      <SmartQuizCard />

      <MistakeTrainer />

      <QuizDirectory
        open={quizSectionOpen}
        onToggle={() => setQuizSectionOpen((v) => !v)}
        openQuizIds={openQuizIds}
        onToggleQuiz={toggleQuiz}
      />

      <ResourceLibrary />
    </PageTransition>
  );
}
