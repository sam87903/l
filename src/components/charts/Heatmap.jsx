import { memo, useMemo } from "react";
import { useProgress } from "../../context/ProgressContext.jsx";
import { heatmapWeeks } from "../../utils/xp.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./charts.module.css";

const LEVELS = [0, 5, 20, 45];

function cellColor(minutes) {
  if (minutes <= 0) return undefined;
  const idx = LEVELS.findLastIndex((l) => minutes > l);
  const alpha = [30, 55, 80, 100][Math.max(0, idx)];
  return `color-mix(in srgb, ${ACCENT.teal} ${alpha}%, transparent)`;
}

/** GitHub-artige Aktivitäts-Heatmap der letzten Wochen. */
const Heatmap = memo(function Heatmap({ weeks = 16 }) {
  const { activity } = useProgress();
  const grid = useMemo(() => heatmapWeeks(activity, weeks), [activity, weeks]);

  return (
    <div>
      <div className={styles.heatmapScroll}>
        <div className={styles.heatmapGrid} role="img" aria-label={`Lernaktivität der letzten ${weeks} Wochen`}>
          {grid.map((col, ci) => (
            <div key={ci} className={styles.heatmapCol}>
              {col.map((cell) => (
                <div
                  key={cell.iso}
                  className={styles.heatmapCell}
                  style={{
                    background: cellColor(cell.minutes),
                    opacity: cell.future ? 0.25 : 1,
                  }}
                  title={`${cell.iso}: ${cell.minutes} Min`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heatmapLegend}>
        wenig
        {[15, 40, 70, 100].map((a) => (
          <span key={a} className={styles.heatmapCell}
            style={{ background: `color-mix(in srgb, ${ACCENT.teal} ${a}%, transparent)` }} />
        ))}
        viel
      </div>
    </div>
  );
});

export default Heatmap;
