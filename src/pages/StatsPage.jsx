import { useMemo } from "react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import StatGrid from "../components/dashboard/StatGrid.jsx";
import AchievementsRow from "../components/dashboard/AchievementsRow.jsx";
import Heatmap from "../components/charts/Heatmap.jsx";
import BarChart from "../components/charts/BarChart.jsx";
import { SEMESTERS } from "../data/semesters/index.js";
import { ACCENT, WEEK_COLORS } from "../constants/theme.js";
import { useProgress } from "../context/ProgressContext.jsx";
import styles from "./pages.module.css";

/** Statistik: Lernzeit, Heatmap, Modul-Fortschritt, Quiz-Bestscores, Erfolge. */
export default function StatsPage() {
  const { stats, fcKnown, quizBest } = useProgress();

  const moduleProgress = useMemo(
    () =>
      SEMESTERS.flatMap((sem) =>
        sem.modules
          .filter((m) => m.cards?.length > 0)
          .map((m, i) => ({
            id: m.id,
            name: m.name,
            known: (fcKnown[m.id] || []).length,
            total: m.cards.length,
            color: WEEK_COLORS[(i % 3) + 1],
          }))
      ).filter((m) => m.known > 0),
    [fcKnown]
  );

  const quizResults = useMemo(() => {
    const byId = new Map(
      SEMESTERS.flatMap((s) => s.modules).map((m) => [m.id, m.name])
    );
    return Object.entries(quizBest)
      .map(([id, best]) => ({ id, name: byId.get(id) ?? id, ...best }))
      .sort((a, b) => b.c / b.t - a.c / a.t);
  }, [quizBest]);

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.teal} className={styles.banner} style={{ "--c": ACCENT.teal }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>📊 Statistik</p>
        <h2 className={styles.bannerTitle}>Dein Lernfortschritt im Überblick</h2>
        <p className={styles.bannerText}>
          Level {stats.level} · {stats.xp} XP gesamt · {stats.streak} Tage Streak 🔥
        </p>
      </GlassCard>

      <StatGrid />

      <div className={styles.sectionTitle}>⏱️ Lernminuten · letzte 7 Tage</div>
      <GlassCard style={{ padding: "var(--s-4)" }}>
        <BarChart days={7} />
      </GlassCard>

      <div className={styles.sectionTitle}>🗓️ Aktivitäts-Heatmap</div>
      <GlassCard style={{ padding: "var(--s-4)" }}>
        <Heatmap weeks={16} />
      </GlassCard>

      {moduleProgress.length > 0 && (
        <>
          <div className={styles.sectionTitle}>🃏 Lernkarten pro Modul</div>
          <GlassCard style={{ padding: "var(--s-4)" }}>
            {moduleProgress.map((m) => (
              <div key={m.id} className={styles.moduleProgress}>
                <span className={styles.moduleProgressName}>{m.name}</span>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={m.known} max={m.total} from={ACCENT.teal} to={m.color} height={5}
                    label={`${m.name}: ${m.known} von ${m.total} Karten`} />
                </div>
                <span style={{ color: "var(--muted)", fontWeight: 700, width: 44, textAlign: "right" }}>
                  {m.known}/{m.total}
                </span>
              </div>
            ))}
          </GlassCard>
        </>
      )}

      {quizResults.length > 0 && (
        <>
          <div className={styles.sectionTitle}>🏆 Quiz-Bestenliste</div>
          <GlassCard style={{ padding: "var(--s-4)" }}>
            {quizResults.map((q, i) => (
              <div key={q.id} className={styles.moduleProgress}>
                <span style={{ width: 20, fontWeight: 800, color: "var(--muted)" }}>{i + 1}.</span>
                <span className={styles.moduleProgressName} style={{ flex: 1, width: "auto" }}>{q.name}</span>
                <span style={{ fontWeight: 800, color: q.c === q.t ? ACCENT.teal : "var(--text)" }}>
                  {q.c}/{q.t} {q.c === q.t && "🏆"}
                </span>
              </div>
            ))}
          </GlassCard>
        </>
      )}

      <div className={styles.sectionTitle}>🏅 Alle Erfolge</div>
      <AchievementsRow grid />
    </PageTransition>
  );
}
