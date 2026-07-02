import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ListChecks, Puzzle, Settings2 } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { ACCENT } from "../../constants/theme.js";
import styles from "./dashboard.module.css";

/** Schnellzugriffe auf die wichtigsten Aktionen. */
const QuickActions = memo(function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: ListChecks, label: "Heute lernen", tint: ACCENT.teal,   go: () => navigate("/plan") },
    { icon: Puzzle,     label: "Quiz starten", tint: ACCENT.red,    go: () => navigate("/plan", { state: { openQuizSection: true } }) },
    { icon: BookOpen,   label: "Glossar üben", tint: ACCENT.violet, go: () => navigate("/glossar") },
    { icon: Settings2,  label: "Backup & Co.", tint: ACCENT.blue,   go: () => navigate("/einstellungen") },
  ];
  return (
    <div className={styles.quickGrid}>
      {actions.map(({ icon: Icon, label, tint, go }) => (
        <GlassCard key={label} as="button" tint={tint} className={`${styles.quick} hover-pop`} onClick={go}>
          <Icon size={18} color={tint} aria-hidden="true" />
          {label}
        </GlassCard>
      ))}
    </div>
  );
});

export default QuickActions;
