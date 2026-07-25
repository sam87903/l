/** Bewertung von Quiz-Ergebnissen. */

/**
 * Ist das neue Ergebnis besser als der gespeicherte Bestwert?
 *
 * Verglichen wird die Quote, nicht die rohe Trefferzahl: Wächst ein
 * Fragensatz später an, wären sonst 8/10 „besser" als 5/5, und ein
 * fehlerfreies Ergebnis würde von einem schlechteren überschrieben.
 * Bei gleicher Quote gewinnt der größere Fragensatz – 10/10 ist die
 * stärkere Leistung als 5/5.
 */
export function isBetterScore(prev, correct, total) {
  if (!total || total <= 0) return false;
  if (!prev) return true;
  if (!prev.t || prev.t <= 0) return correct > (prev.c ?? 0);
  const prevRatio = prev.c / prev.t;
  const nextRatio = correct / total;
  if (nextRatio !== prevRatio) return nextRatio > prevRatio;
  return total > prev.t;
}
