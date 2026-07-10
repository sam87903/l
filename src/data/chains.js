/**
 * Lernketten: kuratierte, aufeinander aufbauende Modul-Reihenfolgen
 * („Chain-Learning"). Wer die Kette der Reihe nach lernt, hat für jedes
 * Folge-Modul das nötige Vorwissen. Schritt-IDs müssen in SEMESTERS
 * existieren (per Daten-Test abgesichert).
 */
export const CHAINS = [
  {
    id: "bwl",
    icon: "🏢",
    name: "BWL-Kette",
    desc: "Grundlagen BWL → Vertiefung → ROI & Kapitalwert → Business Planning",
    steps: ["s1-bwl", "s3-bwl2", "s3-bwl6", "s4-ent"],
  },
  {
    id: "ecom",
    icon: "🛒",
    name: "E-Commerce-Kette",
    desc: "Grundlagen E-Commerce → Marketing → CRM → Geschäftsmodelle",
    steps: ["s1-ecm", "s2-mkt", "s3-crm", "s5-ebm"],
  },
  {
    id: "tech",
    icon: "💻",
    name: "Technik-Kette",
    desc: "Programmierung → Datenbanken → Softwaretechnik → App-Entwicklung",
    steps: ["s1-gip", "s2-dat", "s3-swt", "s4-app"],
  },
  {
    id: "ops",
    icon: "📦",
    name: "Handel & Logistik",
    desc: "Handel → Prozessmanagement → Operations & SCM → Supply Chain Vertiefung",
    steps: ["s1-hbl", "s2-pme", "s4-oscm", "s5-scsm"],
  },
];
