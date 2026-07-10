import { describe, expect, it } from "vitest";
import { CHAINS } from "../chains.js";
import { SEMESTERS } from "../semesters/index.js";

const MODULE_IDS = new Set(SEMESTERS.flatMap((s) => s.modules.map((m) => m.id)));

describe("chains – Datenintegrität", () => {
  it("jede Schritt-ID existiert im Curriculum", () => {
    for (const chain of CHAINS) {
      for (const step of chain.steps) {
        expect(MODULE_IDS.has(step), `${chain.id}: ${step} fehlt in SEMESTERS`).toBe(true);
      }
    }
  });

  it("Ketten sind aufsteigend nach Semester sortiert (aufeinander aufbauend)", () => {
    const semOf = new Map(SEMESTERS.flatMap((s) => s.modules.map((m) => [m.id, s.nr])));
    for (const chain of CHAINS) {
      for (let i = 1; i < chain.steps.length; i++) {
        expect(
          semOf.get(chain.steps[i - 1]),
          `${chain.id}: ${chain.steps[i - 1]} → ${chain.steps[i]}`
        ).toBeLessThanOrEqual(semOf.get(chain.steps[i]));
      }
    }
  });

  it("keine doppelten Schritte innerhalb einer Kette", () => {
    for (const chain of CHAINS) {
      expect(new Set(chain.steps).size).toBe(chain.steps.length);
    }
  });
});
