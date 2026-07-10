import { memo, useMemo } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import { analyzeExam } from "../../utils/examAnalysis.js";
import { ACCENT } from "../../constants/theme.js";
import styles from "./exams.module.css";

const MAX_MODULES = 8;
const MAX_EXAMS = 8;

/**
 * Exam Heatmap: wie stark jedes Modul in den gespeicherten Klausuren
 * vertreten ist (Zeilen = Module, Spalten = Klausuren, neueste zuerst).
 * Visuelle Priorisierung: dunklere Zellen = mehr Treffer.
 */
const ExamHeatmap = memo(function ExamHeatmap({ exams }) {
  const data = useMemo(() => {
    if (exams.length < 2) return null;
    const shown = exams.slice(0, MAX_EXAMS); // neueste zuerst gespeichert
    const perExam = shown.map((e) => {
      const scores = new Map();
      for (const m of analyzeExam(e.text ?? "").modules) scores.set(m.module.id, { module: m.module, score: m.score });
      return scores;
    });
    // Zeilen: Module nach Gesamt-Score über alle Klausuren
    const totals = new Map();
    for (const scores of perExam) {
      for (const { module, score } of scores.values()) {
        const cur = totals.get(module.id) ?? { module, total: 0 };
        cur.total += score;
        totals.set(module.id, cur);
      }
    }
    const rows = [...totals.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, MAX_MODULES)
      .map(({ module }) => {
        const cells = perExam.map((scores) => scores.get(module.id)?.score ?? 0);
        const rowMax = Math.max(...cells, 1);
        return { module, cells: cells.map((s) => ({ score: s, intensity: s / rowMax })) };
      });
    return { rows, exams: shown };
  }, [exams]);

  if (!data) return null;

  return (
    <GlassCard tint={ACCENT.teal} className={styles.radar} style={{ "--c": ACCENT.teal }}>
      <div className={styles.radarHead}>
        <span className={styles.radarTitle} style={{ color: ACCENT.teal }}>
          <span aria-hidden="true">🗺️</span> Modul-Heatmap
        </span>
        <span className={styles.radarSub}>{data.exams.length} Klausuren</span>
      </div>
      <p className={styles.radarLead}>
        Welche Module deine Klausuren dominieren – je kräftiger die Zelle, desto präsenter das Modul.
      </p>
      <div className={styles.heatScroll}>
        <div
          className={styles.heatGrid}
          style={{ gridTemplateColumns: `minmax(72px, auto) repeat(${data.exams.length}, minmax(34px, 1fr))` }}
          role="table"
          aria-label="Modul-Häufigkeit je Klausur"
        >
          <span className={styles.heatCorner} aria-hidden="true" />
          {data.exams.map((e, i) => (
            <span key={e.id} className={styles.heatColLabel} title={e.name}>K{i + 1}</span>
          ))}
          {data.rows.map(({ module, cells }) => (
            <div key={module.id} style={{ display: "contents" }} role="row">
              <span className={styles.heatRowLabel} title={module.name}>{module.code}</span>
              {cells.map((cell, i) => (
                <span
                  key={i}
                  className={styles.heatCell}
                  style={{
                    background: cell.score > 0
                      ? `color-mix(in srgb, var(--teal) ${Math.round(12 + cell.intensity * 68)}%, transparent)`
                      : "color-mix(in srgb, var(--text) 4%, transparent)",
                  }}
                  title={`${module.code} in „${data.exams[i].name}": ${cell.score > 0 ? `Score ${cell.score}` : "nicht erkannt"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className={styles.heatLegend}>
        {data.exams.map((e, i) => `K${i + 1} = ${e.name}`).join(" · ")}
      </p>
    </GlassCard>
  );
});

export default ExamHeatmap;
