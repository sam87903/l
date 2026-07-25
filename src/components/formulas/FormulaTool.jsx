import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import FormulaTrainer from "./FormulaTrainer.jsx";
import { FORMULAS, FORMULA_CATS } from "../../data/formulas.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, kb } from "../../utils/misc.js";
import cardStyles from "../cards/cards.module.css";
import styles from "./formulas.module.css";

const fmt = (n, dec = 2) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

/** Eine Formel: Anzeige, Erklärung und – falls vorhanden – interaktiver Rechner. */
function FormulaCard({ f }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries((f.inputs || []).map((i) => [i.k, i.def ?? ""]))
  );
  const result = useMemo(() => {
    if (!f.calc) return null;
    try {
      return f.calc(vals);
    } catch {
      return null;
    }
  }, [f, vals]);

  const rows = Array.isArray(result) ? result : result != null ? [{ label: f.out.label, value: result, unit: f.out.unit, dec: f.out.dec }] : [];

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardName}>{f.name}</span>
        <span className={styles.semChip}>Sem. {f.sem}</span>
      </div>
      <code className={styles.formula}>{f.formula}</code>
      <p className={styles.desc}>{f.desc}</p>

      {f.inputs && (
        <div className={styles.inputs}>
          {f.inputs.map((i) => (
            <label key={i.k} className={styles.field}>
              <span className={styles.fieldLabel}>
                {i.label}{i.unit ? ` (${i.unit})` : ""}
              </span>
              <input
                className={styles.input}
                type={i.free ? "text" : "text"}
                inputMode={i.free ? "text" : "decimal"}
                value={vals[i.k]}
                onChange={(e) => setVals((s) => ({ ...s, [i.k]: e.target.value }))}
                placeholder={i.free ? "12; 15; 9" : "0"}
                aria-label={i.label}
              />
            </label>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className={styles.results}>
          {rows.map((r, i) => (
            <div key={i} className={cx(styles.resultRow, r.strong && styles.resultStrong)}>
              <span className={styles.resultLabel}>{r.label}</span>
              <span className={styles.resultValue}>
                {fmt(r.value, r.dec ?? 2)}{r.unit ? ` ${r.unit}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Eine Kategorie mit aufklappbarer Formelliste. */
function Category({ cat, formulas, open, onToggle }) {
  return (
    <GlassCard style={{ borderRadius: "var(--r-sm)", marginBottom: "var(--s-2)", overflow: "hidden" }}>
      <div className={cx(styles.catHead, "hover-pop")} onClick={onToggle} {...kb(onToggle)} aria-expanded={open}>
        <span aria-hidden="true">{cat.icon}</span>
        <span className={styles.catName}>{cat.label}</span>
        <span className={styles.catCount}>{formulas.length}</span>
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div className={styles.catBody}>
          {formulas.map((f) => (
            <FormulaCard key={f.id} f={f} />
          ))}
        </div>
      </Collapse>
    </GlassCard>
  );
}

/**
 * Formelsammlung & Rechner: alle prüfungsrelevanten Formeln des Studiengangs,
 * nach Themen sortiert und mit interaktiven Rechnern. Auf der Plan-Seite als
 * aufklappbare Sektion (standardmäßig zu).
 */
const FormulaTool = memo(function FormulaTool() {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState(null);

  const byCat = useMemo(
    () => FORMULA_CATS.map((c) => ({ cat: c, list: FORMULAS.filter((f) => f.cat === c.id) })).filter((g) => g.list.length),
    []
  );

  return (
    <GlassCard tint={ACCENT.blue} id="formeln" style={{ marginBottom: "var(--s-4)", overflow: "hidden" }}>
      <div className={cx(cardStyles.head, "hover-pop")} onClick={() => setOpen((v) => !v)} {...kb(() => setOpen((v) => !v))} aria-expanded={open}>
        <Calculator size={16} color={ACCENT.blue} aria-hidden="true" />
        <span style={{ flex: 1, fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT.blue }}>
          Formeln &amp; Rechner
        </span>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{FORMULAS.length} Formeln</span>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
          <p className={styles.intro}>
            Alle prüfungsrelevanten Formeln des Studiengangs – von BWL-Kennzahlen über Handelskalkulation
            und Investitionsrechnung bis zu E-Commerce-KPIs. Tippe eine Kategorie an, gib deine Werte ein,
            das Ergebnis rechnet sich sofort.
          </p>

          {/* Abfrage vor der Liste: Wer nur blättert, merkt sich wenig. */}
          <FormulaTrainer />

          {byCat.map(({ cat, list }) => (
            <Category
              key={cat.id}
              cat={cat}
              formulas={list}
              open={openCat === cat.id}
              onToggle={() => setOpenCat((p) => (p === cat.id ? null : cat.id))}
            />
          ))}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default FormulaTool;
