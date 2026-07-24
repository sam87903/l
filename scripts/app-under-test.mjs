/**
 * Gemeinsame Quelle für „welche Datei testen die Smoke-Läufe?".
 *
 * Bewusst der frische Build (dist-single/index.html) und nicht die zuletzt
 * ausgelieferte Datei in release/: Die kann älter sein als der Quellcode –
 * dann melden die Tests einen alten Stand grün und echte Regressionen (oder
 * echte Fixes) bleiben unsichtbar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BUILT = path.join(ROOT, "dist-single/index.html");

/** Pfad zur zu testenden HTML-Datei als file://-URL. Bricht ab, wenn ungebaut. */
export function appUnderTest() {
  if (!fs.existsSync(BUILT)) {
    console.error("❌ dist-single/index.html fehlt – zuerst `npm run build:single` ausführen.");
    process.exit(1);
  }
  return "file://" + BUILT;
}
