/**
 * Formeln lesbar setzen.
 *
 * Lange Formeln liefen bisher als ein Block durch und brachen dort um, wo
 * die Zeile zufällig endete – „Listen-EK − Rabatt − Skonto + / Bezugskosten
 * = Einstandspreis → + / Handlungskosten + Gewinn → VK". Damit war nicht
 * mehr zu erkennen, was zusammengehört. Hier wird an den fachlich
 * sinnvollen Stellen umbrochen.
 */

/**
 * Zerlegt eine Formel in Zeilen:
 * - Jede Stufe einer Kalkulationsleiter (→) beginnt eine neue Zeile, der
 *   Pfeil bleibt als Marker am Zeilenanfang stehen.
 * - Mehrere eigenständige Gleichungen in einer Formel (durch weite
 *   Abstände getrennt) bekommen je eine eigene Zeile.
 *
 * @param {string} formula
 * @returns {string[]} mindestens eine Zeile
 */
export function formulaLines(formula) {
  const text = String(formula ?? "").trim();
  if (!text) return [];

  // Eigenständige Gleichungen: „A = 1   ·   B = 2" (weiter Abstand ums ·)
  const parts = text.split(/\s{2,}·\s{2,}/);

  const lines = [];
  for (const part of parts) {
    const steps = part.split(/\s*→\s*/);
    steps.forEach((step, i) => {
      const clean = step.trim();
      if (!clean) return;
      lines.push(i === 0 ? clean : `→ ${clean}`);
    });
  }
  return lines.length > 0 ? lines : [text];
}

/** Hat die Formel mehrere Stufen/Gleichungen? Dann darf sie mehr Raum haben. */
export const isMultiStep = (formula) => formulaLines(formula).length > 1;
