import { beforeEach, describe, expect, it } from "vitest";
import { pushAutoBackup, readAutoBackups } from "../autoBackup.js";

describe("autoBackup", () => {
  beforeEach(() => localStorage.clear());

  it("rotiert und behält maximal 3 Versionen (älteste fällt raus)", async () => {
    for (let i = 1; i <= 5; i++) await pushAutoBackup({ marker: i });
    const list = await readAutoBackups();
    expect(list).toHaveLength(3);
    expect(list[0].data.marker).toBe(5); // neueste zuerst
    expect(list[2].data.marker).toBe(3); // 1 und 2 gelöscht
  });

  it("überspringt identische Folge-Snapshots", async () => {
    await pushAutoBackup({ a: 1 });
    await pushAutoBackup({ a: 1 });
    const list = await readAutoBackups();
    expect(list).toHaveLength(1);
  });

  it("lässt Klausur-Volltexte weg, sobald der Snapshot zu groß wird", async () => {
    const riesig = "x".repeat(200000);
    await pushAutoBackup({
      doneDays: { 1: true },
      exams: [
        { id: "a", name: "Klausur A", addedAt: "2026-01-01", text: riesig },
        { id: "b", name: "Klausur B", addedAt: "2026-01-02", text: riesig },
      ],
    });
    const [entry] = await readAutoBackups();
    expect(entry.slim).toBe(true);
    expect(entry.data.exams.map((e) => e.text)).toEqual(["", ""]);
    // Namen bleiben erhalten – man sieht, was fehlt
    expect(entry.data.exams[0].name).toBe("Klausur A");
    // Der Lernfortschritt bleibt immer vollständig
    expect(entry.data.doneDays).toEqual({ 1: true });
    expect(JSON.stringify(entry).length).toBeLessThan(5000);
  });

  it("behält kleine Snapshots vollständig inklusive Klausurtext", async () => {
    await pushAutoBackup({ exams: [{ id: "a", name: "Klein", text: "kurzer Text" }] });
    const [entry] = await readAutoBackups();
    expect(entry.slim).toBeUndefined();
    expect(entry.data.exams[0].text).toBe("kurzer Text");
  });
});
