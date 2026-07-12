import { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import ModuleCard from "./ModuleCard.jsx";
import { ACCENT, WEEK_COLORS } from "../../constants/theme.js";
import { kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/** Ein Semester als kontrolliertes Akkordeon mit allen Modulen. */
const SemesterAccordion = memo(function SemesterAccordion({ semester, open, onToggle, autoOpenModuleId = null }) {
  const toggle = () => onToggle(semester.nr);
  const isNext = semester.nr === 1;
  const color = isNext ? ACCENT.red : ACCENT.blue;

  return (
    <GlassCard
      tint={color}
      id={`semester-${semester.nr}`}
      className={styles.ringCard}
      style={{ "--c": color, marginBottom: "var(--s-2)", overflow: "hidden", scrollMarginTop: "150px" }}
    >
      <div className={`${styles.semHead} hover-pop`} onClick={toggle} {...kb(toggle)} aria-expanded={open}>
        <div className={styles.semNum}>{semester.nr}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.semKicker}>
            Semester {semester.nr}{isNext ? " · als Nächstes" : ""}
          </div>
          <div className={styles.semTitle}>{semester.title}</div>
        </div>
        <div className={styles.semMeta}>
          <div style={{ fontWeight: 600 }}>{semester.ects} ECTS</div>
          <div>{semester.modules.length} Module</div>
        </div>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div className={styles.modWrap}>
          {semester.modules.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              color={WEEK_COLORS[(i % 3) + 1]}
              autoOpen={autoOpenModuleId === mod.id}
            />
          ))}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default SemesterAccordion;
