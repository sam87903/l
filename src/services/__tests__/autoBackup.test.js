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
});
