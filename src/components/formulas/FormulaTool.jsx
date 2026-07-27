import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import SearchInput from "../ui/SearchInput.jsx";
import FormulaTrainer from "./FormulaTrainer.jsx";
import { FORMULAS, FORMULA_CATS } from "../../data/formulas.js";
import { formulaLines } from "../../utils/formulaFormat.js";
import { matches } from "../../utils/text.js";
import { useFitText } from "../../hooks/useFitText.js";
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

  const lines = formulaLines(f.formula);
  // Längste Zeile bestimmt die Schriftgröße: So steht jede Formel in einer
  // Reihe, statt mitten im Ausdruck umzubrechen.
  const maxChars = Math.max(...lines.map((l) => l.length), 1);
  const [fitRef, fitSize, scrollt] = useFitText(maxChars);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardName}>{f.name}</span>
        <span className={styles.semChip}>Sem. {f.sem}</span>
      </div>

      {/* Jede Stufe einer mehrstufigen Formel auf eigener Zeile – sonst
          bricht der Text an beliebiger Stelle und die Struktur geht verloren. */}
      <code
        ref={fitRef}
        className={cx(styles.formula, lines.length > 1 && styles.formulaSteps, scrollt && styles.formulaScroll)}
        style={{ fontSize: `${fitSize.toFixed(2)}px` }}
      >
        {lines.map((line, i) => (
          <span key={i} className={styles.formulaLine}>{line}</span>
        ))}
      </code>

      <p className={styles.desc}>{f.desc}</p>

      {f.inputs && (
        <div className={styles.calc}>
          <div className={styles.calcKicker}>
            <Calculator size={11} aria-hidden="true" /> Rechner
          </div>
          <div className={styles.inputs}>
            {f.inputs.map((i) => (
              <label key={i.k} className={styles.field}>
                <span className={styles.fieldLabel} title={i.label}>
                  {i.label}{i.unit ? ` (${i.unit})` : ""}
                </span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode={i.free ? "text" : "decimal"}
                  value={vals[i.k]}
                  onChange={(e) => setVals((s) => ({ ...s, [i.k]: e.target.value }))}
                  placeholder={i.free ? "12; 15; 9" : "0"}
                  aria-label={i.label}
                />
              </label>
            ))}
          </div>

          {rows.length > 0 ? (
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
          ) : (
            // Ohne diesen Hinweis endet die Karte abrupt hinter den leeren Feldern.
            <p className={styles.resultsHint}>Werte eintragen – das Ergebnis erscheint sofort.</p>
          )}
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
  const [query, setQuery] = useState("");

  const byCat = useMemo(
    () => FORMULA_CATS.map((c) => ({ cat: c, list: FORMULAS.filter((f) => f.cat === c.id) })).filter((g) => g.list.length),
    []
  );

  // Suche über Name, Formel und Erklärung – umlaut-tolerant, damit
  // „liquiditat" auch „Liquidität" findet.
  const catLabel = useMemo(
    () => Object.fromEntries(FORMULA_CATS.map((c) => [c.id, `${c.icon} ${c.label}`])),
    []
  );
  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return FORMULAS.filter((f) => matches(f.name, q) || matches(f.formula, q) || matches(f.desc, q));
  }, [query]);

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

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Formel suchen, z. B. Deckungsbeitrag"
            label="Formeln durchsuchen"
          />

          {hits ? (
            <div className={styles.hitList}>
              <p className={styles.hitCount}>
                {hits.length === 0
                  ? "Kein Treffer – versuch es mit einem anderen Begriff."
                  : `${hits.length} ${hits.length === 1 ? "Formel" : "Formeln"} gefunden`}
              </p>
              {/* Trefferliste quer über alle Kategorien, jede Karte mit
                  Herkunftsangabe – sonst weiß man nicht, wo sie herkommt. */}
              {hits.map((f) => (
                <div key={f.id}>
                  <div className={styles.hitCat}>{catLabel[f.cat]}</div>
                  <FormulaCard f={f} />
                </div>
              ))}
            </div>
          ) : (
            byCat.map(({ cat, list }) => (
              <Category
                key={cat.id}
                cat={cat}
                formulas={list}
                open={openCat === cat.id}
                onToggle={() => setOpenCat((p) => (p === cat.id ? null : cat.id))}
              />
            ))
          )}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default FormulaTool;
