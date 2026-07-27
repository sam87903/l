/**
 * Formelsammlung & Rechner – ausgerichtet am Lehrplan des B.Sc. E-Commerce.
 * Jede Formel: Anzeige-Formel, Erklärung, Semester-Bezug und – wo sinnvoll –
 * ein interaktiver Rechner (`inputs` + `calc`). `calc` liefert entweder eine
 * Zahl oder ein Array von Ergebniszeilen (mehrstufige Kalkulation).
 *
 * Formeln mit gängigen Quellen abgeglichen (BWL-Kennzahlen, Handelskalkulation,
 * Andler-Formel, Investitionsrechnung, E-Commerce-KPIs).
 */

/**
 * Eingabe in eine Zahl wandeln – leer bleibt leer.
 *
 * Number("") ergibt 0, nicht NaN. Ohne die Leer-Prüfung gilt ein leeres Feld
 * als eingetragene Null: Die Karte zeigt dann „0,00 €" statt des Hinweises,
 * und Formeln mit Entweder-oder-Eingabe wählen den falschen Zweig.
 */
const num = (v) => {
  const raw = String(v ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
/** Alle Pflicht-Eingaben vorhanden und Zahl? */
const ok = (v, keys) => keys.every((k) => num(v[k]) !== null);

/**
 * Zahlenreihe aus Freitext lesen („12,5; 9" oder „12 15 9" oder „12,15,9").
 *
 * Getrennt wird an Semikolon und Leerzeichen – das Komma bleibt zunächst
 * Dezimalzeichen, wie in Deutschland üblich. Nur wenn dabei ein einziger
 * Block herauskommt, hat der Nutzer offenbar mit Kommas getrennt.
 */
const list = (raw) => {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  let parts = text.split(/[;\s]+/).filter(Boolean);
  if (parts.length === 1 && text.includes(",")) parts = text.split(",");
  return parts.map((x) => Number(String(x).replace(",", "."))).filter((x) => Number.isFinite(x));
};

/** Binomialkoeffizient „n über k" – multiplikativ, ohne große Fakultäten. */
const binom = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
};

export const FORMULA_CATS = [
  { id: "grund", label: "Grundlagen & Prozent", icon: "🧮", sem: 1 },
  { id: "kennz", label: "BWL-Kennzahlen", icon: "📈", sem: 1 },
  { id: "rewe", label: "Rechnungswesen", icon: "📊", sem: 1 },
  { id: "handel", label: "Handel & Kalkulation", icon: "🛍️", sem: 1 },
  { id: "kosten", label: "Kosten & Break-even", icon: "⚖️", sem: 2 },
  { id: "invest", label: "Investition & Finanzierung", icon: "💰", sem: 3 },
  { id: "logistik", label: "Material & Logistik", icon: "📦", sem: 4 },
  { id: "kpi", label: "E-Commerce- & Marketing-KPIs", icon: "🛒", sem: 2 },
  { id: "statistik", label: "Statistik", icon: "🎲", sem: 2 },
];

export const FORMULAS = [
  // ── Grundlagen & Prozent ──
  {
    id: "prozentwert", cat: "grund", sem: 1, name: "Prozentwert",
    formula: "W = G · p / 100",
    desc: "Prozentwert W aus Grundwert G und Prozentsatz p. Umgestellt: Prozentsatz p = W / G · 100.",
    inputs: [{ k: "G", label: "Grundwert", unit: "€" }, { k: "p", label: "Prozentsatz", unit: "%" }],
    calc: (v) => (ok(v, ["G", "p"]) ? (num(v.G) * num(v.p)) / 100 : null),
    out: { label: "Prozentwert", unit: "€", dec: 2 },
  },
  {
    id: "dreisatz", cat: "grund", sem: 1, name: "Dreisatz (proportional)",
    formula: "x = (b · c) / a",
    desc: "Wenn a Einheiten den Wert b haben, entspricht c Einheiten der Wert x. Grundwerkzeug für Umrechnungen.",
    inputs: [{ k: "a", label: "a (Menge)" }, { k: "b", label: "b (Wert zu a)" }, { k: "c", label: "c (gesuchte Menge)" }],
    calc: (v) => (ok(v, ["a", "b", "c"]) && num(v.a) !== 0 ? (num(v.b) * num(v.c)) / num(v.a) : null),
    out: { label: "x", unit: "", dec: 2 },
  },
  {
    id: "wachstum", cat: "grund", sem: 1, name: "Wachstumsrate",
    formula: "g = (neu − alt) / alt · 100",
    desc: "Prozentuale Veränderung zwischen zwei Werten, etwa Umsatzwachstum von Vorjahr zu aktuell.",
    inputs: [{ k: "alt", label: "Alter Wert" }, { k: "neu", label: "Neuer Wert" }],
    calc: (v) => (ok(v, ["alt", "neu"]) && num(v.alt) !== 0 ? ((num(v.neu) - num(v.alt)) / num(v.alt)) * 100 : null),
    out: { label: "Wachstum", unit: "%", dec: 2 },
  },
  {
    id: "zins", cat: "grund", sem: 1, name: "Einfache Zinsen",
    formula: "Z = K · p / 100 · t / 360",
    desc: "Zinsen Z für Kapital K, Zinssatz p pro Jahr und Laufzeit t in Tagen (kaufmännisch mit 360 Tagen).",
    inputs: [{ k: "K", label: "Kapital", unit: "€" }, { k: "p", label: "Zinssatz p.a.", unit: "%" }, { k: "t", label: "Tage" }],
    calc: (v) => (ok(v, ["K", "p", "t"]) ? (num(v.K) * num(v.p) / 100) * (num(v.t) / 360) : null),
    out: { label: "Zinsen", unit: "€", dec: 2 },
  },
  {
    id: "zinseszins", cat: "grund", sem: 1, name: "Zinseszins (Endkapital)",
    formula: "Kₙ = K₀ · (1 + p/100)ⁿ",
    desc: "Endkapital nach n Jahren bei jährlicher Verzinsung mit Zinssatz p – die Zinsen verzinsen sich mit.",
    inputs: [{ k: "K0", label: "Startkapital", unit: "€" }, { k: "p", label: "Zinssatz p.a.", unit: "%" }, { k: "n", label: "Jahre" }],
    calc: (v) => (ok(v, ["K0", "p", "n"]) ? num(v.K0) * Math.pow(1 + num(v.p) / 100, num(v.n)) : null),
    out: { label: "Endkapital", unit: "€", dec: 2 },
  },

  // ── BWL-Kennzahlen ──
  {
    id: "wirtschaftlichkeit", cat: "kennz", sem: 1, name: "Wirtschaftlichkeit",
    formula: "Wirtschaftlichkeit = Ertrag / Aufwand",
    desc: "Wertmäßiges Verhältnis von Ertrag zu Aufwand. Ein Wert über 1 bedeutet, dass mehr erwirtschaftet als eingesetzt wurde.",
    inputs: [{ k: "ertrag", label: "Ertrag", unit: "€" }, { k: "aufwand", label: "Aufwand", unit: "€" }],
    calc: (v) => (ok(v, ["ertrag", "aufwand"]) && num(v.aufwand) !== 0 ? num(v.ertrag) / num(v.aufwand) : null),
    out: { label: "Wirtschaftlichkeit", unit: "", dec: 2 },
  },
  {
    id: "produktivitaet", cat: "kennz", sem: 1, name: "Produktivität",
    formula: "Produktivität = Ausbringungsmenge / Faktoreinsatz",
    desc: "Technisches Verhältnis von Output zu Input, etwa Stück je Arbeitsstunde (Arbeitsproduktivität).",
    inputs: [{ k: "output", label: "Ausbringungsmenge" }, { k: "input", label: "Faktoreinsatz (z. B. Std.)" }],
    calc: (v) => (ok(v, ["output", "input"]) && num(v.input) !== 0 ? num(v.output) / num(v.input) : null),
    out: { label: "Produktivität", unit: "/Einheit", dec: 2 },
  },
  {
    id: "ek-rent", cat: "kennz", sem: 1, name: "Eigenkapitalrentabilität",
    formula: "EKR = Gewinn / Eigenkapital · 100",
    desc: "Verzinsung des eingesetzten Eigenkapitals. Wichtigste Rentabilitätskennzahl aus Eigentümersicht.",
    inputs: [{ k: "gewinn", label: "Gewinn", unit: "€" }, { k: "ek", label: "Eigenkapital", unit: "€" }],
    calc: (v) => (ok(v, ["gewinn", "ek"]) && num(v.ek) !== 0 ? (num(v.gewinn) / num(v.ek)) * 100 : null),
    out: { label: "EK-Rentabilität", unit: "%", dec: 2 },
  },
  {
    id: "umsatz-rent", cat: "kennz", sem: 1, name: "Umsatzrentabilität",
    formula: "UR = Gewinn / Umsatz · 100",
    desc: "Wie viel von jedem Euro Umsatz als Gewinn übrig bleibt – Maß für die Ertragskraft.",
    inputs: [{ k: "gewinn", label: "Gewinn", unit: "€" }, { k: "umsatz", label: "Umsatz", unit: "€" }],
    calc: (v) => (ok(v, ["gewinn", "umsatz"]) && num(v.umsatz) !== 0 ? (num(v.gewinn) / num(v.umsatz)) * 100 : null),
    out: { label: "Umsatzrentabilität", unit: "%", dec: 2 },
  },
  {
    id: "roi", cat: "kennz", sem: 1, name: "Return on Investment (ROI)",
    formula: "ROI = Gewinn / Gesamtkapital · 100 = Umsatzrent. · Kapitalumschlag",
    desc: "Gesamtkapitalrendite. Nach dem DuPont-Schema das Produkt aus Umsatzrentabilität und Kapitalumschlag (Umsatz/Kapital).",
    inputs: [{ k: "gewinn", label: "Gewinn", unit: "€" }, { k: "kapital", label: "Gesamtkapital", unit: "€" }],
    calc: (v) => (ok(v, ["gewinn", "kapital"]) && num(v.kapital) !== 0 ? (num(v.gewinn) / num(v.kapital)) * 100 : null),
    out: { label: "ROI", unit: "%", dec: 2 },
  },
  {
    id: "liquiditaet2", cat: "kennz", sem: 1, name: "Liquidität 2. Grades",
    formula: "L2 = (Umlaufvermögen − Vorräte) / kurzfr. Verbindlichkeiten · 100",
    desc: "Einzugsliquidität: Deckt das schnell verfügbare Vermögen die kurzfristigen Schulden? Richtwert ≥ 100 %.",
    inputs: [{ k: "monetaer", label: "Monetäres Umlaufverm. (ohne Vorräte)", unit: "€" }, { k: "kfv", label: "kurzfr. Verbindlichk.", unit: "€" }],
    calc: (v) => (ok(v, ["monetaer", "kfv"]) && num(v.kfv) !== 0 ? (num(v.monetaer) / num(v.kfv)) * 100 : null),
    out: { label: "Liquidität 2. Grades", unit: "%", dec: 1 },
  },

  // ── Rechnungswesen ──
  {
    id: "afa-linear", cat: "rewe", sem: 1, name: "Lineare Abschreibung",
    formula: "AfA = (Anschaffungskosten − Restwert) / Nutzungsdauer",
    desc: "Gleicher Abschreibungsbetrag pro Jahr über die gesamte Nutzungsdauer. Häufigste Methode.",
    inputs: [{ k: "ak", label: "Anschaffungskosten", unit: "€" }, { k: "rw", label: "Restwert", unit: "€", def: "0" }, { k: "nd", label: "Nutzungsdauer", unit: "Jahre" }],
    calc: (v) => (ok(v, ["ak", "nd"]) && num(v.nd) !== 0 ? (num(v.ak) - (num(v.rw) || 0)) / num(v.nd) : null),
    out: { label: "AfA pro Jahr", unit: "€", dec: 2 },
  },
  {
    id: "afa-degressiv", cat: "rewe", sem: 1, name: "Degressive Abschreibung (1. Jahr)",
    formula: "AfA₁ = Anschaffungskosten · p / 100",
    desc: "Fester Prozentsatz auf den jeweiligen Restbuchwert; die Beträge sinken Jahr für Jahr. Hier das erste Jahr.",
    inputs: [{ k: "ak", label: "Anschaffungskosten", unit: "€" }, { k: "p", label: "AfA-Satz", unit: "%" }],
    calc: (v) => (ok(v, ["ak", "p"]) ? (num(v.ak) * num(v.p)) / 100 : null),
    out: { label: "AfA 1. Jahr", unit: "€", dec: 2 },
  },
  {
    id: "ust-zahllast", cat: "rewe", sem: 1, name: "Umsatzsteuer-Zahllast",
    formula: "Zahllast = Umsatzsteuer − Vorsteuer",
    desc: "An das Finanzamt abzuführender Betrag: vereinnahmte Umsatzsteuer minus gezahlte Vorsteuer.",
    inputs: [{ k: "ust", label: "Umsatzsteuer (vereinnahmt)", unit: "€" }, { k: "vst", label: "Vorsteuer (gezahlt)", unit: "€" }],
    calc: (v) => (ok(v, ["ust", "vst"]) ? num(v.ust) - num(v.vst) : null),
    out: { label: "Zahllast", unit: "€", dec: 2 },
  },
  {
    id: "brutto-netto", cat: "rewe", sem: 1, name: "Brutto ↔ Netto (19 %)",
    formula: "Netto = Brutto / 1,19   ·   USt = Brutto − Netto",
    desc: "Herausrechnen der Umsatzsteuer aus einem Bruttobetrag beim Regelsteuersatz von 19 %.",
    inputs: [{ k: "brutto", label: "Bruttobetrag", unit: "€" }],
    calc: (v) =>
      ok(v, ["brutto"])
        ? [
            { label: "Netto", value: num(v.brutto) / 1.19, unit: "€" },
            { label: "Umsatzsteuer 19 %", value: num(v.brutto) - num(v.brutto) / 1.19, unit: "€" },
          ]
        : null,
  },

  // ── Handel & Kalkulation ──
  {
    id: "handelsspanne", cat: "handel", sem: 1, name: "Handelsspanne",
    formula: "Spanne = (VK − EK) / VK · 100",
    desc: "Rohertrag in Prozent des Verkaufspreises. Muss Handlungskosten decken und Gewinn ermöglichen.",
    inputs: [{ k: "ek", label: "Einkaufspreis", unit: "€" }, { k: "vk", label: "Verkaufspreis", unit: "€" }],
    calc: (v) => (ok(v, ["ek", "vk"]) && num(v.vk) !== 0 ? ((num(v.vk) - num(v.ek)) / num(v.vk)) * 100 : null),
    out: { label: "Handelsspanne", unit: "%", dec: 2 },
  },
  {
    id: "kalk-aufschlag", cat: "handel", sem: 1, name: "Kalkulationsaufschlag",
    formula: "Aufschlag = (VK − EK) / EK · 100",
    desc: "Dieselbe Differenz wie die Handelsspanne, aber bezogen auf den Einkaufspreis. Nicht verwechseln!",
    inputs: [{ k: "ek", label: "Einkaufspreis", unit: "€" }, { k: "vk", label: "Verkaufspreis", unit: "€" }],
    calc: (v) => (ok(v, ["ek", "vk"]) && num(v.ek) !== 0 ? ((num(v.vk) - num(v.ek)) / num(v.ek)) * 100 : null),
    out: { label: "Kalkulationsaufschlag", unit: "%", dec: 2 },
  },
  {
    id: "handelskalkulation", cat: "handel", sem: 1, name: "Handelskalkulation (Vorwärts)",
    formula: "Listen-EK − Rabatt − Skonto + Bezugskosten = Einstandspreis → + Handlungskosten + Gewinn → VK",
    desc: "Vollständige Vorwärtskalkulation vom Listeneinkaufspreis bis zum Netto-Verkaufspreis. Zeigt jede Stufe der Kalkulationsleiter.",
    inputs: [
      { k: "listen", label: "Listeneinkaufspreis", unit: "€" },
      { k: "rabatt", label: "Liefererrabatt", unit: "%", def: "0" },
      { k: "skonto", label: "Liefererskonto", unit: "%", def: "0" },
      { k: "bezug", label: "Bezugskosten", unit: "€", def: "0" },
      { k: "handlung", label: "Handlungskosten", unit: "%", def: "0" },
      { k: "gewinn", label: "Gewinnzuschlag", unit: "%", def: "0" },
    ],
    calc: (v) => {
      if (!ok(v, ["listen"])) return null;
      const listen = num(v.listen);
      const zielEk = listen * (1 - (num(v.rabatt) || 0) / 100);
      const barEk = zielEk * (1 - (num(v.skonto) || 0) / 100);
      const einstand = barEk + (num(v.bezug) || 0);
      const selbstkosten = einstand * (1 + (num(v.handlung) || 0) / 100);
      const vk = selbstkosten * (1 + (num(v.gewinn) || 0) / 100);
      return [
        { label: "Zieleinkaufspreis", value: zielEk, unit: "€" },
        { label: "Bareinkaufspreis", value: barEk, unit: "€" },
        { label: "Einstandspreis", value: einstand, unit: "€", strong: true },
        { label: "Selbstkosten", value: selbstkosten, unit: "€" },
        { label: "Barverkaufspreis (netto)", value: vk, unit: "€", strong: true },
      ];
    },
  },

  // ── Kosten & Break-even ──
  {
    id: "deckungsbeitrag", cat: "kosten", sem: 2, name: "Deckungsbeitrag (Stück)",
    formula: "db = Preis − variable Stückkosten",
    desc: "Betrag, den ein Stück zur Deckung der Fixkosten (und danach zum Gewinn) beiträgt.",
    inputs: [{ k: "preis", label: "Verkaufspreis/Stück", unit: "€" }, { k: "kv", label: "variable Kosten/Stück", unit: "€" }],
    calc: (v) => (ok(v, ["preis", "kv"]) ? num(v.preis) - num(v.kv) : null),
    out: { label: "Deckungsbeitrag/Stück", unit: "€", dec: 2 },
  },
  {
    id: "breakeven-menge", cat: "kosten", sem: 2, name: "Break-even-Menge",
    formula: "xₐ = Fixkosten / (Preis − variable Stückkosten)",
    desc: "Absatzmenge, ab der die Gewinnschwelle erreicht ist: Erlöse decken genau die Gesamtkosten.",
    inputs: [{ k: "fix", label: "Fixkosten", unit: "€" }, { k: "preis", label: "Preis/Stück", unit: "€" }, { k: "kv", label: "var. Kosten/Stück", unit: "€" }],
    calc: (v) => {
      if (!ok(v, ["fix", "preis", "kv"])) return null;
      const db = num(v.preis) - num(v.kv);
      return db > 0 ? num(v.fix) / db : null;
    },
    out: { label: "Break-even-Menge", unit: "Stück", dec: 0 },
  },
  {
    id: "breakeven-umsatz", cat: "kosten", sem: 2, name: "Break-even-Umsatz",
    formula: "Umsatzₐ = Fixkosten / DB-Quote",
    desc: "Mindestumsatz zum Erreichen der Gewinnschwelle. DB-Quote = Deckungsbeitrag / Umsatz.",
    inputs: [{ k: "fix", label: "Fixkosten", unit: "€" }, { k: "dbquote", label: "DB-Quote", unit: "%" }],
    calc: (v) => (ok(v, ["fix", "dbquote"]) && num(v.dbquote) !== 0 ? num(v.fix) / (num(v.dbquote) / 100) : null),
    out: { label: "Break-even-Umsatz", unit: "€", dec: 2 },
  },

  // ── Investition & Finanzierung ──
  {
    id: "kapitalwert", cat: "invest", sem: 3, name: "Kapitalwert (2 Perioden)",
    formula: "C₀ = −I₀ + Σ CFₜ / (1 + i)ᵗ",
    desc: "Barwert aller Zahlungen einer Investition abzüglich Anschaffung. Positiv = vorteilhaft. Hier für zwei Jahre.",
    inputs: [
      { k: "i0", label: "Anschaffung I₀", unit: "€" },
      { k: "cf1", label: "Rückfluss Jahr 1", unit: "€" },
      { k: "cf2", label: "Rückfluss Jahr 2", unit: "€", def: "0" },
      { k: "i", label: "Kalkulationszins", unit: "%" },
    ],
    calc: (v) => {
      if (!ok(v, ["i0", "cf1", "i"])) return null;
      const z = 1 + num(v.i) / 100;
      return -num(v.i0) + num(v.cf1) / z + (num(v.cf2) || 0) / (z * z);
    },
    out: { label: "Kapitalwert C₀", unit: "€", dec: 2 },
  },
  {
    id: "amortisation", cat: "invest", sem: 3, name: "Amortisationsdauer (statisch)",
    formula: "t = Anschaffung / jährlicher Rückfluss",
    desc: "Wie viele Jahre bis die Investition durch die jährlichen Rückflüsse zurückverdient ist.",
    inputs: [{ k: "i0", label: "Anschaffung", unit: "€" }, { k: "cf", label: "Ø Rückfluss/Jahr", unit: "€" }],
    calc: (v) => (ok(v, ["i0", "cf"]) && num(v.cf) !== 0 ? num(v.i0) / num(v.cf) : null),
    out: { label: "Amortisationsdauer", unit: "Jahre", dec: 2 },
  },
  {
    id: "annuitaet", cat: "invest", sem: 3, name: "Annuität (Kredit-Rate)",
    formula: "A = K · [i(1+i)ⁿ] / [(1+i)ⁿ − 1]",
    desc: "Gleichbleibende jährliche Rate zur Tilgung eines Darlehens K über n Jahre bei Zinssatz i.",
    inputs: [{ k: "K", label: "Darlehen", unit: "€" }, { k: "i", label: "Zinssatz p.a.", unit: "%" }, { k: "n", label: "Laufzeit", unit: "Jahre" }],
    calc: (v) => {
      if (!ok(v, ["K", "i", "n"])) return null;
      const i = num(v.i) / 100, n = num(v.n);
      if (i === 0) return num(v.K) / n;
      const q = Math.pow(1 + i, n);
      return num(v.K) * (i * q) / (q - 1);
    },
    out: { label: "Jahres-Annuität", unit: "€", dec: 2 },
  },

  // ── Material & Logistik ──
  {
    id: "andler", cat: "logistik", sem: 4, name: "Optimale Bestellmenge (Andler)",
    formula: "x = √( 200 · Jahresbedarf · Bestellkosten / (Einstandspreis · Lagerkostensatz) )",
    desc: "Andler-Formel: Menge mit den geringsten Gesamtkosten aus Bestell- und Lagerhaltungskosten.",
    inputs: [
      { k: "jb", label: "Jahresbedarf", unit: "Stück" },
      { k: "bk", label: "Bestellkosten/Bestellung", unit: "€" },
      { k: "ep", label: "Einstandspreis/Stück", unit: "€" },
      { k: "lks", label: "Lagerhaltungskostensatz", unit: "%" },
    ],
    calc: (v) => {
      if (!ok(v, ["jb", "bk", "ep", "lks"])) return null;
      const nenner = num(v.ep) * num(v.lks);
      return nenner > 0 ? Math.sqrt((200 * num(v.jb) * num(v.bk)) / nenner) : null;
    },
    out: { label: "optimale Bestellmenge", unit: "Stück", dec: 0 },
  },
  {
    id: "lagerumschlag", cat: "logistik", sem: 4, name: "Lagerumschlagshäufigkeit",
    formula: "UH = Wareneinsatz / Ø Lagerbestand",
    desc: "Wie oft der durchschnittliche Bestand pro Jahr verkauft und ersetzt wird. Höher = weniger Kapitalbindung.",
    inputs: [{ k: "einsatz", label: "Wareneinsatz/Jahr", unit: "€" }, { k: "bestand", label: "Ø Lagerbestand", unit: "€" }],
    calc: (v) => (ok(v, ["einsatz", "bestand"]) && num(v.bestand) !== 0 ? num(v.einsatz) / num(v.bestand) : null),
    out: { label: "Umschlagshäufigkeit", unit: "×/Jahr", dec: 2 },
  },
  {
    id: "lagerdauer", cat: "logistik", sem: 4, name: "Ø Lagerdauer",
    formula: "Ø Lagerdauer = 360 / Umschlagshäufigkeit",
    desc: "Durchschnittliche Verweildauer der Ware im Lager in Tagen.",
    inputs: [{ k: "uh", label: "Umschlagshäufigkeit", unit: "×/Jahr" }],
    calc: (v) => (ok(v, ["uh"]) && num(v.uh) !== 0 ? 360 / num(v.uh) : null),
    out: { label: "Ø Lagerdauer", unit: "Tage", dec: 1 },
  },
  {
    id: "meldebestand", cat: "logistik", sem: 4, name: "Meldebestand",
    formula: "Meldebestand = Tagesverbrauch · Lieferzeit + Sicherheitsbestand",
    desc: "Bestand, bei dem nachbestellt werden muss, damit die Lieferzeit ohne Fehlmenge überbrückt wird.",
    inputs: [{ k: "tv", label: "Tagesverbrauch", unit: "Stück" }, { k: "lz", label: "Lieferzeit", unit: "Tage" }, { k: "sb", label: "Sicherheitsbestand", unit: "Stück", def: "0" }],
    calc: (v) => (ok(v, ["tv", "lz"]) ? num(v.tv) * num(v.lz) + (num(v.sb) || 0) : null),
    out: { label: "Meldebestand", unit: "Stück", dec: 0 },
  },

  // ── E-Commerce- & Marketing-KPIs ──
  {
    id: "conversion", cat: "kpi", sem: 2, name: "Conversion Rate",
    formula: "CR = Käufe / Besucher · 100",
    desc: "Anteil der Besucher, die kaufen. Wichtigste Erfolgskennzahl im Onlineshop (Schnitt DE ~2 %).",
    inputs: [{ k: "kaeufe", label: "Käufe/Bestellungen" }, { k: "besucher", label: "Besucher" }],
    calc: (v) => (ok(v, ["kaeufe", "besucher"]) && num(v.besucher) !== 0 ? (num(v.kaeufe) / num(v.besucher)) * 100 : null),
    out: { label: "Conversion Rate", unit: "%", dec: 2 },
  },
  {
    id: "aov", cat: "kpi", sem: 2, name: "Ø Bestellwert (AOV)",
    formula: "AOV = Umsatz / Anzahl Bestellungen",
    desc: "Average Order Value – durchschnittlicher Warenkorbwert je Bestellung.",
    inputs: [{ k: "umsatz", label: "Umsatz", unit: "€" }, { k: "bestellungen", label: "Bestellungen" }],
    calc: (v) => (ok(v, ["umsatz", "bestellungen"]) && num(v.bestellungen) !== 0 ? num(v.umsatz) / num(v.bestellungen) : null),
    out: { label: "Ø Bestellwert", unit: "€", dec: 2 },
  },
  {
    id: "cac", cat: "kpi", sem: 2, name: "Kundengewinnungskosten (CAC)",
    formula: "CAC = Marketingkosten / Neukunden",
    desc: "Customer Acquisition Cost – was die Gewinnung eines neuen Kunden im Schnitt kostet.",
    inputs: [{ k: "kosten", label: "Marketing-/Vertriebskosten", unit: "€" }, { k: "neukunden", label: "Neukunden" }],
    calc: (v) => (ok(v, ["kosten", "neukunden"]) && num(v.neukunden) !== 0 ? num(v.kosten) / num(v.neukunden) : null),
    out: { label: "CAC", unit: "€", dec: 2 },
  },
  {
    id: "clv", cat: "kpi", sem: 2, name: "Kundenwert (CLV)",
    formula: "CLV = Ø Bestellwert · Kauffrequenz/Jahr · Kundenlebensdauer",
    desc: "Customer Lifetime Value – Gesamtertrag eines Kunden über die Beziehung. Faustregel: CLV sollte ≥ 3 × CAC sein.",
    inputs: [{ k: "aov", label: "Ø Bestellwert", unit: "€" }, { k: "freq", label: "Käufe pro Jahr" }, { k: "jahre", label: "Kundenlebensdauer", unit: "Jahre" }],
    calc: (v) => (ok(v, ["aov", "freq", "jahre"]) ? num(v.aov) * num(v.freq) * num(v.jahre) : null),
    out: { label: "CLV", unit: "€", dec: 2 },
  },
  {
    id: "roas", cat: "kpi", sem: 2, name: "Werbe-Rendite (ROAS)",
    formula: "ROAS = Umsatz aus Werbung / Werbekosten",
    desc: "Return on Ad Spend – Umsatz je eingesetztem Euro Werbebudget. ROAS 4 bedeutet 4 € Umsatz je 1 € Werbung.",
    inputs: [{ k: "umsatz", label: "Umsatz aus Werbung", unit: "€" }, { k: "kosten", label: "Werbekosten", unit: "€" }],
    calc: (v) => (ok(v, ["umsatz", "kosten"]) && num(v.kosten) !== 0 ? num(v.umsatz) / num(v.kosten) : null),
    out: { label: "ROAS", unit: "×", dec: 2 },
  },
  {
    id: "ctr", cat: "kpi", sem: 2, name: "Klickrate (CTR)",
    formula: "CTR = Klicks / Impressionen · 100",
    desc: "Click-Through-Rate – wie oft eine Anzeige/ein Link im Verhältnis zu den Einblendungen geklickt wird.",
    inputs: [{ k: "klicks", label: "Klicks" }, { k: "impressionen", label: "Impressionen" }],
    calc: (v) => (ok(v, ["klicks", "impressionen"]) && num(v.impressionen) !== 0 ? (num(v.klicks) / num(v.impressionen)) * 100 : null),
    out: { label: "CTR", unit: "%", dec: 2 },
  },
  {
    id: "retourenquote", cat: "kpi", sem: 2, name: "Retourenquote",
    formula: "Retourenquote = Retouren / versendete Artikel · 100",
    desc: "Anteil zurückgesandter Artikel. Besonders im Bekleidungs-E-Commerce hoch; treibt die Kosten.",
    inputs: [{ k: "retouren", label: "Retouren" }, { k: "versendet", label: "versendete Artikel" }],
    calc: (v) => (ok(v, ["retouren", "versendet"]) && num(v.versendet) !== 0 ? (num(v.retouren) / num(v.versendet)) * 100 : null),
    out: { label: "Retourenquote", unit: "%", dec: 2 },
  },
  {
    id: "warenkorbabbruch", cat: "kpi", sem: 2, name: "Warenkorbabbruchrate",
    formula: "Abbruchrate = (1 − Käufe / erstellte Warenkörbe) · 100",
    desc: "Anteil gefüllter Warenkörbe ohne Kaufabschluss. Im Schnitt über 70 %.",
    inputs: [{ k: "kaeufe", label: "abgeschlossene Käufe" }, { k: "koerbe", label: "erstellte Warenkörbe" }],
    calc: (v) => (ok(v, ["kaeufe", "koerbe"]) && num(v.koerbe) !== 0 ? (1 - num(v.kaeufe) / num(v.koerbe)) * 100 : null),
    out: { label: "Abbruchrate", unit: "%", dec: 2 },
  },

  // ── Statistik ──
  {
    id: "mittelwert", cat: "statistik", sem: 2, name: "Arithmetisches Mittel",
    formula: "x̄ = (x₁ + x₂ + … + xₙ) / n",
    desc: "Durchschnitt einer Zahlenreihe. Zahlen mit Komma oder Semikolon trennen.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
    },
    out: { label: "Mittelwert", unit: "", dec: 2 },
  },
  {
    id: "standardabweichung", cat: "statistik", sem: 2, name: "Standardabweichung",
    formula: "σ = √( Σ(xᵢ − x̄)² / n )",
    desc: "Streuung der Werte um den Mittelwert (Grundgesamtheit). Zahlen mit Komma oder Semikolon trennen.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      if (!arr.length) return null;
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
    },
    out: { label: "Standardabweichung σ", unit: "", dec: 3 },
  },
  // ── Bilanzanalyse (BWL II, Semester 3) ──
  {
    id: "gkr", cat: "kennz", sem: 3, name: "Gesamtkapitalrentabilität",
    formula: "GKR = (Gewinn + Fremdkapitalzinsen) / Gesamtkapital · 100",
    desc: "Verzinsung des gesamten eingesetzten Kapitals. Die Fremdkapitalzinsen kommen hinzu, damit die Kennzahl unabhängig von der Finanzierung vergleichbar bleibt.",
    inputs: [{ k: "gewinn", label: "Gewinn", unit: "€" }, { k: "zinsen", label: "Fremdkapitalzinsen", unit: "€" }, { k: "gk", label: "Gesamtkapital", unit: "€" }],
    calc: (v) => (ok(v, ["gewinn", "zinsen", "gk"]) && num(v.gk) !== 0 ? ((num(v.gewinn) + num(v.zinsen)) / num(v.gk)) * 100 : null),
    out: { label: "Gesamtkapitalrentabilität", unit: "%", dec: 2 },
  },
  {
    id: "liquiditaet1", cat: "kennz", sem: 3, name: "Liquidität 1. Grades",
    formula: "L1 = Zahlungsmittel / kurzfr. Verbindlichkeiten · 100",
    desc: "Barliquidität: Welcher Anteil der kurzfristigen Schulden ließe sich sofort begleichen? Richtwert 10–30 % – mehr bedeutet ungenutztes Geld.",
    inputs: [{ k: "zm", label: "Zahlungsmittel", unit: "€" }, { k: "kfv", label: "kurzfr. Verbindlichk.", unit: "€" }],
    calc: (v) => (ok(v, ["zm", "kfv"]) && num(v.kfv) !== 0 ? (num(v.zm) / num(v.kfv)) * 100 : null),
    out: { label: "Liquidität 1. Grades", unit: "%", dec: 1 },
  },
  {
    id: "liquiditaet3", cat: "kennz", sem: 3, name: "Liquidität 3. Grades",
    formula: "L3 = Umlaufvermögen / kurzfr. Verbindlichkeiten · 100",
    desc: "Umsatzliquidität: das gesamte Umlaufvermögen inklusive Vorräte gegen die kurzfristigen Schulden. Richtwert ≥ 120 %.",
    inputs: [{ k: "uv", label: "Umlaufvermögen", unit: "€" }, { k: "kfv", label: "kurzfr. Verbindlichk.", unit: "€" }],
    calc: (v) => (ok(v, ["uv", "kfv"]) && num(v.kfv) !== 0 ? (num(v.uv) / num(v.kfv)) * 100 : null),
    out: { label: "Liquidität 3. Grades", unit: "%", dec: 1 },
  },
  {
    id: "ek-quote", cat: "kennz", sem: 3, name: "Eigenkapitalquote",
    formula: "EKQ = Eigenkapital / Gesamtkapital · 100",
    desc: "Anteil des Eigenkapitals an der Bilanzsumme – Maß für die Unabhängigkeit von Gläubigern. Im Handel gelten 20–40 % als solide.",
    inputs: [{ k: "ek", label: "Eigenkapital", unit: "€" }, { k: "gk", label: "Gesamtkapital", unit: "€" }],
    calc: (v) => (ok(v, ["ek", "gk"]) && num(v.gk) !== 0 ? (num(v.ek) / num(v.gk)) * 100 : null),
    out: { label: "Eigenkapitalquote", unit: "%", dec: 2 },
  },
  {
    id: "verschuldungsgrad", cat: "kennz", sem: 3, name: "Verschuldungsgrad",
    formula: "VG = Fremdkapital / Eigenkapital · 100",
    desc: "Verhältnis von Schulden zu Eigenkapital. Je höher, desto größer die Abhängigkeit von Gläubigern und das Zinsrisiko.",
    inputs: [{ k: "fk", label: "Fremdkapital", unit: "€" }, { k: "ek", label: "Eigenkapital", unit: "€" }],
    calc: (v) => (ok(v, ["fk", "ek"]) && num(v.ek) !== 0 ? (num(v.fk) / num(v.ek)) * 100 : null),
    out: { label: "Verschuldungsgrad", unit: "%", dec: 2 },
  },
  {
    id: "anlagendeckung2", cat: "kennz", sem: 3, name: "Anlagendeckungsgrad II",
    formula: "AD II = (Eigenkapital + langfr. Fremdkapital) / Anlagevermögen · 100",
    desc: "Goldene Bilanzregel: Langfristig gebundenes Vermögen soll langfristig finanziert sein. Richtwert ≥ 100 %.",
    inputs: [{ k: "ek", label: "Eigenkapital", unit: "€" }, { k: "lfk", label: "langfr. Fremdkapital", unit: "€" }, { k: "av", label: "Anlagevermögen", unit: "€" }],
    calc: (v) => (ok(v, ["ek", "lfk", "av"]) && num(v.av) !== 0 ? ((num(v.ek) + num(v.lfk)) / num(v.av)) * 100 : null),
    out: { label: "Anlagendeckungsgrad II", unit: "%", dec: 1 },
  },
  {
    id: "working-capital", cat: "kennz", sem: 3, name: "Working Capital",
    formula: "WC = Umlaufvermögen − kurzfr. Verbindlichkeiten",
    desc: "Der Teil des Umlaufvermögens, der langfristig finanziert ist. Ein negativer Wert zeigt an, dass kurzfristige Schulden das Umlaufvermögen übersteigen.",
    inputs: [{ k: "uv", label: "Umlaufvermögen", unit: "€" }, { k: "kfv", label: "kurzfr. Verbindlichk.", unit: "€" }],
    calc: (v) => (ok(v, ["uv", "kfv"]) ? num(v.uv) - num(v.kfv) : null),
    out: { label: "Working Capital", unit: "€", dec: 2 },
  },
  {
    id: "cashflow", cat: "kennz", sem: 3, name: "Cashflow (indirekt)",
    formula: "CF = Jahresüberschuss + Abschreibungen + Zunahme Rückstellungen",
    desc: "Vereinfachte indirekte Ermittlung: Zum Gewinn werden die nicht zahlungswirksamen Aufwendungen zurückgerechnet. Zeigt die Innenfinanzierungskraft.",
    inputs: [{ k: "ju", label: "Jahresüberschuss", unit: "€" }, { k: "afa", label: "Abschreibungen", unit: "€" }, { k: "rst", label: "Zunahme Rückstellungen", unit: "€" }],
    calc: (v) => (ok(v, ["ju", "afa", "rst"]) ? num(v.ju) + num(v.afa) + num(v.rst) : null),
    out: { label: "Cashflow", unit: "€", dec: 2 },
  },

  // ── Rechnungswesen, Ergänzungen ──
  {
    id: "afa-leistung", cat: "rewe", sem: 1, name: "Leistungsabschreibung",
    formula: "AfA = (Anschaffungskosten − Restwert) · Periodenleistung / Gesamtleistung",
    desc: "Abschreibung nach tatsächlicher Nutzung statt nach Zeit – etwa Maschinenstunden oder gefahrene Kilometer.",
    inputs: [{ k: "ak", label: "Anschaffungskosten", unit: "€" }, { k: "rw", label: "Restwert", unit: "€" }, { k: "pl", label: "Periodenleistung" }, { k: "gl", label: "Gesamtleistung" }],
    calc: (v) => (ok(v, ["ak", "rw", "pl", "gl"]) && num(v.gl) !== 0 ? ((num(v.ak) - num(v.rw)) * num(v.pl)) / num(v.gl) : null),
    out: { label: "AfA der Periode", unit: "€", dec: 2 },
  },
  {
    id: "restbuchwert", cat: "rewe", sem: 1, name: "Restbuchwert (linear)",
    formula: "RBW = Anschaffungskosten − Jahre · AfA",
    desc: "Buchwert nach n Jahren bei linearer Abschreibung. Am Ende der Nutzungsdauer bleibt höchstens der Erinnerungswert von 1 €.",
    inputs: [{ k: "ak", label: "Anschaffungskosten", unit: "€" }, { k: "afa", label: "AfA pro Jahr", unit: "€" }, { k: "n", label: "Jahre" }],
    calc: (v) => (ok(v, ["ak", "afa", "n"]) ? Math.max(0, num(v.ak) - num(v.afa) * num(v.n)) : null),
    out: { label: "Restbuchwert", unit: "€", dec: 2 },
  },
  {
    id: "bilanzgleichung", cat: "rewe", sem: 1, name: "Eigenkapital aus der Bilanz",
    formula: "Eigenkapital = Vermögen − Schulden",
    desc: "Das Reinvermögen als Saldo der Bilanz. Umgestellt lautet die Bilanzgleichung: Vermögen = Eigenkapital + Schulden.",
    inputs: [{ k: "verm", label: "Vermögen", unit: "€" }, { k: "schuld", label: "Schulden", unit: "€" }],
    calc: (v) => (ok(v, ["verm", "schuld"]) ? num(v.verm) - num(v.schuld) : null),
    out: { label: "Eigenkapital", unit: "€", dec: 2 },
  },
  {
    id: "gewinn-guv", cat: "rewe", sem: 1, name: "Gewinn aus der GuV",
    formula: "Gewinn = Erträge − Aufwendungen",
    desc: "Erfolg einer Periode. Ein negativer Wert ist ein Jahresfehlbetrag (Verlust).",
    inputs: [{ k: "ertraege", label: "Erträge", unit: "€" }, { k: "aufwand", label: "Aufwendungen", unit: "€" }],
    calc: (v) => (ok(v, ["ertraege", "aufwand"]) ? num(v.ertraege) - num(v.aufwand) : null),
    out: { label: "Jahresergebnis", unit: "€", dec: 2 },
  },

  // ── Handel & Kalkulation, Ergänzungen ──
  {
    id: "rueckwaertskalkulation", cat: "handel", sem: 1, name: "Handelskalkulation (Rückwärts)",
    formula: "Barverkaufspreis → Selbstkosten → Einstandspreis → − Bezugskosten → Zieleinkaufspreis → Listen-EK",
    desc: "Vom geplanten Verkaufspreis zurück zum höchstmöglichen Listeneinkaufspreis. Klassische Aufgabe, wenn der Marktpreis feststeht und der Einkauf verhandelt werden muss.",
    inputs: [
      { k: "vk", label: "Barverkaufspreis (netto)", unit: "€" },
      { k: "gewinn", label: "Gewinnzuschlag", unit: "%" },
      { k: "handlung", label: "Handlungskosten", unit: "%" },
      { k: "bezug", label: "Bezugskosten", unit: "€", def: "0" },
      { k: "skonto", label: "Liefererskonto", unit: "%", def: "0" },
      { k: "rabatt", label: "Liefererrabatt", unit: "%", def: "0" },
    ],
    calc: (v) => {
      if (!ok(v, ["vk"])) return null;
      const selbstkosten = num(v.vk) / (1 + (num(v.gewinn) || 0) / 100);
      const einstand = selbstkosten / (1 + (num(v.handlung) || 0) / 100);
      const barEk = einstand - (num(v.bezug) || 0);
      const zielEk = barEk / (1 - (num(v.skonto) || 0) / 100);
      const listen = zielEk / (1 - (num(v.rabatt) || 0) / 100);
      return [
        { label: "Selbstkosten", value: selbstkosten, unit: "€" },
        { label: "Einstandspreis", value: einstand, unit: "€", strong: true },
        { label: "Bareinkaufspreis", value: barEk, unit: "€" },
        { label: "Zieleinkaufspreis", value: zielEk, unit: "€" },
        { label: "Listeneinkaufspreis", value: listen, unit: "€", strong: true },
      ];
    },
  },
  {
    id: "spanne-aufschlag", cat: "handel", sem: 1, name: "Spanne ↔ Aufschlag umrechnen",
    formula: "Aufschlag = Spanne / (100 − Spanne) · 100   ·   Spanne = Aufschlag / (100 + Aufschlag) · 100",
    desc: "Beide Größen beschreiben dieselbe Differenz, nur mit anderer Bezugsbasis: die Spanne bezogen auf den Verkaufspreis, der Aufschlag auf den Einkaufspreis. Trage einen der beiden Werte ein.",
    inputs: [{ k: "spanne", label: "Handelsspanne", unit: "%", def: "" }, { k: "aufschlag", label: "oder Aufschlag", unit: "%", def: "" }],
    calc: (v) => {
      const sp = num(v.spanne);
      const auf = num(v.aufschlag);
      if (sp !== null && sp < 100) return [{ label: "entspricht Aufschlag", value: (sp / (100 - sp)) * 100, unit: "%", strong: true }];
      if (auf !== null && auf > -100) return [{ label: "entspricht Spanne", value: (auf / (100 + auf)) * 100, unit: "%", strong: true }];
      return null;
    },
  },
  {
    id: "kalkulationsfaktor", cat: "handel", sem: 1, name: "Kalkulationsfaktor",
    formula: "Faktor = Verkaufspreis (netto) / Einstandspreis",
    desc: "Schneller Daumenwert des Handels: Mit welchem Faktor wird der Einstandspreis multipliziert? Faktor 2 entspricht einer Spanne von 50 %.",
    inputs: [{ k: "vk", label: "Verkaufspreis (netto)", unit: "€" }, { k: "ep", label: "Einstandspreis", unit: "€" }],
    calc: (v) => (ok(v, ["vk", "ep"]) && num(v.ep) !== 0 ? num(v.vk) / num(v.ep) : null),
    out: { label: "Kalkulationsfaktor", unit: "×", dec: 2 },
  },
  {
    id: "rabatt-skonto", cat: "handel", sem: 1, name: "Rabatt & Skonto",
    formula: "Zieleinkaufspreis = Listenpreis − Rabatt   ·   Bareinkaufspreis = Zielpreis − Skonto",
    desc: "Die beiden Nachlässe werden nacheinander abgezogen, nicht addiert: Skonto wird vom bereits rabattierten Preis berechnet.",
    inputs: [{ k: "listen", label: "Listenpreis", unit: "€" }, { k: "rabatt", label: "Rabatt", unit: "%", def: "0" }, { k: "skonto", label: "Skonto", unit: "%", def: "0" }],
    calc: (v) => {
      if (!ok(v, ["listen"])) return null;
      const listen = num(v.listen);
      const rabattBetrag = (listen * (num(v.rabatt) || 0)) / 100;
      const ziel = listen - rabattBetrag;
      const skontoBetrag = (ziel * (num(v.skonto) || 0)) / 100;
      return [
        { label: "Rabattbetrag", value: rabattBetrag, unit: "€" },
        { label: "Zieleinkaufspreis", value: ziel, unit: "€", strong: true },
        { label: "Skontobetrag", value: skontoBetrag, unit: "€" },
        { label: "Bareinkaufspreis", value: ziel - skontoBetrag, unit: "€", strong: true },
      ];
    },
  },

  // ── Kosten & Break-even, Ergänzungen ──
  {
    id: "db-gesamt", cat: "kosten", sem: 2, name: "Deckungsbeitrag (gesamt)",
    formula: "DB = Umsatz − variable Kosten",
    desc: "Deckungsbeitrag der Periode. Erst wenn er die Fixkosten übersteigt, entsteht Gewinn: Gewinn = DB − Fixkosten.",
    inputs: [{ k: "umsatz", label: "Umsatz", unit: "€" }, { k: "kv", label: "variable Kosten", unit: "€" }],
    calc: (v) => (ok(v, ["umsatz", "kv"]) ? num(v.umsatz) - num(v.kv) : null),
    out: { label: "Deckungsbeitrag", unit: "€", dec: 2 },
  },
  {
    id: "db-quote", cat: "kosten", sem: 2, name: "Deckungsbeitragsquote",
    formula: "DB-Quote = Deckungsbeitrag / Umsatz · 100",
    desc: "Anteil des Umsatzes, der zur Deckung der Fixkosten bleibt. Basis für den Break-even-Umsatz.",
    inputs: [{ k: "db", label: "Deckungsbeitrag", unit: "€" }, { k: "umsatz", label: "Umsatz", unit: "€" }],
    calc: (v) => (ok(v, ["db", "umsatz"]) && num(v.umsatz) !== 0 ? (num(v.db) / num(v.umsatz)) * 100 : null),
    out: { label: "DB-Quote", unit: "%", dec: 2 },
  },
  {
    id: "zielgewinn-menge", cat: "kosten", sem: 2, name: "Menge für Zielgewinn",
    formula: "x = (Fixkosten + Zielgewinn) / Deckungsbeitrag je Stück",
    desc: "Absatzmenge, die nicht nur die Fixkosten deckt, sondern zusätzlich einen geplanten Gewinn erwirtschaftet.",
    inputs: [{ k: "fix", label: "Fixkosten", unit: "€" }, { k: "ziel", label: "Zielgewinn", unit: "€" }, { k: "db", label: "DB/Stück", unit: "€" }],
    calc: (v) => (ok(v, ["fix", "ziel", "db"]) && num(v.db) > 0 ? (num(v.fix) + num(v.ziel)) / num(v.db) : null),
    out: { label: "benötigte Menge", unit: "Stück", dec: 0 },
  },
  {
    id: "hoch-tief", cat: "kosten", sem: 2, name: "Hoch-Tief-Methode",
    formula: "kᵥ = (Kₘₐₓ − Kₘᵢₙ) / (xₘₐₓ − xₘᵢₙ)   ·   Kfix = Kₘₐₓ − kᵥ · xₘₐₓ",
    desc: "Zerlegt Mischkosten in einen variablen und einen fixen Anteil – anhand der Periode mit der höchsten und der mit der niedrigsten Beschäftigung.",
    inputs: [
      { k: "xmax", label: "Menge hoch" }, { k: "kmax", label: "Kosten hoch", unit: "€" },
      { k: "xmin", label: "Menge tief" }, { k: "kmin", label: "Kosten tief", unit: "€" },
    ],
    calc: (v) => {
      if (!ok(v, ["xmax", "kmax", "xmin", "kmin"])) return null;
      const dx = num(v.xmax) - num(v.xmin);
      if (dx === 0) return null;
      const kv = (num(v.kmax) - num(v.kmin)) / dx;
      return [
        { label: "variable Kosten/Stück", value: kv, unit: "€", strong: true },
        { label: "Fixkosten", value: num(v.kmax) - kv * num(v.xmax), unit: "€", strong: true },
      ];
    },
  },
  {
    id: "sicherheitskoeffizient", cat: "kosten", sem: 2, name: "Sicherheitskoeffizient",
    formula: "SK = (Istmenge − Break-even-Menge) / Istmenge · 100",
    desc: "Um wie viel Prozent darf der Absatz sinken, bevor Verlust entsteht? Je höher, desto robuster das Geschäft.",
    inputs: [{ k: "ist", label: "Istmenge", unit: "Stück" }, { k: "be", label: "Break-even-Menge", unit: "Stück" }],
    calc: (v) => (ok(v, ["ist", "be"]) && num(v.ist) !== 0 ? ((num(v.ist) - num(v.be)) / num(v.ist)) * 100 : null),
    out: { label: "Sicherheitskoeffizient", unit: "%", dec: 2 },
  },

  // ── Investition & Finanzierung, Ergänzungen ──
  {
    id: "kapitalwert-n", cat: "invest", sem: 3, name: "Kapitalwert (gleiche Rückflüsse)",
    formula: "C₀ = −I₀ + R · (qⁿ − 1) / (qⁿ · (q − 1))",
    desc: "Kapitalwert bei über n Jahre gleich hohen Rückflüssen (Rentenbarwertfaktor), q = 1 + i. Positiver Wert heißt: Die Investition lohnt sich gegenüber der Alternativanlage.",
    inputs: [{ k: "i0", label: "Anschaffung I₀", unit: "€" }, { k: "r", label: "Rückfluss pro Jahr", unit: "€" }, { k: "n", label: "Jahre" }, { k: "i", label: "Kalkulationszins", unit: "%" }],
    calc: (v) => {
      if (!ok(v, ["i0", "r", "n", "i"])) return null;
      const q = 1 + num(v.i) / 100;
      const n = num(v.n);
      if (q === 1 || n <= 0) return null;
      const rbf = (Math.pow(q, n) - 1) / (Math.pow(q, n) * (q - 1));
      return -num(v.i0) + num(v.r) * rbf;
    },
    out: { label: "Kapitalwert C₀", unit: "€", dec: 2 },
  },
  {
    id: "rentabilitaetsvergleich", cat: "invest", sem: 3, name: "Rentabilitätsvergleich",
    formula: "R = Ø Gewinn / Ø Kapitaleinsatz · 100,   Ø Kapitaleinsatz = (Anschaffung + Restwert) / 2",
    desc: "Statisches Verfahren der Investitionsrechnung: Verzinsung des durchschnittlich gebundenen Kapitals. Die Investition mit der höheren Rentabilität gewinnt.",
    inputs: [{ k: "gewinn", label: "Ø Gewinn/Jahr", unit: "€" }, { k: "ak", label: "Anschaffung", unit: "€" }, { k: "rw", label: "Restwert", unit: "€", def: "0" }],
    calc: (v) => {
      if (!ok(v, ["gewinn", "ak"])) return null;
      const kapital = (num(v.ak) + (num(v.rw) || 0)) / 2;
      return kapital !== 0 ? (num(v.gewinn) / kapital) * 100 : null;
    },
    out: { label: "Rentabilität", unit: "%", dec: 2 },
  },
  {
    id: "skonto-effektivzins", cat: "invest", sem: 3, name: "Effektivzins des Lieferantenkredits",
    formula: "p ≈ Skontosatz · 360 / (Zahlungsziel − Skontofrist)",
    desc: "Was kostet es, das Skonto verfallen zu lassen? Der Wert liegt meist weit über jedem Bankzins – deshalb lohnt sich Skontoziehen fast immer.",
    inputs: [{ k: "skonto", label: "Skontosatz", unit: "%" }, { k: "ziel", label: "Zahlungsziel", unit: "Tage" }, { k: "frist", label: "Skontofrist", unit: "Tage" }],
    calc: (v) => {
      if (!ok(v, ["skonto", "ziel", "frist"])) return null;
      const tage = num(v.ziel) - num(v.frist);
      return tage > 0 ? (num(v.skonto) * 360) / tage : null;
    },
    out: { label: "Effektivzins p.a.", unit: "%", dec: 2 },
  },
  {
    id: "kostenvergleich", cat: "invest", sem: 3, name: "Kritische Menge (Kostenvergleich)",
    formula: "xₖᵣᵢₜ = (Kfix,A − Kfix,B) / (kᵥ,B − kᵥ,A)",
    desc: "Ab welcher Menge lohnt sich die Anlage mit höheren Fixkosten, aber niedrigeren Stückkosten? Unterhalb der kritischen Menge ist die andere günstiger.",
    inputs: [
      { k: "fixa", label: "Fixkosten A", unit: "€" }, { k: "kva", label: "var. Kosten/Stück A", unit: "€" },
      { k: "fixb", label: "Fixkosten B", unit: "€" }, { k: "kvb", label: "var. Kosten/Stück B", unit: "€" },
    ],
    calc: (v) => {
      if (!ok(v, ["fixa", "kva", "fixb", "kvb"])) return null;
      const dkv = num(v.kvb) - num(v.kva);
      return dkv !== 0 ? (num(v.fixa) - num(v.fixb)) / dkv : null;
    },
    out: { label: "kritische Menge", unit: "Stück", dec: 0 },
  },

  // ── Material & Logistik, Ergänzungen ──
  {
    id: "lagerbestand-schnitt", cat: "logistik", sem: 4, name: "Ø Lagerbestand",
    formula: "Ø Lagerbestand = (Anfangsbestand + Endbestand) / 2",
    desc: "Einfacher Durchschnitt für die Lagerkennzahlen. Genauer wird es mit zwölf Monatsendbeständen: (AB + 12 Monatsbestände) / 13.",
    inputs: [{ k: "ab", label: "Anfangsbestand", unit: "€" }, { k: "eb", label: "Endbestand", unit: "€" }],
    calc: (v) => (ok(v, ["ab", "eb"]) ? (num(v.ab) + num(v.eb)) / 2 : null),
    out: { label: "Ø Lagerbestand", unit: "€", dec: 2 },
  },
  {
    id: "lagerzinssatz", cat: "logistik", sem: 4, name: "Lagerzinssatz",
    formula: "Lagerzinssatz = Jahreszinssatz · Ø Lagerdauer / 360",
    desc: "Zinssatz für das Kapital, das während der Lagerdauer im Bestand gebunden ist.",
    inputs: [{ k: "p", label: "Jahreszinssatz", unit: "%" }, { k: "dauer", label: "Ø Lagerdauer", unit: "Tage" }],
    calc: (v) => (ok(v, ["p", "dauer"]) ? (num(v.p) * num(v.dauer)) / 360 : null),
    out: { label: "Lagerzinssatz", unit: "%", dec: 3 },
  },
  {
    id: "lagerzinsen", cat: "logistik", sem: 4, name: "Lagerzinsen",
    formula: "Lagerzinsen = Ø Lagerbestand (Wert) · Lagerzinssatz / 100",
    desc: "Kosten der Kapitalbindung im Lager – ein wesentlicher Teil der Lagerhaltungskosten.",
    inputs: [{ k: "bestand", label: "Ø Lagerbestand", unit: "€" }, { k: "lzs", label: "Lagerzinssatz", unit: "%" }],
    calc: (v) => (ok(v, ["bestand", "lzs"]) ? (num(v.bestand) * num(v.lzs)) / 100 : null),
    out: { label: "Lagerzinsen", unit: "€", dec: 2 },
  },
  {
    id: "servicegrad", cat: "logistik", sem: 4, name: "Lieferbereitschaftsgrad",
    formula: "Servicegrad = sofort erfüllte Aufträge / Aufträge gesamt · 100",
    desc: "Anteil der Bestellungen, die direkt aus dem Lager bedient werden konnten. Ein hoher Servicegrad kostet Bestand.",
    inputs: [{ k: "erfuellt", label: "sofort erfüllte Aufträge" }, { k: "gesamt", label: "Aufträge gesamt" }],
    calc: (v) => (ok(v, ["erfuellt", "gesamt"]) && num(v.gesamt) !== 0 ? (num(v.erfuellt) / num(v.gesamt)) * 100 : null),
    out: { label: "Servicegrad", unit: "%", dec: 2 },
  },

  // ── E-Commerce-KPIs, Ergänzungen ──
  {
    id: "bounce", cat: "kpi", sem: 3, name: "Absprungrate (Bounce Rate)",
    formula: "Bounce Rate = Absprünge / Sitzungen · 100",
    desc: "Anteil der Besuche mit nur einer Seitenansicht ohne Interaktion. Hohe Werte deuten auf unpassenden Traffic oder eine schwache Landingpage.",
    inputs: [{ k: "bounces", label: "Absprünge" }, { k: "sessions", label: "Sitzungen" }],
    calc: (v) => (ok(v, ["bounces", "sessions"]) && num(v.sessions) !== 0 ? (num(v.bounces) / num(v.sessions)) * 100 : null),
    out: { label: "Absprungrate", unit: "%", dec: 2 },
  },
  {
    id: "cpc", cat: "kpi", sem: 3, name: "Kosten pro Klick (CPC)",
    formula: "CPC = Werbekosten / Klicks",
    desc: "Durchschnittspreis eines Klicks. Zusammen mit der Conversion Rate ergibt sich daraus, was eine Bestellung kostet.",
    inputs: [{ k: "kosten", label: "Werbekosten", unit: "€" }, { k: "klicks", label: "Klicks" }],
    calc: (v) => (ok(v, ["kosten", "klicks"]) && num(v.klicks) !== 0 ? num(v.kosten) / num(v.klicks) : null),
    out: { label: "CPC", unit: "€", dec: 2 },
  },
  {
    id: "cpm", cat: "kpi", sem: 3, name: "Tausenderkontaktpreis (TKP/CPM)",
    formula: "TKP = Werbekosten / Impressionen · 1000",
    desc: "Preis für tausend Einblendungen – die übliche Abrechnungsgröße bei Display- und Social-Werbung.",
    inputs: [{ k: "kosten", label: "Werbekosten", unit: "€" }, { k: "impressionen", label: "Impressionen" }],
    calc: (v) => (ok(v, ["kosten", "impressionen"]) && num(v.impressionen) !== 0 ? (num(v.kosten) / num(v.impressionen)) * 1000 : null),
    out: { label: "TKP", unit: "€", dec: 2 },
  },
  {
    id: "cpo", cat: "kpi", sem: 3, name: "Kosten pro Bestellung (CPO)",
    formula: "CPO = Werbekosten / Bestellungen",
    desc: "Was eine Bestellung an Werbebudget kostet. Sinnvoll nur im Vergleich mit dem Deckungsbeitrag je Bestellung.",
    inputs: [{ k: "kosten", label: "Werbekosten", unit: "€" }, { k: "bestellungen", label: "Bestellungen" }],
    calc: (v) => (ok(v, ["kosten", "bestellungen"]) && num(v.bestellungen) !== 0 ? num(v.kosten) / num(v.bestellungen) : null),
    out: { label: "CPO", unit: "€", dec: 2 },
  },
  {
    id: "wiederkaufrate", cat: "kpi", sem: 3, name: "Wiederkaufrate",
    formula: "Wiederkaufrate = Kunden mit ≥ 2 Bestellungen / Kunden gesamt · 100",
    desc: "Maß für Kundenbindung. Im CRM die Gegengröße zur Abwanderungsquote (Churn Rate = 100 − Wiederkaufrate).",
    inputs: [{ k: "wieder", label: "Wiederkäufer" }, { k: "gesamt", label: "Kunden gesamt" }],
    calc: (v) => (ok(v, ["wieder", "gesamt"]) && num(v.gesamt) !== 0 ? (num(v.wieder) / num(v.gesamt)) * 100 : null),
    out: { label: "Wiederkaufrate", unit: "%", dec: 2 },
  },

  // ── Statistik (Angewandte Statistik, Semester 3) ──
  {
    id: "median", cat: "statistik", sem: 3, name: "Median",
    formula: "x̃ = mittlerer Wert der geordneten Reihe",
    desc: "Teilt die sortierten Werte in zwei Hälften. Bei gerader Anzahl das Mittel der beiden mittleren Werte. Robuster gegen Ausreißer als das arithmetische Mittel.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte).sort((a, b) => a - b);
      if (!arr.length) return null;
      const m = Math.floor(arr.length / 2);
      return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
    },
    out: { label: "Median", unit: "", dec: 2 },
  },
  {
    id: "modus", cat: "statistik", sem: 3, name: "Modus (häufigster Wert)",
    formula: "x_mod = Wert mit der größten Häufigkeit",
    desc: "Der am häufigsten vorkommende Wert. Einziges Lagemaß, das auch für nominale Merkmale funktioniert.",
    inputs: [{ k: "werte", label: "Werte (z. B. 3; 5; 5; 8)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      if (!arr.length) return null;
      const zaehler = new Map();
      for (const x of arr) zaehler.set(x, (zaehler.get(x) || 0) + 1);
      let best = null;
      let max = 0;
      for (const [wert, n] of zaehler) if (n > max) { max = n; best = wert; }
      return best;
    },
    out: { label: "Modus", unit: "", dec: 2 },
  },
  {
    id: "spannweite", cat: "statistik", sem: 3, name: "Spannweite",
    formula: "R = xₘₐₓ − xₘᵢₙ",
    desc: "Einfachstes Streuungsmaß: Abstand zwischen größtem und kleinstem Wert. Sehr empfindlich gegenüber Ausreißern.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      return arr.length ? Math.max(...arr) - Math.min(...arr) : null;
    },
    out: { label: "Spannweite", unit: "", dec: 2 },
  },
  {
    id: "varianz", cat: "statistik", sem: 3, name: "Varianz",
    formula: "σ² = Σ(xᵢ − x̄)² / n",
    desc: "Mittlere quadratische Abweichung vom Mittelwert. Die Wurzel daraus ist die Standardabweichung.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      if (!arr.length) return null;
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      return arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
    },
    out: { label: "Varianz σ²", unit: "", dec: 3 },
  },
  {
    id: "variationskoeffizient", cat: "statistik", sem: 3, name: "Variationskoeffizient",
    formula: "VK = σ / x̄ · 100",
    desc: "Streuung im Verhältnis zum Mittelwert – dadurch lassen sich Reihen mit ganz unterschiedlichen Größenordnungen vergleichen.",
    inputs: [{ k: "werte", label: "Werte (z. B. 12; 15; 9)", free: true }],
    calc: (v) => {
      const arr = list(v.werte);
      if (!arr.length) return null;
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      if (m === 0) return null;
      const sd = Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
      return (sd / m) * 100;
    },
    out: { label: "Variationskoeffizient", unit: "%", dec: 2 },
  },
  {
    id: "gewichtetes-mittel", cat: "statistik", sem: 3, name: "Gewichtetes Mittel",
    formula: "x̄ = Σ(xᵢ · gᵢ) / Σgᵢ",
    desc: "Durchschnitt mit unterschiedlich schweren Werten – etwa eine Note aus Teilleistungen mit verschiedenen Anteilen.",
    inputs: [{ k: "werte", label: "Werte (z. B. 2,0; 1,7)", free: true }, { k: "gewichte", label: "Gewichte (z. B. 3; 1)", free: true }],
    calc: (v) => {
      const x = list(v.werte);
      const g = list(v.gewichte);
      const n = Math.min(x.length, g.length);
      if (n === 0) return null;
      let summe = 0;
      let gew = 0;
      for (let i = 0; i < n; i++) { summe += x[i] * g[i]; gew += g[i]; }
      return gew !== 0 ? summe / gew : null;
    },
    out: { label: "gewichtetes Mittel", unit: "", dec: 3 },
  },
  {
    id: "laplace", cat: "statistik", sem: 3, name: "Laplace-Wahrscheinlichkeit",
    formula: "P(A) = günstige Fälle / mögliche Fälle",
    desc: "Gilt, wenn alle Ergebnisse gleich wahrscheinlich sind (Würfel, Los, Karte). Ergebnis immer zwischen 0 und 1.",
    inputs: [{ k: "guenstig", label: "günstige Fälle" }, { k: "moeglich", label: "mögliche Fälle" }],
    calc: (v) => (ok(v, ["guenstig", "moeglich"]) && num(v.moeglich) !== 0 ? (num(v.guenstig) / num(v.moeglich)) * 100 : null),
    out: { label: "Wahrscheinlichkeit", unit: "%", dec: 2 },
  },
  {
    id: "binomial", cat: "statistik", sem: 3, name: "Binomialverteilung P(X = k)",
    formula: "P(X = k) = C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ",
    desc: "Wahrscheinlichkeit für genau k Treffer bei n unabhängigen Versuchen mit Trefferwahrscheinlichkeit p (Bernoulli-Kette).",
    inputs: [{ k: "n", label: "Versuche n" }, { k: "k", label: "Treffer k" }, { k: "p", label: "Trefferwahrsch. p", unit: "%" }],
    calc: (v) => {
      if (!ok(v, ["n", "k", "p"])) return null;
      const n = Math.round(num(v.n));
      const k = Math.round(num(v.k));
      const p = num(v.p) / 100;
      if (n < 0 || k < 0 || k > n || p < 0 || p > 1) return null;
      return binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k) * 100;
    },
    out: { label: "P(X = k)", unit: "%", dec: 3 },
  },
  {
    id: "binomial-kennwerte", cat: "statistik", sem: 3, name: "Erwartungswert & Streuung (Binomial)",
    formula: "E(X) = n · p   ·   σ = √( n · p · (1 − p) )",
    desc: "Lage und Streuung einer Bernoulli-Kette, ohne jede Einzelwahrscheinlichkeit zu berechnen.",
    inputs: [{ k: "n", label: "Versuche n" }, { k: "p", label: "Trefferwahrsch. p", unit: "%" }],
    calc: (v) => {
      if (!ok(v, ["n", "p"])) return null;
      const n = num(v.n);
      const p = num(v.p) / 100;
      if (p < 0 || p > 1) return null;
      return [
        { label: "Erwartungswert E(X)", value: n * p, unit: "", strong: true },
        { label: "Standardabweichung σ", value: Math.sqrt(n * p * (1 - p)), unit: "", dec: 3 },
      ];
    },
  },
  {
    id: "z-wert", cat: "statistik", sem: 3, name: "z-Wert (Standardisierung)",
    formula: "z = (x − μ) / σ",
    desc: "Wie viele Standardabweichungen liegt ein Wert vom Mittelwert entfernt? Voraussetzung, um in der Normalverteilungstabelle nachzuschlagen.",
    inputs: [{ k: "x", label: "Wert x" }, { k: "mu", label: "Mittelwert μ" }, { k: "sigma", label: "Standardabw. σ" }],
    calc: (v) => (ok(v, ["x", "mu", "sigma"]) && num(v.sigma) !== 0 ? (num(v.x) - num(v.mu)) / num(v.sigma) : null),
    out: { label: "z-Wert", unit: "", dec: 3 },
  },
  {
    id: "korrelation", cat: "statistik", sem: 3, name: "Korrelationskoeffizient (Pearson)",
    formula: "r = Σ(xᵢ − x̄)(yᵢ − ȳ) / √( Σ(xᵢ − x̄)² · Σ(yᵢ − ȳ)² )",
    desc: "Stärke und Richtung des linearen Zusammenhangs zweier Merkmale, immer zwischen −1 und +1. Korrelation ist keine Kausalität.",
    inputs: [{ k: "x", label: "x-Werte", free: true }, { k: "y", label: "y-Werte", free: true }],
    calc: (v) => {
      const xs = list(v.x);
      const ys = list(v.y);
      const n = Math.min(xs.length, ys.length);
      if (n < 2) return null;
      const mx = xs.slice(0, n).reduce((s, a) => s + a, 0) / n;
      const my = ys.slice(0, n).reduce((s, a) => s + a, 0) / n;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx;
        const dy = ys[i] - my;
        sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
      }
      const nenner = Math.sqrt(sxx * syy);
      return nenner !== 0 ? sxy / nenner : null;
    },
    out: { label: "Korrelation r", unit: "", dec: 4 },
  },
  {
    id: "regression", cat: "statistik", sem: 3, name: "Lineare Regression",
    formula: "y = a + b · x,   b = Σ(xᵢ − x̄)(yᵢ − ȳ) / Σ(xᵢ − x̄)²,   a = ȳ − b · x̄",
    desc: "Regressionsgerade nach der Methode der kleinsten Quadrate. b ist die Steigung, a der Achsenabschnitt.",
    inputs: [{ k: "x", label: "x-Werte", free: true }, { k: "y", label: "y-Werte", free: true }],
    calc: (v) => {
      const xs = list(v.x);
      const ys = list(v.y);
      const n = Math.min(xs.length, ys.length);
      if (n < 2) return null;
      const mx = xs.slice(0, n).reduce((s, a) => s + a, 0) / n;
      const my = ys.slice(0, n).reduce((s, a) => s + a, 0) / n;
      let sxy = 0;
      let sxx = 0;
      for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
      if (sxx === 0) return null;
      const b = sxy / sxx;
      return [
        { label: "Steigung b", value: b, unit: "", dec: 4, strong: true },
        { label: "Achsenabschnitt a", value: my - b * mx, unit: "", dec: 4, strong: true },
      ];
    },
  },
];
