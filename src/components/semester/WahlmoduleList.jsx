import { memo, useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import Button from "../ui/Button.jsx";
import { WAHLMODULE } from "../../data/wahlmodule.js";
import { ACCENT } from "../../constants/theme.js";
import { kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/** Kompletter Wahlmodul-Katalog, aufklappbar mit Themenlisten. */
const WahlmoduleList = memo(function WahlmoduleList() {
  const [openSet, setOpenSet] = useState(() => new Set());

  const toggle = (index) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  return (
    <GlassCard tint={ACCENT.violet} style={{ "--c": ACCENT.violet, padding: "var(--s-4)", marginTop: "var(--s-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-2)" }}>
        <span aria-hidden="true">🗂️</span>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT.violet }}>
          Wahlmodul-Verzeichnis
        </span>
        <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>({WAHLMODULE.length} zur Auswahl)</span>
      </div>
      <p style={{ margin: "0 0 var(--s-3)", fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
        In Semester 5 &amp; 6 wählst du insgesamt 5 Wahlmodule frei aus diesem Katalog.
        Tippe auf ein Modul, um die Inhalte zu sehen.
      </p>
      <Button
        disabled={openSet.size === 0}
        onClick={() => setOpenSet(new Set())}
        style={{ marginBottom: "var(--s-3)", minHeight: 36 }}
      >
        <RotateCcw size={13} aria-hidden="true" />
        Auswahl zurücksetzen{openSet.size ? ` (${openSet.size})` : ""}
      </Button>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        {WAHLMODULE.map((wahl, index) => {
          const open = openSet.has(index);
          return (
            <GlassCard key={wahl.n} tint={open ? ACCENT.violet : undefined} style={{ borderRadius: "var(--r-sm)" }}>
              <div className={`${styles.wahlRow} hover-pop`} onClick={() => toggle(index)} {...kb(() => toggle(index))} aria-expanded={open}>
                <span style={{ flex: 1, fontWeight: open ? 700 : 500 }}>{wahl.n}</span>
                {open ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
              </div>
              <Collapse open={open}>
                <div className={styles.wahlDetail}>
                  <p style={{ margin: "var(--s-2) 0", fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.6 }}>
                    {wahl.d}
                  </p>
                  <div className={styles.sectionKicker} style={{ color: ACCENT.violet }}>📚 Themen</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)", paddingBottom: "var(--s-1)" }}>
                    {wahl.th.map((theme) => (
                      <div key={theme} className={styles.wahlTheme}>
                        <span style={{ color: ACCENT.violet }} aria-hidden="true">▸</span>
                        {theme}
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse>
            </GlassCard>
          );
        })}
      </div>
    </GlassCard>
  );
});

export default WahlmoduleList;
