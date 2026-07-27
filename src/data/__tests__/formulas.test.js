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

  it("leere Felder gelten nicht als eingetragene Null", () => {
    // Number("") ist 0 – ohne Leer-Prüfung zeigte jede Karte „0,00" an,
    // statt auf die fehlende Eingabe hinzuweisen.
    expect(byId("prozentwert").calc({ G: "", p: "" })).toBe(null);
    expect(byId("wirtschaftlichkeit").calc({ ertrag: "", aufwand: "" })).toBe(null);
    expect(byId("bilanzgleichung").calc({ verm: "", schuld: "" })).toBe(null);
  });
});

describe("Formeln – Struktur jeder Formel", () => {
  it("jede Formel hat Name, Formel und Erklärung", () => {
    for (const f of FORMULAS) {
      expect(f.name?.length, f.id).toBeGreaterThan(2);
      expect(f.formula?.length, f.id).toBeGreaterThan(3);
      expect(f.desc?.length, f.id).toBeGreaterThan(20);
      expect(Number.isInteger(f.sem), f.id).toBe(true);
    }
  });

  it("jede Formel mit Rechner liefert entweder Zahl, Zeilen oder null", () => {
    for (const f of FORMULAS) {
      if (typeof f.calc !== "function") continue;
      const leer = Object.fromEntries((f.inputs ?? []).map((i) => [i.k, ""]));
      const r = f.calc(leer);
      expect(r === null || typeof r === "number" || Array.isArray(r), f.id).toBe(true);
    }
  });

  it("Eingabefelder haben Schlüssel und Beschriftung", () => {
    for (const f of FORMULAS) {
      for (const i of f.inputs ?? []) {
        expect(i.k, f.id).toBeTruthy();
        expect(i.label?.length, f.id).toBeGreaterThan(0);
      }
    }
  });

  it("Skalar-Rechner haben eine Ausgabe-Beschreibung", () => {
    for (const f of FORMULAS) {
      if (typeof f.calc !== "function") continue;
      // Mehrzeilige Kalkulationen beschriften ihre Zeilen selbst.
      const werte = Object.fromEntries((f.inputs ?? []).map((i) => [i.k, "2"]));
      const r = f.calc(werte);
      if (typeof r === "number") expect(f.out?.label, f.id).toBeTruthy();
    }
  });
});

describe("Formeln – neue Rechner (Statistik, Bilanz, Kalkulation)", () => {
  it("Median: gerade Anzahl mittelt die beiden mittleren Werte", () => {
    expect(byId("median").calc({ werte: "3; 5; 9; 11" })).toBe(7);
    expect(byId("median").calc({ werte: "3; 5; 9" })).toBe(5);
  });

  it("Modus liefert den häufigsten Wert", () => {
    expect(byId("modus").calc({ werte: "3; 5; 5; 8" })).toBe(5);
  });

  it("Varianz: Standardbeispiel 2;4;4;4;5;5;7;9 = 4", () => {
    expect(byId("varianz").calc({ werte: "2;4;4;4;5;5;7;9" })).toBe(4);
  });

  it("Binomialverteilung: n=10, k=3, p=20 % ≈ 20,133 %", () => {
    expect(round(byId("binomial").calc({ n: "10", k: "3", p: "20" }), 3)).toBe(20.133);
  });

  it("Binomial: k grösser als n ergibt null", () => {
    expect(byId("binomial").calc({ n: "5", k: "9", p: "20" })).toBe(null);
  });

  it("Korrelation eines perfekten Zusammenhangs ist 1", () => {
    expect(byId("korrelation").calc({ x: "1;2;3;4", y: "2;4;6;8" })).toBe(1);
  });

  it("Regression findet y = 2x", () => {
    const rows = byId("regression").calc({ x: "1;2;3;4", y: "2;4;6;8" });
    expect(round(rows.find((r) => r.label === "Steigung b").value)).toBe(2);
    expect(round(rows.find((r) => r.label === "Achsenabschnitt a").value)).toBe(0);
  });

  it("Zahlenreihe versteht deutsche Dezimalkommas", () => {
    // „12,5; 9,5" darf nicht als vier Zahlen gelesen werden.
    expect(byId("mittelwert").calc({ werte: "12,5; 9,5" })).toBe(11);
    expect(byId("mittelwert").calc({ werte: "12,15,9" })).toBe(12);
  });

  it("z-Wert: eine Standardabweichung über dem Mittel", () => {
    expect(byId("z-wert").calc({ x: "110", mu: "100", sigma: "10" })).toBe(1);
  });

  it("Spanne ↔ Aufschlag rechnet in beide Richtungen", () => {
    const auf = byId("spanne-aufschlag").calc({ spanne: "40", aufschlag: "" });
    expect(round(auf[0].value)).toBe(66.67);
    const sp = byId("spanne-aufschlag").calc({ spanne: "", aufschlag: "100" });
    expect(round(sp[0].value)).toBe(50);
  });

  it("Rückwärtskalkulation: 200 € VK bei 25 % Gewinn ⇒ 160 € Selbstkosten", () => {
    const rows = byId("rueckwaertskalkulation").calc({ vk: "200", gewinn: "25", handlung: "0", bezug: "0", skonto: "0", rabatt: "0" });
    expect(round(rows.find((r) => r.label === "Selbstkosten").value)).toBe(160);
  });

  it("Rabatt und Skonto werden nacheinander abgezogen, nicht addiert", () => {
    const rows = byId("rabatt-skonto").calc({ listen: "1000", rabatt: "10", skonto: "2" });
    expect(round(rows.find((r) => r.label === "Zieleinkaufspreis").value)).toBe(900);
    // 2 % von 900, nicht von 1000
    expect(round(rows.find((r) => r.label === "Bareinkaufspreis").value)).toBe(882);
  });

  it("Hoch-Tief-Methode trennt variable und fixe Kosten", () => {
    const rows = byId("hoch-tief").calc({ xmax: "1000", kmax: "15000", xmin: "400", kmin: "9000" });
    expect(round(rows[0].value)).toBe(10);
    expect(round(rows[1].value)).toBe(5000);
  });

  it("Skonto-Effektivzins: 2 % bei 30/10 Tagen = 36 % p. a.", () => {
    expect(round(byId("skonto-effektivzins").calc({ skonto: "2", ziel: "30", frist: "10" }))).toBe(36);
  });

  it("Kapitalwert bei gleichen Rückflüssen", () => {
    // 10.000 investiert, 5 Jahre je 3.000 bei 8 % → ≈ 1.978 €
    expect(round(byId("kapitalwert-n").calc({ i0: "10000", r: "3000", n: "5", i: "8" }), 0)).toBe(1978);
  });

  it("kritische Menge im Kostenvergleich", () => {
    expect(byId("kostenvergleich").calc({ fixa: "20000", kva: "5", fixb: "10000", kvb: "10" })).toBe(2000);
  });

  it("Eigenkapitalquote und Verschuldungsgrad", () => {
    expect(byId("ek-quote").calc({ ek: "40000", gk: "160000" })).toBe(25);
    expect(byId("verschuldungsgrad").calc({ fk: "120000", ek: "40000" })).toBe(300);
  });

  it("Working Capital darf negativ sein", () => {
    expect(byId("working-capital").calc({ uv: "50000", kfv: "80000" })).toBe(-30000);
  });
});
