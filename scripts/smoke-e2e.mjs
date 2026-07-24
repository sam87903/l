/**
 * E2E-Smoke-Test der Single-File-Version in echtem Chromium (file://).
 * Aufruf: node scripts/smoke-e2e.mjs [chromium-binary]
 */
import { chromium } from "playwright-core";
import { appUnderTest } from "./app-under-test.mjs";

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
await page.goto(appUnderTest());
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
await page.waitForSelector('#quiz-verzeichnis >> text=Studienplan & HRW');
console.log("✅ Bonus-Quizze erscheinen im Verzeichnis");
await page.click('#quiz-verzeichnis >> text=Einführung in die BWL');
await page.waitForSelector("text=Was besagt das Minimalprinzip?");
// Standard: Einzelmodus (eine Frage pro Schritt)
await page.waitForSelector('#quiz-verzeichnis >> text=Frage 1 von');
console.log("✅ Quiz startet im Einzelmodus (eine Frage sichtbar)");
// Frage 1 absichtlich falsch beantworten → „Weiter" blättert zur nächsten Frage
const { default: semester1 } = await import("../src/data/semesters/semester1.js");
const bwlQuiz = semester1.modules.find((m) => m.id === "s1-bwl").quiz;
await page
  .locator('[role="group"][aria-label="Frage 1"]')
  .locator("button", { hasText: bwlQuiz[0].options.find((_, oi) => oi !== bwlQuiz[0].correct) })
  .first()
  .click();
await page.getByRole("button", { name: "Weiter", exact: true }).click();
await page.waitForSelector('#quiz-verzeichnis >> text=Frage 2 von');
console.log("✅ Einzelmodus: Antwort → Weiter → nächste Frage ohne Scrollen");
// Für den Rest-Durchlauf zur Listenansicht wechseln
await page.click('#quiz-verzeichnis button:has-text("Liste")');
await page.waitForSelector('[role="group"][aria-label="Frage 2"]');
console.log("✅ Ansicht-Umschalter wechselt zur Listenansicht");
// Erweitert-Umschalter: Zusatzfragen erscheinen, dann zurück zum Basis-Quiz
await page.click('#quiz-verzeichnis button:has-text("Erweitert ·")');
await page.waitForSelector("text=Restbuchwert nach 3 Jahren");
console.log("✅ Erweitert-Button lädt Zusatzfragen");
await page.click('#quiz-verzeichnis button:has-text("Quiz ·")');
await page.waitForSelector("text=Was besagt das Minimalprinzip?");
// Tab-Wechsel hat das Quiz zurückgesetzt: Frage 1 erneut falsch, Rest richtig
for (let qi = 0; qi < bwlQuiz.length; qi++) {
  const q = bwlQuiz[qi];
  const text = qi === 0 ? q.options.find((_, oi) => oi !== q.correct) : q.options[q.correct];
  await page
    .locator(`#quiz-verzeichnis [role="group"][aria-label="Frage ${qi + 1}"]`)
    .locator("button", { hasText: text })
    .first()
    .click();
}
await page.waitForSelector("text=Lernanalyse");
await page.waitForSelector("text=Du hast Probleme mit");
console.log("✅ Lernanalyse nach Quiz erscheint");
await page.click('button:has-text("Fehler üben")');
await page.waitForSelector("#fehler-training >> text=1 fällig");
// Fehler-Training ist einklappbar (Standard: zu), öffnet sich aber über
// „Fehler üben" automatisch.
await page.waitForSelector("#fehler-training >> text=Was besagt das Minimalprinzip?");
// Leitner: richtig → Stufe 2 (wartet bis morgen) → vorziehen → Stufe 3 → oberste Stufe bestanden = gemeistert
await page.click('#fehler-training button:has-text("Ein festes Ziel mit minimalem Mitteleinsatz erreichen")');
await page.waitForSelector("#fehler-training >> text=Hoch auf Stufe 2");
await page.click('#fehler-training button:has-text("Weiter")');
await page.waitForSelector("#fehler-training >> text=Nichts fällig");
await page.click('#fehler-training button:has-text("Trotzdem vorziehen")');
await page.click('#fehler-training button:has-text("Ein festes Ziel mit minimalem Mitteleinsatz erreichen")');
await page.waitForSelector("#fehler-training >> text=Hoch auf Stufe 3");
await page.click('#fehler-training button:has-text("Weiter")');
await page.click('#fehler-training button:has-text("Ein festes Ziel mit minimalem Mitteleinsatz erreichen")');
await page.waitForSelector("#fehler-training >> text=Gemeistert – Stufe 3 bestanden");
await page.click('#fehler-training button:has-text("Weiter")');
await page.waitForSelector("text=Alle Fehler gemeistert");
console.log("✅ Fehler-Training: falsch → 3 gestufte Wiederholungen → gemeistert");

// Altklausur-Analyse – zuerst DOCX-Upload (Datei wird client-seitig extrahiert)
await page.click("nav >> text=Klausuren");
const { deflateRawSync, crc32 } = await import("node:zlib");
const docxXml = '<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Probeklausur BWL: Buchungssatz und Bilanz erläutern.</w:t></w:r></w:p></w:body></w:document>';
const zipEntry = (entryName, content) => {
  const nameBuf = Buffer.from(entryName);
  const raw = Buffer.from(content, "utf8");
  const data = deflateRawSync(raw);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc32(raw), 14); local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc32(raw), 16); central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + nameBuf.length, 12); eocd.writeUInt32LE(30 + nameBuf.length + data.length, 16);
  return Buffer.concat([local, nameBuf, data, central, nameBuf, eocd]);
};
await page.setInputFiles('input[type="file"]', {
  name: "probeklausur-bwl.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  buffer: zipEntry("word/document.xml", docxXml),
});
await page.waitForFunction(() => document.querySelector("#exam-text")?.value.includes("Probeklausur BWL"));
console.log("✅ Klausur-Upload: DOCX wird client-seitig extrahiert");
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

// Fokus-Timer: manuell starten (kein Auto-Start mehr), kurz laufen lassen,
// dann vorzeitig beenden – die bisherigen Minuten werden gespeichert.
await page.click("nav >> text=Start");
await page.locator('[class*="controls"] button:has-text("Start")').first().click();
await page.getByRole("button", { name: "Pause", exact: true }).waitFor({ timeout: 4000 });
console.log("✅ Fokus-Timer: startet auf Knopfdruck (kein Auto-Start)");
await page.waitForTimeout(1300);
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