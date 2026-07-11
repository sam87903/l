import { describe, expect, it } from "vitest";
import { CATS, MODS, RES } from "../resources.js";

const MOD_IDS = new Set(MODS.map((m) => m.id));
const CAT_IDS = new Set(CATS.map((c) => c.id));

describe("resources – Datenintegrität", () => {
  it("jedes Modul trägt Semester (0–5) und vollen Namen", () => {
    for (const mod of MODS) {
      expect(Number.isInteger(mod.sem) && mod.sem >= 0 && mod.sem <= 5, mod.id).toBe(true);
      expect(typeof mod.name === "string" && mod.name.length > 3, mod.id).toBe(true);
    }
  });

  it("jeder Eintrag verweist auf existierendes Modul und Kategorie", () => {
    for (const r of RES) {
      expect(MOD_IDS.has(r.mod), `Modul ${r.mod} fehlt (${r.l})`).toBe(true);
      expect(CAT_IDS.has(r.cat), `Kategorie ${r.cat} fehlt (${r.l})`).toBe(true);
      expect(r.l.length).toBeGreaterThan(3);
      expect(r.u).toMatch(/^https:\/\//);
    }
  });

  it("jedes Inhaltsmodul (außer Allgemein) hat mindestens ein Lernvideo", () => {
    const withVideo = new Set(RES.filter((r) => r.cat === "video").map((r) => r.mod));
    for (const mod of MODS) {
      if (mod.id === "ALL") continue;
      expect(withVideo.has(mod.id), `${mod.id} (${mod.name}) ohne Video`).toBe(true);
    }
  });

  it("jedes neue Modul startet mit einem Einführungs-Video", () => {
    const introMods = new Set(
      RES.filter((r) => r.cat === "video" && r.l.startsWith("▶")).map((r) => r.mod)
    );
    // alle Module ab Semester 2 (die neuen Gruppen) haben eine ▶-Einführung
    for (const mod of MODS) {
      if (["BWL", "HBL", "ECM", "GIP", "ALL"].includes(mod.id)) continue;
      expect(introMods.has(mod.id), `${mod.id} ohne ▶ Einführung`).toBe(true);
    }
  });

  it("keine doppelten Links innerhalb eines Moduls und einer Kategorie", () => {
    const seen = new Set();
    for (const r of RES) {
      const key = `${r.cat}|${r.mod}|${r.l}`;
      expect(seen.has(key), `Duplikat: ${key}`).toBe(false);
      seen.add(key);
    }
  });
});
