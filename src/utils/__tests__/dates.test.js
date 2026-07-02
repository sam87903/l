import { describe, expect, it } from "vitest";
import { dayNum, daysUntil, fmtDate, todayPlanDay, toLocalISO } from "../dates.js";

describe("dates", () => {
  it("formatiert Plan-Daten mit Offset", () => {
    expect(fmtDate("2026-07-10", 0)).toBe("10.07.");
    expect(fmtDate("2026-07-10", 21)).toBe("31.07.");
    expect(fmtDate("ungültig", 3)).toBe("");
  });

  it("berechnet Tage bis zu einem Datum", () => {
    expect(daysUntil(toLocalISO(new Date()))).toBe(0);
    expect(daysUntil("kein-datum")).toBeNull();
  });

  it("liefert den heutigen Plan-Tag nur im Planfenster", () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 4); // Tag 5
    expect(todayPlanDay(toLocalISO(start), 21)).toBe(5);
    const future = new Date(today);
    future.setDate(future.getDate() + 3);
    expect(todayPlanDay(toLocalISO(future), 21)).toBeNull();
  });

  it("padded Tagesnummern", () => {
    expect(dayNum(3)).toBe("03");
    expect(dayNum(21)).toBe("21");
  });
});
