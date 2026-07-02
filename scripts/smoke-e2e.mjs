/**
 * E2E-Smoke-Test der Single-File-Version in echtem Chromium (file://).
 * Aufruf: node scripts/smoke-e2e.mjs [chromium-binary]
 */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = process.argv[2] ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

const t0 = Date.now();
await page.goto("file://" + path.join(root, "release/marokko-lernplan-app.html"));
await page.waitForSelector("text=Salam, bereit zu lernen?", { timeout: 20000 });
console.log(`✅ Dashboard sichtbar nach ${Date.now() - t0} ms`);

for (const [label, marker] of [
  ["Plan", "21-Tage-Plan"],
  ["Semester", "Gesamtes Curriculum"],
  ["Glossar", "Fachbegriffe von A bis Z"],
  ["Statistik", "Lernfortschritt im Überblick"],
]) {
  await page.click(`nav >> text=${label}`);
  await page.waitForSelector(`text=${marker}`, { timeout: 8000 });
  console.log(`✅ ${label} rendert`);
}

await page.click("nav >> text=Plan");
await page.click('[aria-label="Tag 1 als erledigt markieren"]');
await page.click("nav >> text=Start");
await page.waitForSelector("text=1/21", { timeout: 5000 });
console.log("✅ Abhaken + Statistik funktioniert");

if (errors.length) {
  console.error("⚠️ JS-Fehler:", errors.slice(0, 5));
  process.exit(1);
}
console.log("✅ Keine JS-Fehler");
await browser.close();
