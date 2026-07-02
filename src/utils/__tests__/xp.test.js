import { describe, expect, it } from "vitest";
import { computeStreak, computeXp, levelInfo } from "../xp.js";
import { toLocalISO } from "../dates.js";

describe("xp", () => {
  it("berechnet XP nach den Regeln", () => {
    const xp = computeXp({ doneCount: 2, knownTotal: 3, quizzesPerfect: 1, focusTotal: 10, favCount: 2 });
    expect(xp).toBe(2 * 50 + 3 * 10 + 100 + 10 * 2 + 2 * 5);
  });

  it("steigt im Level mit wachsendem XP", () => {
    expect(levelInfo(0).level).toBe(1);
    const higher = levelInfo(1000);
    expect(higher.level).toBeGreaterThan(1);
    expect(higher.xpInLevel).toBeLessThan(higher.xpForNext);
  });

  it("zählt Streaks inklusive gestern-Toleranz", () => {
    const today = new Date();
    const iso = (offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      return toLocalISO(d);
    };
    expect(computeStreak({ [iso(0)]: 20, [iso(1)]: 5, [iso(2)]: 10 })).toBe(3);
    expect(computeStreak({ [iso(1)]: 5 })).toBe(1); // heute noch nichts gelernt
    expect(computeStreak({})).toBe(0);
  });
});
