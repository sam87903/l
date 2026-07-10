import { useMemo } from "react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import Disclosure from "../components/ui/Disclosure.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import AchievementsRow from "../components/dashboard/AchievementsRow.jsx";
import WeakSpotRadar from "../components/stats/WeakSpotRadar.jsx";
import Heatmap from "../components/charts/Heatmap.jsx";
import BarChart from "../components/charts/BarChart.jsx";
import { SEMESTERS } from "../data/semesters/index.js";
import { GLOSSARY } from "../data/glossary.js";
import { baseModId, deckLabel } from "../utils/insights.js";
import { ACCENT, WEEK_COLORS } from "../constants/theme.js";
import { ACHIEVEMENTS } from "../constants/achievements.js";
import { useProgress } from "../context/ProgressContext.jsx";
import dashStyles from "../components/dashboard/dashboard.module.css";
import styles from "./pages.module.css";

const STREAK_GOAL_DAYS = 7;
const TOTAL_FLASHCARDS =
  SEMESTERS.flatMap((s) => s.modules).reduce((n, m) => n + (m.cards?.length || 0), 0) +
  Object.keys(GLOSSARY).length;

/**
 * Statistik nach Dashboard-Best-Practice: eine Hero-Kennzahl (Ring),
 * drei Kontext-KPIs, Streak-Kalender – Details per Progressive Disclosure.
 */
export default function StatsPage() {
  const { stats, fcKnown, quizBest, activity } = useProgress();
  const pct = Math.round((stats.doneCount / stats.total) * 100);
  const activeDays = useMemo(
    () => Object.values(activity).filter((m) => m > 0).length,
    [activity]
  );

  const quizAverage = useMemo(() => {
    const results = Object.values(quizBest);
    if (results.length === 0) return null;
    const correct = results.reduce((n, b) => n + b.c, 0);
    const total = results.reduce((n, b) => n + b.t, 0);
    return total ? Math.round((correct / total) * 100) : null;
  }, [quizBest]);

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

  const quizResults = useMemo(
    () =>
      Object.entries(quizBest)
        .map(([id, best]) => ({ id, name: deckLabel(id), ...best }))
        .sort((a, b) => b.c / b.t - a.c / a.t),
    [quizBest]
  );

  // Erfolgsquote je Thema: Basis- und Erweitert-Quiz aufs Modul gebündelt,
  // schwächste zuerst – macht Schwachstellen auf einen Blick sichtbar.
  const successByTopic = useMemo(() => {
    const byMod = new Map();
    for (const [id, best] of Object.entries(quizBest)) {
      if (!best?.t) continue;
      const base = baseModId(id);
      const cur = byMod.get(base) ?? { id: base, c: 0, t: 0 };
      cur.c += best.c;
      cur.t += best.t;
      byMod.set(base, cur);
    }
    return [...byMod.values()]
      .map((m) => ({ ...m, name: deckLabel(m.id), pct: Math.round((m.c / m.t) * 100) }))
      .sort((a, b) => a.pct - b.pct);
  }, [quizBest]);

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.test(stats)).length;

  return (
    <PageTransition>
      {/* Hero-KPI: die eine Zahl, die zählt */}
      <GlassCard tint={ACCENT.teal} className={dashStyles.statsHero}>
        <ProgressRing
          value={stats.doneCount}
          max={stats.total}
          size={140}
          stroke={11}
          color="var(--teal)"
          valueText={`${stats.doneCount} von ${stats.total} Tagen abgeschlossen`}
        >
          <span style={{ fontSize: "1.7rem", fontWeight: 800 }}>Tag {stats.doneCount}</span>
          <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700 }}>von {stats.total}</span>
        </ProgressRing>
        <div className={dashStyles.statsHeroBody}>
          <p className={styles.bannerKicker} style={{ "--c": ACCENT.teal }}>📊 Dein Lernfortschritt im Überblick</p>
          <div className={dashStyles.statsHeroLine}>
            <span className={dashStyles.statsHeroValue}>{pct}%</span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--muted)", fontWeight: 600 }}>des 21-Tage-Plans</span>
          </div>
          <p className={dashStyles.statsHeroContext}>
            {stats.doneCount >= stats.total
              ? "Plan komplett – bereit für Semester 1! 🎉"
              : `Noch ${stats.total - stats.doneCount} Tage bis zum Ziel · Level ${stats.level} · ${stats.xp} XP`}
          </p>
        </div>
      </GlassCard>

      {/* Sekundäre KPIs – jede Zahl mit Kontext */}
      <div className={dashStyles.kpiGrid}>
        <KpiCard
          icon="🔥"
          label="Streak"
          value={`${stats.streak} Tg.`}
          context={stats.streak >= STREAK_GOAL_DAYS
            ? `Ziel ${STREAK_GOAL_DAYS}+ erreicht!`
            : `Ziel: ${STREAK_GOAL_DAYS} · noch ${STREAK_GOAL_DAYS - stats.streak}`}
          tint={ACCENT.red}
        />
        <KpiCard
          icon="🧩"
          label="Ø Quiz"
          value={quizAverage != null ? `${quizAverage}%` : "–"}
          context={quizAverage != null
            ? `${stats.quizzesPerfect} von ${stats.quizCount} perfekt`
            : "Noch kein Quiz gespielt"}
          tint={ACCENT.blue}
        />
        <KpiCard
          icon="🃏"
          label="Karten"
          value={stats.knownTotal}
          context={`${Math.round((stats.knownTotal / TOTAL_FLASHCARDS) * 100)}% von ${TOTAL_FLASHCARDS} gewusst`}
          tint={ACCENT.violet}
        />
      </div>

      {/* Streak-Kalender */}
      <div className={styles.sectionTitle}>🗓️ Streak-Kalender · letzte 16 Wochen</div>
      <GlassCard style={{ padding: "var(--s-4)", marginBottom: "var(--s-4)" }}>
        <Heatmap weeks={16} />
        <p style={{ margin: "var(--s-2) 0 0", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
          {activeDays} aktive Lerntage insgesamt · {stats.focusTotal} Fokus-Minuten
        </p>
      </GlassCard>

      {/* Details per Progressive Disclosure */}
      <WeakSpotRadar />

      {successByTopic.length > 0 && (
        <Disclosure icon="📈" title="Erfolgsquote je Thema" meta={`${successByTopic.length} Themen`}>
          {successByTopic.map((m) => (
            <div key={m.id} className={styles.moduleProgress}>
              <span className={styles.moduleProgressName}>{m.name}</span>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  value={m.pct} max={100}
                  from={m.pct < 50 ? ACCENT.red : ACCENT.blue} to={m.pct < 50 ? ACCENT.orange : ACCENT.teal}
                  height={5}
                  label={`${m.name}: Erfolgsquote`}
                  valueText={`${m.pct} % richtig (${m.c} von ${m.t} Fragen)`}
                />
              </div>
              <span style={{ color: m.pct < 50 ? ACCENT.red : "var(--muted)", fontWeight: 800, width: 44, textAlign: "right" }}>
                {m.pct} %
              </span>
            </div>
          ))}
        </Disclosure>
      )}

      <Disclosure icon="⏱️" title="Lernminuten · letzte 7 Tage" meta={`${stats.focusTotal}′ gesamt`} defaultOpen>
        <BarChart days={7} />
      </Disclosure>

      {moduleProgress.length > 0 && (
        <Disclosure icon="🃏" title="Lernkarten pro Modul" meta={`${moduleProgress.length} Module`}>
          {moduleProgress.map((m) => (
            <div key={m.id} className={styles.moduleProgress}>
              <span className={styles.moduleProgressName}>{m.name}</span>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  value={m.known} max={m.total} from={ACCENT.teal} to={m.color} height={5}
                  label={`${m.name}: Lernkarten-Fortschritt`}
                  valueText={`${m.known} von ${m.total} Karten gewusst`}
                />
              </div>
              <span style={{ color: "var(--muted)", fontWeight: 700, width: 44, textAlign: "right" }}>
                {m.known}/{m.total}
              </span>
            </div>
          ))}
        </Disclosure>
      )}

      {quizResults.length > 0 && (
        <Disclosure icon="🏆" title="Quiz-Bestenliste" meta={`${quizResults.length} Module`}>
          {quizResults.map((q, i) => (
            <div key={q.id} className={styles.moduleProgress}>
              <span style={{ width: 20, fontWeight: 800, color: "var(--muted)" }}>{i + 1}.</span>
              <span className={styles.moduleProgressName} style={{ flex: 1, width: "auto" }}>{q.name}</span>
              <span style={{ fontWeight: 800, color: q.c === q.t ? ACCENT.teal : "var(--text)" }}>
                {q.c}/{q.t} {q.c === q.t && "🏆"}
              </span>
            </div>
          ))}
        </Disclosure>
      )}

      <Disclosure icon="🏅" title="Alle Erfolge" meta={`${unlockedCount}/${ACHIEVEMENTS.length}`}>
        <AchievementsRow grid />
      </Disclosure>
    </PageTransition>
  );
}
