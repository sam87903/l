import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import Pill from "../ui/Pill.jsx";
import TermPill from "./TermPill.jsx";
import { DET } from "../../data/detail.js";
import { MODS } from "../../data/resources.js";
import { iconColor } from "../../constants/theme.js";
import { dayNum, fmtDate } from "../../utils/dates.js";
import { cx, kb } from "../../utils/misc.js";
import cardStyles from "../cards/cards.module.css";
import styles from "./detail.module.css";

const EMPTY_DETAIL = { lernziel: "", prüfung: "", begriffe: [], subs: [] };

/** Modul-Zuordnung eines Plan-Tags (Woche 1=BWL, 2=HBL/ECM, 3=GIP). */
function moduleForDay(day) {
  const id = day.w === 1 ? "BWL" : day.w === 2 && day.nr <= 9 ? "HBL" : day.w === 2 ? "ECM" : "GIP";
  return MODS.find((m) => m.id === id);
}

/** Tages-Kompendium: Lernziel, Prüfungsrelevanz, Kernbegriffe, Unterthemen. */
const DetailDayCard = memo(function DetailDayCard({ day, color, startDate, isDone, onToggleDone }) {
  const [open, setOpen] = useState(false);
  const [openSubs, setOpenSubs] = useState(() => new Set());
  const [openTerm, setOpenTerm] = useState(null);
  const detail = DET[day.nr] ?? EMPTY_DETAIL;
  const module = moduleForDay(day);
  const toggle = () => setOpen((v) => !v);

  const toggleSub = (index) =>
    setOpenSubs((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  return (
    <GlassCard tint={open || isDone ? color : undefined} className={cardStyles.day} style={{ "--c": color }}>
      <div className={`${cardStyles.head} hover-pop`} onClick={toggle} {...kb(toggle)} aria-expanded={open}>
        <div className={cx(cardStyles.dayNum, isDone && cardStyles.dayNumFilled)}>
          <div className={cardStyles.dayNumBig}>{dayNum(day.nr)}</div>
          <div className={cardStyles.dayDate}>{fmtDate(startDate, day.nr - 1) || "Tag"}</div>
        </div>
        <div className={cardStyles.dayBody}>
          <div className={cx(cardStyles.dayTitle, isDone && cardStyles.dayTitleDone)}>
            {day.e} {day.t}
          </div>
          <div className={cardStyles.daySub} style={{ color, fontWeight: 600 }}>
            Modul: {module?.label}
          </div>
        </div>
        <div
          className={cx(cardStyles.check, isDone && cardStyles.checkDone, "hover-pop")}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleDone(); }
          }}
          role="checkbox"
          aria-checked={isDone}
          aria-label={`Tag ${day.nr} als erledigt markieren`}
          tabIndex={0}
        >
          {isDone && "✓"}
        </div>
      </div>

      <Collapse open={open}>
        <div className={cardStyles.dayDetail}>
          <GlassCard className={cardStyles.taskBox} style={{ marginTop: "var(--s-3)" }}>
            <div className={cardStyles.boxKicker}>🎯 Lernziel</div>
            <div className={cardStyles.boxText}>{detail.lernziel}</div>
          </GlassCard>

          <GlassCard tint={color} className={cardStyles.taskBox}>
            <div className={cardStyles.boxKicker}>📋 Prüfungsrelevanz</div>
            <div className={cardStyles.boxText}>{detail.prüfung}</div>
          </GlassCard>

          {detail.begriffe?.length > 0 && (
            <div style={{ marginBottom: "var(--s-3)" }}>
              <div className={cardStyles.linkKicker}>🔑 Kernbegriffe · antippen für Definition</div>
              {detail.begriffe.map((term) => (
                <TermPill
                  key={term}
                  term={term}
                  color={color}
                  isOpen={openTerm === term}
                  onToggle={() => setOpenTerm((t) => (t === term ? null : term))}
                />
              ))}
            </div>
          )}

          <GlassCard className={cardStyles.taskBox}>
            <div className={cardStyles.boxKicker}>✏️ Aufgabe (20 Min)</div>
            <div className={cardStyles.boxText}>{day.a}</div>
          </GlassCard>

          {detail.subs?.map((sub, index) => {
            const subOpen = openSubs.has(index);
            return (
              <GlassCard key={index} tint={subOpen ? color : undefined}
                style={{ borderRadius: "var(--r-sm)", marginBottom: "var(--s-1)" }}>
                <div className={`${styles.subHead} hover-pop`} onClick={() => toggleSub(index)}
                  {...kb(() => toggleSub(index))} aria-expanded={subOpen}>
                  <span className={styles.subDot} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{sub.t}</span>
                  {subOpen ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                </div>
                <Collapse open={subOpen}>
                  <div className={styles.subDetail}>
                    <p className={styles.subDesc}>{sub.desc}</p>
                    <div className={cardStyles.linkKicker}>🔗 Ressourcen & Links</div>
                    <div className={cardStyles.pillRow} style={{ paddingBottom: "var(--s-1)" }}>
                      {sub.items.map((item, i) => (
                        <Pill key={i} label={`${item.c} ${item.l}`} href={item.u} color={iconColor(item.c)} />
                      ))}
                    </div>
                  </div>
                </Collapse>
              </GlassCard>
            );
          })}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default DetailDayCard;
