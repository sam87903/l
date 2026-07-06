import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import { useNavigate } from "react-router-dom";
import { Repeat2 } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import TodayCard from "../components/dashboard/TodayCard.jsx";
import CountdownChips from "../components/dashboard/CountdownChips.jsx";
import QuickActions from "../components/dashboard/QuickActions.jsx";
import StatGrid from "../components/dashboard/StatGrid.jsx";
import AchievementsRow from "../components/dashboard/AchievementsRow.jsx";
import FocusTimer from "../components/timer/FocusTimer.jsx";
import Heatmap from "../components/charts/Heatmap.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { ACCENT } from "../constants/theme.js";
import dashStyles from "../components/dashboard/dashboard.module.css";

/** Startseite: Hero mit Fortschritt, Level, Countdown, Timer, Statistik. */
export default function DashboardPage() {
  const { stats } = useProgress();
  const navigate = useNavigate();
  const pct = Math.round((stats.doneCount / stats.total) * 100);

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={dashStyles.hero}>
        <ProgressRing
          value={stats.doneCount}
          max={stats.total}
          size={104}
          color="var(--blue)"
          valueText={`${stats.doneCount} von ${stats.total} Tagen abgeschlossen`}
        >
          <span style={{ fontSize: "1.35rem", fontWeight: 800 }}>{pct}%</span>
          <span style={{ fontSize: "0.55rem", color: "var(--muted)" }}>{stats.doneCount}/{stats.total} Tage</span>
        </ProgressRing>
        <div className={dashStyles.heroBody}>
          <p className={dashStyles.heroKicker}>HRW E-Commerce B.Sc. · BPO 2023</p>
          <h2 className={dashStyles.heroTitle}>Salam, bereit zu lernen?</h2>
          <CountdownChips />
          <div className={dashStyles.levelRow}>
            <span>⚡ Level {stats.level}</span>
            <span>{stats.xpInLevel}/{stats.xpForNext} XP</span>
          </div>
          <ProgressBar value={stats.xpInLevel} max={stats.xpForNext} from={ACCENT.violet} to={ACCENT.blue} height={5}
            label="Level-Fortschritt" />
        </div>
      </GlassCard>

      <TodayCard />

      {stats.mistakesDue > 0 && (
        <GlassCard tint={ACCENT.red} className={dashStyles.today} style={{ "--c": ACCENT.red }}>
          <Repeat2 size={22} color={ACCENT.red} aria-hidden="true" style={{ flexShrink: 0 }} />
          <div className={dashStyles.todayBody}>
            <div className={dashStyles.todayKicker}>Fehler-Training</div>
            <div className={dashStyles.todayTitle}>
              {stats.mistakesDue} {stats.mistakesDue === 1 ? "Frage ist" : "Fragen sind"} fällig zur Wiederholung
            </div>
          </div>
          <Button tint={ACCENT.red} onClick={() => navigate("/plan", { state: { openTrainer: Date.now() } })}>
            Üben →
          </Button>
        </GlassCard>
      )}

      <QuickActions />
      <FocusTimer />
      <StatGrid />

      <div className={dashStyles.sectionTitle}>🗓️ Aktivität der letzten Wochen</div>
      <GlassCard style={{ padding: "var(--s-4)" }}>
        <Heatmap weeks={16} />
      </GlassCard>

      <div className={dashStyles.sectionTitle}>🏅 Erfolge</div>
      <AchievementsRow />
    </PageTransition>
  );
}
