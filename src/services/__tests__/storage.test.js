import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStorageError, onStorageError, storage } from "../storage.js";

/** Quota-Fehler nachstellen, wie ihn Browser bei vollem Speicher werfen. */
const quotaError = () => {
  const err = new Error("voll");
  err.name = "QuotaExceededError";
  return err;
};

describe("storage: Schreibfehler bleiben nicht unbemerkt", () => {
  beforeEach(() => localStorage.clear());
  afterEach(async () => {
    vi.restoreAllMocks();
    await storage.set("reset", "1"); // Fehlerzustand wieder aufheben
  });

  it("meldet Erfolg beim Schreiben", async () => {
    expect(await storage.set("k", "v")).toBe(true);
    expect(getStorageError()).toBe(null);
  });

  it("meldet false und den Grund, wenn der Speicher voll ist", async () => {
    const seen = [];
    const off = onStorageError((kind) => seen.push(kind));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quotaError();
    });

    expect(await storage.set("k", "v")).toBe(false);
    expect(getStorageError()).toBe("quota");
    expect(seen).toEqual(["quota"]);
    off();
  });

  it("unterscheidet blockierten Speicher (privater Modus) vom vollen", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    await storage.set("k", "v");
    expect(getStorageError()).toBe("blocked");
  });

  it("hebt den Fehler auf, sobald wieder geschrieben werden kann", async () => {
    const seen = [];
    const off = onStorageError((kind) => seen.push(kind));
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quotaError();
    });
    await storage.set("k", "v");
    expect(getStorageError()).toBe("quota");

    spy.mockRestore();
    await storage.set("k", "v");
    expect(getStorageError()).toBe(null);
    expect(seen).toEqual(["quota", null]);
    off();
  });

  it("meldet denselben Fehler nicht wiederholt", async () => {
    const seen = [];
    const off = onStorageError((kind) => seen.push(kind));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quotaError();
    });
    await storage.set("a", "1");
    await storage.set("b", "2");
    await storage.set("c", "3");
    expect(seen).toEqual(["quota"]);
    off();
  });
});
