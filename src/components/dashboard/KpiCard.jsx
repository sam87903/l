import { memo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import styles from "./dashboard.module.css";

/** Sekundäre Kennzahl mit Pflicht-Kontext ("78% · +6% vs. Vorwoche"). */
const KpiCard = memo(function KpiCard({ icon, label, value, context, tint }) {
  return (
    <GlassCard tint={tint} className={styles.kpi}>
      <div className={styles.kpiTop}>
        <span aria-hidden="true">{icon}</span>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {context && <div className={styles.kpiContext}>{context}</div>}
    </GlassCard>
  );
});

export default KpiCard;
