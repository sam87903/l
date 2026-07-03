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
  ["Klausuren", "Altklausuren analysieren"],
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

// Fehler-Training: Quiz absichtlich falsch beantworten → Frage landet im Trainer
await page.click("nav >> text=Plan");
await page.click('#quiz-verzeichnis >> text=Quiz-Verzeichnis');
await page.click('#quiz-verzeichnis >> text=Einführung in die BWL');
await page.waitForSelector("text=Was besagt das Minimalprinzip?");
// Frage 1 falsch, 2 & 3 richtig beantworten
await page.click('button:has-text("Immer die billigste Option wählen")');
await page.click('button:has-text("GbR")');
await page.click('button:has-text("Soll")');
await page.waitForSelector("text=Lernanalyse");
await page.waitForSelector("text=Du hast Probleme mit");
console.log("✅ Lernanalyse nach Quiz erscheint");
await page.click('button:has-text("Fehler üben")');
await page.waitForSelector("#fehler-training >> text=1 offen");
await page.waitForSelector("#fehler-training >> text=Was besagt das Minimalprinzip?");
// 2× richtig = gemeistert (nach der 2. Antwort verschwindet der Trainer-Inhalt sofort)
await page.click('#fehler-training button:has-text("Ein festes Ziel mit minimalem Mitteleinsatz erreichen")');
await page.click('#fehler-training button:has-text("Weiter")');
await page.click('#fehler-training button:has-text("Ein festes Ziel mit minimalem Mitteleinsatz erreichen")');
await page.waitForSelector("text=Alle Fehler gemeistert");
console.log("✅ Fehler-Training: falsch → üben → gemeistert");

// Altklausur-Analyse
await page.click("nav >> text=Klausuren");
await page.fill("#exam-text", "Aufgabe 1: Erläutern Sie das Minimalprinzip und nennen Sie die GoB. Aufgabe 2: Berechnen Sie die lineare Abschreibung eines Laptops (1.200 €, 3 Jahre). Aufgabe 3 (Fallstudie): Ein Online-Shop plant eine GmbH-Gründung – beurteilen Sie die Rechtsformwahl. Kreuzen Sie an: Welche Aussage zur Bilanz ist korrekt? a) ... b) ...");
await page.click('button:has-text("Analysieren")');
await page.waitForSelector("text=Prüfungswahrscheinlichkeit");
await page.waitForSelector("text=Geprüfte Module");
console.log("✅ Altklausur-Analyse liefert Report");


// Smart-Quiz: starten und beantworten
await page.click("nav >> text=Plan");
await page.click('#smart-quiz button:has-text("Smart-Quiz starten")');
await page.waitForSelector('#smart-quiz >> text=Quiz');
const smartOptions = await page.locator('#smart-quiz [role="group"] button').count();
if (smartOptions < 1) throw new Error("Smart-Quiz erzeugte keine Fragen");
console.log("✅ Smart-Quiz generiert Fragen");

// Leitner-Lernkarten: Glossar-Lernmodus → "Nochmal" macht die Karte fällig,
// das Karten-Training auf der Plan-Seite arbeitet sie ab.
await page.click("nav >> text=Glossar");
await page.click('button:has-text("🃏 Lernmodus")');
await page.waitForSelector("text=Lernkarten");
await page.getByRole("button", { name: /Begriff – antippen/ }).click();
await page.getByRole("button", { name: "Nochmal" }).click();
await page.waitForSelector("text=Fällig · 1");
console.log("✅ Lernkarten: Nochmal → Karte fällig (Leitner Box 1)");
await page.click("nav >> text=Plan");
await page.waitForSelector("text=Karten-Training");
await page.waitForSelector("text=1 fällig");
await page.click('button:has-text("Training starten")');
await page.getByRole("button", { name: /Begriff – antippen/ }).click();
await page.getByRole("button", { name: "Gewusst" }).click();
await page.waitForSelector("text=Session geschafft");
await page.waitForSelector("text=0 fällig");
console.log("✅ Karten-Training: fällige Karte wiederholt → Box 2");

// Fokus-Timer starten und vorzeitig beenden → Minuten werden gespeichert
await page.click("nav >> text=Start");
await page.getByRole("button", { name: "Start", exact: true }).click();
await page.waitForTimeout(1400); // ≥1 Sek. Fortschritt, damit Minuten anfallen
const finishBtn = page.getByRole("button", { name: /Beenden/ });
await finishBtn.waitFor({ timeout: 4000 });
await finishBtn.click();
await page.waitForSelector("text=Fokus-Minuten gespeichert");
console.log("✅ Fokus-Timer: vorzeitig beenden speichert Minuten");

if (errors.length) {
  console.error("⚠️ JS-Fehler:", errors.slice(0, 5));
  process.exit(1);
}
console.log("✅ Keine JS-Fehler");
await browser.close();