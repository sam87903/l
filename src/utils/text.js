/** Textvergleich für die deutsche Suche. */

/**
 * Vereinheitlicht einen Text für den Vergleich: Kleinschreibung, Umlaute auf
 * den Grundbuchstaben (ö → o), ß → ss, sonstige Akzente entfernt.
 */
export function fold(text) {
  return String(text)
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Zusätzlich die Umschreibungen ae/oe/ue zusammenziehen. */
const loose = (text) => fold(text).replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");

/**
 * Enthält `haystack` die Suche `needle`? Unempfindlich gegen Umlaute in
 * beide Richtungen: „okonomie" und „oekonomie" finden beide „Ökonomie".
 *
 * Auf einer Handytastatur wird der Umlaut unterwegs gern weggelassen – ohne
 * diese Toleranz liefert die Suche dann einfach nichts, obwohl der Begriff
 * im Glossar steht.
 */
export function matches(haystack, needle) {
  if (!needle) return true;
  const h = fold(haystack);
  const n = fold(needle);
  if (h.includes(n)) return true;
  return loose(haystack).includes(loose(needle));
}
