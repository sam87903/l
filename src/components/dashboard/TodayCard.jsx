import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import { PLAN } from "../../data/plan.js";
import { WEEK_COLORS } from "../../constants/theme.js";
import { todayPlanDay } from "../../utils/dates.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import styles from "./dashboard.module.css";

/** Zeigt den heutigen Plan-Tag mit Direktsprung in den Plan. */
const TodayCard = memo(function TodayCard() {
  const { startDate } = useProgress();
  const navigate = useNavigate();
  const todayNr = todayPlanDay(startDate, PLAN.length);
  if (!todayNr) return null;

  const day = PLAN[todayNr - 1];
  const color = WEEK_COLORS[day.w];

  return (
    <GlassCard tint={color} className={styles.today} style={{ "--c": color }}>
      <MapPin size={22} color={color} aria-hidden="true" style={{ flexShrink: 0 }} />
      <div className={styles.todayBody}>
        <div className={styles.todayKicker}>Heute dran · Tag {todayNr}</div>
        <div className={styles.todayTitle}>{day.e} {day.t}</div>
      </div>
      <Button tint={color} onClick={() => navigate("/plan", { state: { scrollDay: todayNr } })}>
        Öffnen →
      </Button>
    </GlassCard>
  );
});

export default TodayCard;
