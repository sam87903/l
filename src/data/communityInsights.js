/**
 * Community Insights – kuratierte Erfahrungswerte.
 *
 * WICHTIG (Ehrlichkeit): Die App läuft komplett lokal, es gibt keine echten
 * Nutzerdaten. Die Prozentwerte sind redaktionelle Schätzungen, wie häufig
 * ein Thema in typischen Klausuren dieses Studiengangs vorkommt – abgeleitet
 * aus recherchierten Altklausuren, Modulhandbuch-Schwerpunkten und
 * Übungsklausuren. Sie werden im UI immer als Schätzung gekennzeichnet und
 * nie mit den echten Werten aus den eigenen Klausuren vermischt.
 */
export const INSIGHTS_LABEL =
  "redaktionelle Schätzung, basierend auf typischen Klausuren dieses Studiengangs – keine echten Nutzerdaten";

/** Begriff (Glossar-Schreibweise) → geschätzte Klausur-Häufigkeit in %. */
export const CURATED_INSIGHTS = {
  // Grundlagen E-Commerce
  "Netzeffekte": 83,
  "Kritische Masse": 78,
  "E-Marketplace": 74,
  "E-Shop": 70,
  "Betreiber-Modell": 66,
  "Dienstleister-Modell": 58,
  "Partner-Modell": 55,
  "Chicken-and-Egg-Problem": 45,
  "Application Service Providing": 40,
  // Online-Marketing
  "Customer Journey": 71,
  "SEO": 68,
  "Conversion": 65,
  "SEA": 62,
  "Affiliate-Marketing": 57,
  "Permission Marketing": 54,
  "Double Opt-In": 48,
  // Geschäftsmodelle & Plattformen
  "Long Tail": 64,
  "Plattformökonomie": 60,
  "Pure Player": 49,
  // BWL, Investition & Finanzierung
  "Kapitalwert": 72,
  "ROI": 69,
  "Amortisation": 46,
  // Datenbanken
  "ER-Modell": 74,
  "Normalisierung": 66,
  "Primärschlüssel": 62,
  "Fremdschlüssel": 55,
  "Referenzielle Integrität": 44,
  // Statistik
  "Normalverteilung": 70,
  "Standardabweichung": 66,
  "Hypothesentest": 58,
  "Korrelation": 54,
  "Regression": 52,
  "Konfidenzintervall": 47,
  // Softwaretechnik
  "UML": 68,
  "Klassendiagramm": 62,
  "Use-Case-Diagramm": 55,
  "Entwurfsmuster": 48,
  "Wasserfallmodell": 45,
  // Operations & Supply Chain
  "Bullwhip-Effekt": 63,
  "Just-in-Time": 58,
  "ABC-Analyse": 56,
  "Kanban": 50,
  "Sicherheitsbestand": 44,
  // Webtechnologien
  "HTML": 55,
  "REST": 48,
  "JSON": 42,
  // Entrepreneurship
  "MVP": 52,
  "Venture Capital": 46,
  "Business Angel": 40,
  // Handel & Programmierung
  "Absatzkanal": 48,
  "Handelsmarke": 44,
  "Algorithmus": 60,
  "Array": 45,
};

const BY_LOWER = new Map(
  Object.entries(CURATED_INSIGHTS).map(([term, pct]) => [term.toLowerCase(), pct])
);

/** Kuratierter Erfahrungswert eines Begriffs (case-insensitiv) oder null. */
export const insightFor = (term = "") => BY_LOWER.get(term.toLowerCase()) ?? null;
