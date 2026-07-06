import { describe, expect, it } from "vitest";
import { isMistakeDue, mistakeBox, reviewMistake, splitMistakes } from "../mistakes.js";
import { MISTAKE_MAX_BOX } from "../../constants/config.js";
import { addDaysISO, todayISO } from "../dates.js";

describe("mistakes (Leitner-Fehlerkartei)", () => {
  it("bildet Alt-Einträge (streak) auf Boxen ab", () => {
    expect(mistakeBox({})).toBe(1);
    expect(mistakeBox({ streak: 1 })).toBe(2);
    expect(mistakeBox({ box: 3 })).toBe(3);
    expect(mistakeBox({ box: 99 })).toBe(MISTAKE_MAX_BOX);
  });

  it("Fälligkeit: ohne due-Datum sofort, sonst ab Stichtag", () => {
    expect(isMistakeDue({ misses: 2 })).toBe(true);
    expect(isMistakeDue({ due: todayISO() })).toBe(true);
    expect(isMistakeDue({ due: addDaysISO(-2) })).toBe(true);
    expect(isMistakeDue({ due: addDaysISO(1) })).toBe(false);
  });

  it("richtig → Box +1 mit Wartezeit, oberste Stufe bestanden → gemeistert", () => {
    expect(reviewMistake({ box: 1 }, true)).toEqual({ mastered: false, box: 2, due: addDaysISO(1) });
    expect(reviewMistake({ box: 2 }, true)).toEqual({ mastered: false, box: 3, due: addDaysISO(3) });
    expect(reviewMistake({ box: MISTAKE_MAX_BOX }, true)).toEqual({ mastered: true });
  });

  it("Alt-Eintrag mit streak 1 steigt korrekt weiter (Box 2 → 3)", () => {
    expect(reviewMistake({ streak: 1 }, true)).toEqual({ mastered: false, box: 3, due: addDaysISO(3) });
  });

  it("falsch → zurück auf Box 1, sofort fällig", () => {
    expect(reviewMistake({ box: 3 }, false)).toEqual({ mastered: false, box: 1, due: todayISO() });
    expect(reviewMistake(undefined, false)).toEqual({ mastered: false, box: 1, due: todayISO() });
  });

  it("teilt in fällig/wartend und sortiert schwächste bzw. nächste zuerst", () => {
    const pool = {
      a: { box: 2, due: todayISO(), misses: 1 },
      b: { box: 1, due: todayISO(), misses: 5 },
      c: { box: 1, due: todayISO(), misses: 9 },
      d: { box: 2, due: addDaysISO(3), misses: 1 },
      e: { box: 3, due: addDaysISO(1), misses: 1 },
    };
    const { due, waiting } = splitMistakes(pool);
    expect(due.map((x) => x.key)).toEqual(["c", "b", "a"]);
    expect(waiting.map((x) => x.key)).toEqual(["e", "d"]);
  });
});
