/** Datums-Helfer – alle Berechnungen in lokaler Zeit (keine UTC-Verschiebung). */

export function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayISO = () => toLocalISO(new Date());

export function fmtDate(iso, offsetDays) {
  try {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

/** Tage bis zu einem ISO-Datum (negativ = vergangen), null bei ungültig. */
export function daysUntil(iso) {
  try {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(iso);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  } catch {
    return null;
  }
}

/** Aktueller Plan-Tag (1..totalDays) relativ zum Startdatum, sonst null. */
export function todayPlanDay(startIso, totalDays) {
  try {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const s = new Date(startIso);
    if (isNaN(s)) return null;
    s.setHours(0, 0, 0, 0);
    const diff = Math.floor((t - s) / 86400000) + 1;
    return diff >= 1 && diff <= totalDays ? diff : null;
  } catch {
    return null;
  }
}

export const dayNum = (n) => String(n).padStart(2, "0");
