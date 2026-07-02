import { memo } from "react";
import Chip from "../ui/Chip.jsx";
import { SEMESTER_START } from "../../constants/config.js";
import { daysUntil } from "../../utils/dates.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import styles from "./dashboard.module.css";

function tripText(days) {
  if (days == null) return "Datum wählen";
  if (days > 0) return `Abreise in ${days} Tg.`;
  if (days === 0) return "Abreise heute!";
  return "In Marokko 🌴";
}

/** Countdown zu Abreise und Semesterstart. */
const CountdownChips = memo(function CountdownChips() {
  const { startDate } = useProgress();
  const trip = daysUntil(startDate);
  const semester = daysUntil(SEMESTER_START);
  return (
    <div className={styles.heroMeta}>
      <Chip icon="✈️">{tripText(trip)}</Chip>
      <Chip icon="🎓">{semester != null && semester > 0 ? `Semesterstart in ${semester} Tg.` : "Semester läuft"}</Chip>
    </div>
  );
});

export default CountdownChips;
