import { describe, expect, it } from "vitest";
import { FORMULAS, FORMULA_CATS } from "../formulas.js";

const byId = (id) => FORMULAS.find((f) => f.id === id);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

describe("Formeln – Datenintegrität", () => {
  it("jede Formel gehört zu einer bekannten Kategorie", () => {
    const cats = new Set(FORMULA_CATS.map((c) => c.id));
    for (const f of FORMULAS) expect(cats.has(f.cat), f.id).toBe(true);
  });

  it("IDs sind eindeutig", () => {
    const ids = FORMULAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Formeln – Rechner liefern korrekte Werte", () => {
  it("Conversion Rate: 5 von 200 = 2,5 %", () => {
    expect(round(byId("conversion").calc({ kaeufe: "5", besucher: "200" }))).toBe(2.5);
  });

  it("CLV: 75 · 3 · 2 = 450", () => {
    expect(byId("clv").calc({ aov: "75", freq: "3", jahre: "2" })).toBe(450);
  });

  it("ROAS: 4000 / 1000 = 4", () => {
    expect(byId("roas").calc({ umsatz: "4000", kosten: "1000" })).toBe(4);
  });

  it("lineare AfA: (10000 − 0) / 5 = 2000", () => {
    expect(byId("afa-linear").calc({ ak: "10000", rw: "0", nd: "5" })).toBe(2000);
  });

  it("Handelsspanne: EK 60, VK 100 = 40 %", () => {
    expect(round(byId("handelsspanne").calc({ ek: "60", vk: "100" }))).toBe(40);
  });

  it("Break-even-Menge: 10000 / (50 − 30) = 500", () => {
    expect(byId("breakeven-menge").calc({ fix: "10000", preis: "50", kv: "30" })).toBe(500);
  });

  it("Andler-Formel: Standardbeispiel", () => {
    // 200·12000·40 / (8·20) = 96.000.000/160 = 600.000 → √ = 774,6…
    const x = byId("andler").calc({ jb: "12000", bk: "40", ep: "8", lks: "20" });
    expect(round(x, 0)).toBe(775);
  });

  it("Handelskalkulation liefert Einstandspreis-Zeile", () => {
    const rows = byId("handelskalkulation").calc({ listen: "100", rabatt: "10", skonto: "0", bezug: "0", handlung: "0", gewinn: "0" });
    const einstand = rows.find((r) => r.label === "Einstandspreis");
    expect(round(einstand.value)).toBe(90);
  });

  it("Zinseszins: 1000 · 1,05^2 = 1102,50", () => {
    expect(round(byId("zinseszins").calc({ K0: "1000", p: "5", n: "2" }))).toBe(1102.5);
  });

  it("Mittelwert akzeptiert Semikolon-Liste", () => {
    expect(byId("mittelwert").calc({ werte: "12; 15; 9" })).toBe(12);
  });

  it("fehlende Eingaben ergeben null (kein Absturz)", () => {
    expect(byId("conversion").calc({ kaeufe: "", besucher: "" })).toBe(null);
  });
});
