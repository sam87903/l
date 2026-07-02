import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Pill from "../components/ui/Pill.jsx";
import WeekBanner from "../components/cards/WeekBanner.jsx";
import DetailDayCard from "../components/detail/DetailDayCard.jsx";
import { PLAN, WOCHEN } from "../data/plan.js";
import { BOOK } from "../utils/links.js";
import { WEEK_COLORS, ACCENT } from "../constants/theme.js";
import { useProgress } from "../context/ProgressContext.jsx";
import styles from "./pages.module.css";

const FLASHCARD_CODE = "53220-33846-342AA-43471-1D108";

/** Detailliertes Tages-Kompendium mit Lernzielen und Kernbegriffen. */
export default function DetailPage() {
  const { doneDays, toggleDay, startDate } = useProgress();

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.violet} className={styles.banner} style={{ "--c": ACCENT.violet }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>📖 Dein Studienbuch · Modul ECM</p>
        <h2 className={styles.bannerTitle}>Frank Deges – Grundlagen des E-Commerce</h2>
        <p className={styles.bannerText} style={{ marginBottom: "var(--s-3)" }}>
          Strategien, Modelle, Instrumente · 2. Auflage · Springer Gabler 2023
        </p>
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "var(--s-1)" }}>
          <Pill label="📂 Buch öffnen" href={BOOK} color={ACCENT.violet} />
          <Pill label="🃏 Springer Flashcards" href="https://flashcards.springernature.com/login" color={ACCENT.violet} />
          <Pill label="🎓 HRW Moodle" href="https://elearning.hs-ruhrwest.de/" color={ACCENT.violet} />
        </div>
        <p className={styles.bannerText} style={{ marginTop: "var(--s-2)", fontSize: "0.6rem" }}>
          Flashcard-Code: <span style={{ fontFamily: "monospace" }}>{FLASHCARD_CODE}</span>
        </p>
      </GlassCard>

      {WOCHEN.map((week) => {
        const color = WEEK_COLORS[week.nr];
        const days = PLAN.filter((d) => d.w === week.nr);
        const doneCount = days.filter((d) => doneDays[d.nr]).length;
        return (
          <section key={week.nr} style={{ marginBottom: "var(--s-5)" }} aria-label={`Woche ${week.nr} im Detail`}>
            <WeekBanner week={week} color={color} doneCount={doneCount} totalCount={days.length} />
            {days.map((day) => (
              <DetailDayCard
                key={day.nr}
                day={day}
                color={color}
                startDate={startDate}
                isDone={!!doneDays[day.nr]}
                onToggleDone={() => toggleDay(day.nr)}
              />
            ))}
          </section>
        );
      })}
    </PageTransition>
  );
}
