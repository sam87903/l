import { memo, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { toLocalISO } from "../../utils/dates.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./history.module.css";

const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const LEVELS = [0, 5, 20, 45];
const cellBg = (min) => {
  if (min <= 0) return "transparent";
  const idx = Math.max(0, LEVELS.findLastIndex((l) => min > l));
  return `color-mix(in srgb, ${ACCENT.teal} ${[30, 55, 80, 100][idx]}%, transparent)`;
};

/** Minuten menschlich: „1 Std 20 Min" bzw. „45 Min". */
const fmtMin = (m) => {
  m = Math.round(m);
  if (m <= 0) return "0 Min";
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h} Std${r ? ` ${r} Min` : ""}` : `${r} Min`;
};

const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Montag
  return x;
};

/**
 * Lern-Rückblick: zeigt die gelernten Minuten pro Tag – umschaltbar zwischen
 * Wochen- und Monatsansicht und mit Vor/Zurück durch beliebige Wochen und
 * Monate der Vergangenheit.
 */
const LearningHistory = memo(function LearningHistory() {
  const { activity } = useProgress();
  const [mode, setMode] = useState("woche");
  const [offset, setOffset] = useState(0); // 0 = aktuell, negativ = zurück

  const view = useMemo(() => {
    const min = (d) => activity[toLocalISO(d)] || 0;
    const today = toLocalISO(new Date());

    if (mode === "woche") {
      const base = startOfWeek(new Date());
      base.setDate(base.getDate() + offset * 7);
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return { iso: toLocalISO(d), date: d, min: min(d), today: toLocalISO(d) === today };
      });
      const last = days[6].date;
      const title = `${days[0].date.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} – ${last.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}`;
      return { kind: "woche", title, days };
    }

    const first = new Date();
    first.setHours(0, 0, 0, 0);
    first.setDate(1);
    first.setMonth(first.getMonth() + offset);
    const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= dim; day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      cells.push({ iso: toLocalISO(d), n: day, min: min(d), today: toLocalISO(d) === today });
    }
    const days = cells.filter(Boolean);
    return {
      kind: "monat",
      title: first.toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
      cells,
      days,
    };
  }, [activity, mode, offset]);

  const sum = useMemo(() => {
    const days = view.days;
    const total = days.reduce((s, d) => s + d.min, 0);
    const active = days.filter((d) => d.min > 0).length;
    const best = days.reduce((m, d) => Math.max(m, d.min), 0);
    return { total, active, best, avg: active ? total / active : 0 };
  }, [view]);

  const maxScale = Math.max(60, sum.best);

  return (
    <GlassCard tint={ACCENT.teal} style={{ "--c": ACCENT.teal, padding: "var(--s-4)", marginBottom: "var(--s-4)" }}>
      <div className={styles.head}>
        <span className={styles.kicker}>🗓️ Lern-Rückblick</span>
        <div className={styles.modeRow} role="group" aria-label="Ansicht">
          {[["woche", "Woche"], ["monat", "Monat"]].map(([id, label]) => (
            <button
              key={id}
              className={cx(styles.modeBtn, mode === id && styles.modeBtnOn)}
              onClick={() => { setMode(id); setOffset(0); }}
              aria-pressed={mode === id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.nav}>
        <button className={cx(styles.navBtn, "hover-pop")} onClick={() => setOffset((o) => o - 1)} aria-label="Zurück">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className={styles.navTitle}>{view.title}</span>
        <button
          className={cx(styles.navBtn, "hover-pop")}
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          aria-label="Vor"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {view.kind === "woche" ? (
        <div className={styles.week}>
          {view.days.map((d) => (
            <div key={d.iso} className={styles.wDay}>
              <span className={styles.wMin}>{d.min > 0 ? d.min : ""}</span>
              <div className={styles.wBarTrack} title={`${d.iso}: ${d.min} Min`}>
                <div
                  className={cx(styles.wBar, d.today && styles.wBarToday)}
                  style={{ height: `${Math.round((d.min / maxScale) * 100)}%` }}
                />
              </div>
              <span className={cx(styles.wLabel, d.today && styles.wToday)}>
                {WD[(d.date.getDay() + 6) % 7]}
              </span>
              <span className={styles.wDate}>{d.date.getDate()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.month}>
          <div className={styles.mHead}>
            {WD.map((w) => (
              <span key={w} className={styles.mHeadCell}>{w}</span>
            ))}
          </div>
          <div className={styles.mGrid}>
            {view.cells.map((c, i) =>
              c ? (
                <div
                  key={c.iso}
                  className={cx(styles.mCell, c.today && styles.mCellToday)}
                  style={{ background: cellBg(c.min) }}
                  title={`${c.iso}: ${c.min} Min`}
                >
                  <span className={styles.mNum}>{c.n}</span>
                  {c.min > 0 && <span className={styles.mDot} aria-hidden="true" />}
                </div>
              ) : (
                <div key={`b${i}`} className={styles.mBlank} />
              )
            )}
          </div>
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.sBox}>
          <span className={styles.sValue}>{fmtMin(sum.total)}</span>
          <span className={styles.sLabel}>gelernt</span>
        </div>
        <div className={styles.sBox}>
          <span className={styles.sValue}>{sum.active}</span>
          <span className={styles.sLabel}>{sum.active === 1 ? "aktiver Tag" : "aktive Tage"}</span>
        </div>
        <div className={styles.sBox}>
          <span className={styles.sValue}>{fmtMin(sum.avg)}</span>
          <span className={styles.sLabel}>Ø je Lerntag</span>
        </div>
        <div className={styles.sBox}>
          <span className={styles.sValue}>{fmtMin(sum.best)}</span>
          <span className={styles.sLabel}>bester Tag</span>
        </div>
      </div>
    </GlassCard>
  );
});

export default LearningHistory;
