/**
 * Formelsammlung & Rechner – ausgerichtet am Lehrplan des B.Sc. E-Commerce.
 * Jede Formel: Anzeige-Formel, Erklärung, Semester-Bezug und – wo sinnvoll –
 * ein interaktiver Rechner (`inputs` + `calc`). `calc` liefert entweder eine
 * Zahl oder ein Array von Ergebniszeilen (mehrstufige Kalkulation).
 *
 * Formeln mit gängigen Quellen abgeglichen (BWL-Kennzahlen, Handelskalkulation,
 * Andler-Formel, Investitionsrechnung, E-Commerce-KPIs).
 */

const num = (v) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
/** Alle Pflicht-Eingaben vorhanden und Zahl? */
const ok = (v, keys) => keys.every((k) => num(v[k]) !== null);

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
      const arr = String(v.werte || "").split(/[;,\s]+/).map((x) => Number(x.replace(",", "."))).filter((x) => Number.isFinite(x));
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
      const arr = String(v.werte || "").split(/[;,\s]+/).map((x) => Number(x.replace(",", "."))).filter((x) => Number.isFinite(x));
      if (!arr.length) return null;
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
    },
    out: { label: "Standardabweichung σ", unit: "", dec: 3 },
  },
];
