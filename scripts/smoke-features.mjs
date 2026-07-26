/**
 * E2E-Sweep der neueren Features in echtem Chromium (file://):
 * persistenter Timer + Pill, Semester-Pager/Ketten/Brücken, Analytics
 * (Radar, Erfolgsquote, Empfehlungen), Klausur-Simulator/Heatmap/Insights,
 * A11y-Toggles, Theme. Aufruf: node scripts/smoke-features.mjs [chromium]
 */
import { chromium } from "playwright-core";
import { appUnderTest } from "./app-under-test.mjs";

const executablePath = process.argv[2] ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const APP = appUnderTest();

const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` – ${detail}` : ""}`);
  if (!ok) failures++;
};

// Lernfortschritt säen, damit Analytics etwas zu zeigen haben
await page.addInitScript(() => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("mrk7-wq", JSON.stringify({
    "s1-bwl#0": { modId: "s1-bwl", qi: 0, misses: 3, box: 1, due: "2020-01-01" },
    "s1-bwl#1": { modId: "s1-bwl", qi: 1, misses: 2, box: 1, due: "2020-01-01" },
  }));
  localStorage.setItem("mrk6-qb", JSON.stringify({
    "s2-mkt": { c: 2, t: 10 },
    "s2-mkt~ext": { c: 5, t: 10 },
    "s1-ecm": { c: 9, t: 10 },
  }));
  // Leitner-Karten mit gestaffelten Fälligkeiten für die Lernlast-Vorschau
  const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  localStorage.setItem("mrk7-sr", JSON.stringify({
    glossar: {
      0: { box: 1, due: inDays(0) },
      1: { box: 2, due: inDays(1) },
      2: { box: 2, due: inDays(1) },
      3: { box: 3, due: inDays(4) },
      4: { box: 1, due: inDays(-3) },
    },
  }));
});

await page.goto(APP);
await page.waitForSelector("text=Salam, bereit zu lernen?", { timeout: 20000 });

/* ── Dashboard: Empfehlungen ── */
check("Heute-empfohlen-Karte auf dem Dashboard", await page.locator("text=Heute empfohlen").isVisible());
const recTitles = await page.locator('[class*="recTitle"]').allTextContents();
check("Fällige Fehler sind Empfehlung Nr. 1", recTitles[0]?.includes("fällige"), JSON.stringify(recTitles));

/* ── Timer: eigene Dauer, Pill, Reload ── */
await page.locator('[class*="presets"] button[title="Eigene Dauer"]').click();
await page.fill('input[aria-label="Eigene Dauer in Minuten"]', "50");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const customTime = (await page.locator('[class*="_time_"]').first().textContent()).trim();
check("Eigene Timer-Dauer (… → 50) setzt 50:00", customTime === "50:00", customTime);

await page.locator('[class*="controls"] button:has-text("Start")').first().click();
await page.waitForTimeout(1300);
await page.click('a[href="#/semester"]');
await page.waitForSelector('button[aria-label*="Fokus-Timer läuft"]', { timeout: 5000 });
const pill1 = await page.locator('[class*="pillTime"]').textContent();
await page.waitForTimeout(2100);
const pill2 = await page.locator('[class*="pillTime"]').textContent();
check("Timer-Pill läuft auf /semester weiter", pill1 !== pill2, `${pill1} → ${pill2}`);

await page.reload();
await page.waitForSelector('[class*="pagerBtn"]', { timeout: 20000 });
await page.waitForTimeout(800);
check("Timer überlebt Reload (Pill wieder da)", await page.locator('button[aria-label*="Fokus-Timer läuft"]').isVisible());
await page.locator('button[aria-label="Timer pausieren"]').click();
await page.waitForTimeout(400);
// Pausiert: Pill bleibt sichtbar, jetzt mit Fortsetzen-Knopf.
const pausedPillTime = await page.locator('[class*="pillTime"]').isVisible();
const resumeBtn = await page.locator('button[aria-label="Timer fortsetzen"]').isVisible();
check("Timer-Pill bleibt bei Pause sichtbar (mit Fortsetzen)", pausedPillTime && resumeBtn);
await page.locator('button[aria-label="Timer fortsetzen"]').click();

/* ── Semester: Pager-Farben, Ketten, Brücken ── */
const pagerCount = await page.locator('[class*="pagerBtn"]').count();
check("Semester-Pager: 7 Knöpfe", pagerCount === 7, `${pagerCount}`);
const numColors = await page.$$eval('[class*="pagerBtn"]:not([class*="Active"]) [class*="pagerNum"]', (els) =>
  els.map((el) => getComputedStyle(el).color)
);
// Alle inaktiven Knöpfe tragen jetzt dieselbe Farbe (Semester 4, Blau–Türkis);
// der aktive Knopf hebt sich mit weißer Ziffer ab.
check("Alle inaktiven Knöpfe tragen dieselbe Farbe", new Set(numColors).size === 1, `${new Set(numColors).size} Farbe(n)`);

await page.locator('[class*="pagerBtn"]').nth(2).click();
await page.waitForTimeout(700);
check("Pager-Klick öffnet Semester 3", await page.locator("#semester-3 [aria-expanded]").first().getAttribute("aria-expanded") === "true");

// Lernketten sind standardmäßig eingeklappt → erst aufklappen
await page.locator("text=Lernketten").click();
await page.waitForTimeout(500);
check("4 Lernketten sichtbar", (await page.locator('[class*="chainHead"]').count()) === 4);

// Kette abhaken → Zähler steigt, überlebt implizit den Storage
const chainCb = page.locator('[role="checkbox"][aria-label*="Kette"]').first();
await chainCb.click();
await page.waitForTimeout(300);
check("Kette abhaken funktioniert", (await chainCb.getAttribute("aria-checked")) === "true");
await chainCb.click(); // wieder zurück, damit der Modul-Klick sichtbar bleibt
await page.waitForTimeout(200);

await page.locator('button[title*="Datenbanken"]').first().click();
await page.waitForTimeout(900);
check("Ketten-Klick öffnet Modul DAT", await page.locator('#modul-s2-dat [aria-expanded]').first().getAttribute("aria-expanded") === "true");

const bridgeCount = await page.locator('[class*="bridgeRow"]').count();
check("Brücken-Themen vorhanden", bridgeCount >= 3, `${bridgeCount}`);
const firstBridgeTerm = (await page.locator('[class*="bridgeTerm"]').first().textContent()).trim();
await page.locator('[class*="bridgeRow"]').first().click();
await page.waitForTimeout(900);
const hash = await page.evaluate(() => location.hash);
check("Brücken-Klick führt ins Lernen (Glossar/Quiz)", hash.includes("/glossar") || hash.includes("/plan"), `${firstBridgeTerm} → ${hash}`);

/* ── Statistik: Radar, Erfolgsquote, Bestenliste ── */
await page.click('a[href="#/statistik"]');
await page.waitForSelector("text=Schwachstellen-Radar", { timeout: 5000 });
const weakNames = await page.locator('[class*="weakName"]').allTextContents();
check("Radar: BWL (offene Fehler) ganz oben", weakNames[0]?.includes("BWL"), JSON.stringify(weakNames.slice(0, 2)));
await page.click("text=Erfolgsquote je Thema");
await page.waitForTimeout(500);
const statsText = await page.evaluate(() => document.body.innerText);
check("Erfolgsquote ohne rohe ~ext-IDs", statsText.includes("Erfolgsquote") && !statsText.includes("~ext"));

/* ── Lernlast-Vorschau: Blick nach vorn statt nur zurück ── */
const forecastLead = (await page.locator('[class*="lead"]').filter({ hasText: "Wiederholungen" }).first()
  .textContent().catch(() => "")) || "";
check("Vorschau zählt die fälligen Wiederholungen der nächsten 14 Tage",
  /\d+ Wiederholungen in den nächsten 14 Tagen/.test(forecastLead.replace(/\s+/g, " ")),
  forecastLead.replace(/\s+/g, " ").trim().slice(0, 70));
const forecastBars = await page.locator('[class*="forecast"] [class*="_day_"]').count()
  || await page.locator('[class*="_chart_"] [class*="_day_"]').count();
check("Vorschau zeigt 14 Tagesbalken", forecastBars === 14, `${forecastBars}`);
const projections = await page.locator('[class*="projRow"]').allTextContents();
check("Vorschau nennt den frühesten Termin für die Fehler-Kartei",
  projections.some((t) => /Fehlerfrage/.test(t)), projections.length + " Zeile(n)");
// Deutsche Zahlen- und Datumsschreibweise (kein "0.8", kein "18.09..")
const statsBody = await page.evaluate(() => document.body.innerText);
check("Vorschau schreibt Zahlen und Daten deutsch",
  !/Ø \d+\.\d/.test(statsBody) && !/\d{2}\.\d{2}\.\./.test(statsBody));

/* ── Glossar: Suche + Favorit ── */
await page.click('a[href="#/glossar"]');
await page.waitForSelector('input[type="search"], input[placeholder*="uch"]', { timeout: 5000 });
await page.fill('input[type="search"], input[placeholder*="uch"]', "Netzeffekte");
await page.waitForTimeout(700);
check("Glossar-Suche findet Netzeffekte", await page.locator("text=Netzeffekte").first().isVisible());

/* ── Glossar: Alpha-Sprung rendert auch noch nicht geladene Gruppen ── */
await page.fill('input[type="search"], input[placeholder*="uch"]', "");
await page.waitForTimeout(700);
const lastLetterBtn = page.locator('[class*="alphaBtn"]').last();
const lastLetter = (await lastLetterBtn.textContent()).trim();
await lastLetterBtn.click();
const jumped = await page
  .waitForFunction(
    (letter) => {
      const el = document.getElementById(`glos-${letter}`);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= -80 && r.top < window.innerHeight * 0.8;
    },
    lastLetter,
    { timeout: 6000 }
  )
  .then(() => true)
  .catch(() => false);
check(`Alpha-Sprung erreicht Gruppe ${lastLetter} trotz Lazy-Rendering`, jumped);

/* ── Plan: Podcast-Sektion (Sprachausgabe der Themen) ── */
await page.click('a[href="#/plan"]');
await page.waitForSelector("text=Dein Fahrplan", { timeout: 8000 });
await page.click("text=Podcast · Themen zum Anhören");
await page.waitForTimeout(400);
const epCount = await page.locator('[class*="epHead"]').count();
check("Podcast: mehrere Folgen gelistet", epCount >= 5, `${epCount} Folgen`);
await page.locator('[class*="epHead"]').first().click();
await page.waitForTimeout(300);
const podSegs = await page.locator('[class*="segText"]').count();
check("Podcast: Skript-Kapitel sichtbar", podSegs >= 3, `${podSegs} Kapitel`);
check("Podcast: Start-Knopf vorhanden", await page.locator('button:has-text("Podcast starten")').first().isVisible());
check(
  "Podcast: Stimmen-Umschalter (Gerät / KI-Stimme)",
  (await page.locator('button:has-text("Gerätestimme")').isVisible()) &&
    (await page.locator('button:has-text("KI-Stimme")').isVisible())
);
check("Podcast: Auto-Weiter-Schalter vorhanden", await page.locator('[role="switch"][aria-label*="nächsten Folge"]').isVisible());

// Weiterhören: gespeicherte Hörposition wird als Sprungmarke angeboten
await page.evaluate(() => localStorage.setItem("mrk7-podpos", JSON.stringify({ id: "pod-handel", seg: 4 })));
await page.reload();
await page.waitForSelector("text=Dein Fahrplan", { timeout: 8000 });
await page.click("text=Podcast · Themen zum Anhören");
await page.waitForTimeout(400);
const resumeText = (await page.locator('[class*="resumeTitle"]').first().textContent().catch(() => "")) || "";
check("Podcast: Weiterhören zeigt die zuletzt gehörte Stelle",
  resumeText.includes("Kapitel 5"), resumeText.trim());

/* ── Quiz per Tastatur durchspielen (Ziffer wählt, Enter blättert) ── */
await page.click("text=Quiz-Verzeichnis");
await page.waitForTimeout(400);
await page.locator('[class*="dirRow"]').first().click();
await page.waitForTimeout(600);
const stepBefore = (await page.locator('[class*="stepMeta"]').first().textContent()) || "";
await page.keyboard.press("2");
await page.waitForTimeout(300);
const marked = await page.locator('[class*="optionCorrect"], [class*="optionWrong"]').count();
check("Quiz-Tastatur: Ziffer wählt eine Antwort", marked >= 1, `${marked} markiert`);
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const stepAfter = (await page.locator('[class*="stepMeta"]').first().textContent()) || "";
check("Quiz-Tastatur: Enter blättert weiter (schließt nicht das Quiz)",
  stepBefore.includes("Frage 1") && stepAfter.includes("Frage 2"),
  `${stepBefore.trim()} → ${stepAfter.trim()}`);
await page.locator('[class*="dirRow"]').first().click(); // Quiz wieder zuklappen
await page.waitForTimeout(300);

/* ── Glossar: Suche verzeiht fehlende Umlaute ── */
await page.click('a[href="#/glossar"]');
await page.waitForSelector('input[type="search"], input[placeholder*="Such"]', { timeout: 8000 });
const searchBox = page.locator('input[type="search"], input[placeholder*="Such"]').first();
await searchBox.fill("okonom");
await page.waitForTimeout(500);
const foundNoUmlaut = await page.locator('[class*="entryRow"]').count();
check("Glossar: okonom findet Begriffe mit Ö", foundNoUmlaut > 0, `${foundNoUmlaut} Treffer`);
await searchBox.fill("oekonom");
await page.waitForTimeout(500);
const foundSpelled = await page.locator('[class*="entryRow"]').count();
check("Glossar: oekonom findet dieselben Begriffe", foundSpelled > 0, `${foundSpelled} Treffer`);
await searchBox.fill("");
await page.waitForTimeout(300);

await page.click('a[href="#/plan"]');
await page.waitForSelector("text=Dein Fahrplan", { timeout: 8000 });

/* ── Formeln & Rechner: Rechner rechnet live ── */
await page.click("text=Formeln & Rechner");
await page.waitForTimeout(300);

/* ── Formel-Trainer: Abfrage statt reinem Nachschlagen ── */
await page.click('button:has-text("Abfrage starten")');
await page.waitForTimeout(600);
const fq = (await page.locator('[class*="questionText"]').first().textContent()) || "";
const fOpts = await page.locator('[class*="_option_"]').count();
check("Formel-Trainer stellt eine Frage mit vier Optionen", fq.length > 10 && fOpts === 4,
  `${fOpts} Optionen · ${fq.replace(/\s+/g, " ").trim().slice(0, 50)}`);
check("Formel-Trainer erzeugt keine kaputten Zahlen", !/NaN|undefined|Infinity/.test(fq));
await page.keyboard.press("1");
await page.waitForTimeout(400);
const fMarked = await page.locator('[class*="optionCorrect"], [class*="optionWrong"]').count();
check("Formel-Trainer nimmt die Antwort an", fMarked >= 1, `${fMarked} markiert`);
await page.click('button:has-text("Neue Abfrage zusammenstellen")');
await page.waitForTimeout(400);
check("Formel-Trainer lässt sich neu zusammenstellen",
  await page.locator('button:has-text("Abfrage starten")').first().isVisible());
// Gezielt die Kategorie-Überschrift der Liste – der Trainer-Chip darüber
// trägt denselben Text.
await page.locator('[class*="catHead"]:has-text("E-Commerce- & Marketing-KPIs")').first().click();
await page.waitForTimeout(300);
const crCard = page.locator('[class*="_card_"]:has-text("Conversion Rate")');
await crCard.locator("input").nth(0).fill("5");
await crCard.locator("input").nth(1).fill("200");
await page.waitForTimeout(300);
const crOut = (await crCard.locator('[class*="resultValue"]').first().textContent()).trim();
check("Formel-Rechner: Conversion 5/200 = 2,50 %", crOut.startsWith("2,5"), crOut);

/* ── Formel-Darstellung: Stufen erkennbar, Karten getrennt ── */
await page.locator('[class*="catHead"]:has-text("Handel & Kalkulation")').first().click();
await page.waitForTimeout(400);
const ladder = page.locator('[class*="formulaSteps"]').first();
const ladderLines = await ladder.locator('[class*="formulaLine"]').allTextContents();
check("Mehrstufige Formel steht Stufe für Stufe untereinander",
  ladderLines.length === 3 && ladderLines[1].trim().startsWith("→"),
  `${ladderLines.length} Zeilen`);
// Formelkarten dürfen nicht aneinanderkleben
const cardGap = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('[class*="_card_"]')].filter((c) => c.querySelector('[class*="formulaLine"]'));
  if (cards.length < 2) return null;
  const a = cards[0].getBoundingClientRect();
  const b = cards[1].getBoundingClientRect();
  return Math.round(b.top - a.bottom);
});
check("Formelkarten haben sichtbaren Abstand", cardGap !== null && cardGap >= 12, `${cardGap}px`);
const hasCalcKicker = await page.locator('[class*="calcKicker"]').first().isVisible();
check("Rechner-Bereich ist als solcher beschriftet", hasCalcKicker);

/* ── Modul-Notiz speichern & wiederfinden ── */
await page.click('a[href="#/semester"]');
await page.waitForSelector('[class*="pagerBtn"]', { timeout: 5000 });
await page.locator('[class*="modHead"]').first().click();
await page.waitForTimeout(300);
const modNote = page.locator('textarea[aria-label^="Notiz"]').first();
await modNote.fill("Meine Testnotiz");
await modNote.blur();
await page.waitForTimeout(300);
await page.click('a[href="#/statistik"]');
await page.waitForTimeout(300);
await page.click('a[href="#/semester"]');
await page.waitForSelector('[class*="pagerBtn"]', { timeout: 5000 });
await page.locator('[class*="modHead"]').first().click();
await page.waitForTimeout(300);
const noteVal = await page.locator('textarea[aria-label^="Notiz"]').first().inputValue();
check("Modul-Notiz bleibt gespeichert", noteVal === "Meine Testnotiz", noteVal);

/* ── Klausuren: Analyse, Radar, Heatmap, Insights, Simulator, Löschen ── */
await page.click('a[href="#/klausuren"]');
await page.waitForSelector('input[placeholder^="Name"]', { timeout: 5000 });
const addExam = async (name, text) => {
  await page.fill('input[placeholder^="Name"]', name);
  await page.fill('textarea[placeholder^="Klausurtext"]', text);
  await page.click('button:has-text("Analysieren & speichern")');
  await page.waitForTimeout(700);
};
await addExam("EC SS24", "Erläutern Sie Netzeffekte, Kritische Masse und das Betreiber-Modell im E-Marketplace. Beschreiben Sie die Customer Journey, SEO und SEA. Berechnen Sie den Kapitalwert.");
await addExam("EC WS23", "Definieren Sie Netzeffekte und den Long Tail. Erläutern Sie Betreiber-Modell, Plattformökonomie und Affiliate-Marketing.");

check("Prüfungsradar ab 2 Klausuren", await page.locator("text=Prüfungsradar").first().isVisible());
check("Modul-Heatmap sichtbar", await page.locator("text=Modul-Heatmap").isVisible());
check("Community-Insights-Zeilen", (await page.locator('[class*="topItemInsight"]').count()) >= 2);
check("Ehrliche Insights-Fußnote", await page.locator("text=keine echten Nutzerdaten").first().isVisible());

// RAG-Prompt
await page.evaluate(() => {
  window.__copied = "";
  navigator.clipboard.writeText = (t) => { window.__copied = t; return Promise.resolve(); };
});
await page.locator('button:has-text("KI-Prompt kopieren")').first().click();
await page.waitForTimeout(400);
const prompt = await page.evaluate(() => window.__copied);
check(
  "RAG-Prompt vollständig (Rolle, Kontext, Ähnlichkeit, CoT)",
  prompt.includes("erfahrener Prüfungsanalyst") && prompt.includes("HISTORISCHER KONTEXT") &&
    /Ähnlichkeit: \d+\.\d %/.test(prompt) && prompt.includes("Denke Schritt für Schritt."),
  `${prompt.length} Zeichen`
);

// Simulator: kompletter Kurz-Durchlauf
await page.locator('button:has-text("Kurz ·")').click();
await page.click('button:has-text("Probeklausur starten")');
await page.waitForSelector("text=Probeklausur läuft", { timeout: 5000 });
await page.locator('[class*="option"]').first().click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Musterlösung anzeigen")').first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Gewusst")').first().click();
await page.click('button:has-text("abgeben")');
await page.waitForSelector("text=Ergebnis der Probeklausur", { timeout: 5000 });
const note = (await page.locator('[class*="simGradeNote"]').textContent()).trim();
check("Simulator liefert deutsche Note", /^\d,\d$/.test(note), note);
await page.click('button:has-text("Neue Probeklausur")');
await page.waitForTimeout(400);
check("Simulator-Verlauf zeigt letzte Ergebnisse", await page.locator("text=Deine letzten Ergebnisse").isVisible());

// Klausur löschen
const delCountBefore = await page.locator('[class*="examRow"]').count();
page.once("dialog", (d) => d.accept());
await page.locator('[class*="deleteBtn"]').first().click();
await page.waitForTimeout(500);
const delCountAfter = await page.locator('[class*="examRow"]').count();
check("Klausur löschen funktioniert", delCountAfter === delCountBefore - 1, `${delCountBefore} → ${delCountAfter}`);

/* ── Einstellungen: A11y-Toggles + Theme ── */
await page.click('button[aria-label="Einstellungen"]');
await page.waitForSelector("text=Reduzierte Animationen", { timeout: 5000 });
await page.click('[role="switch"][aria-label="Reduzierte Animationen umschalten"]');
await page.click('[role="switch"][aria-label="Hohen Kontrast umschalten"]');
await page.waitForTimeout(300);
const attrs = await page.evaluate(() => [document.documentElement.dataset.motion, document.documentElement.dataset.contrast]);
check("A11y-Toggles setzen Root-Attribute", attrs[0] === "reduced" && attrs[1] === "more", attrs.join("/"));
await page.click('button:has-text("Hell")');
await page.waitForTimeout(300);
check("Theme-Wechsel auf Hell", (await page.evaluate(() => document.documentElement.dataset.theme)) === "light");
await page.click('button:has-text("Auto")');

/* ── Speicher-Warnung: voller Speicher darf nicht still scheitern ── */
await page.click('a[href="#/plan"]');
await page.waitForSelector("text=Dein Fahrplan", { timeout: 8000 });
await page.evaluate(() => {
  const orig = Storage.prototype.setItem;
  window.__restoreStorage = () => { Storage.prototype.setItem = orig; };
  Storage.prototype.setItem = () => {
    const e = new Error("voll");
    e.name = "QuotaExceededError";
    throw e;
  };
});
await page.locator('[role="checkbox"][aria-label*="Tag 3 "]').first().click();
await page.waitForTimeout(500);
const warnText = (await page.locator('[role="alert"]').first().textContent().catch(() => "")) || "";
check("Voller Speicher wird sichtbar gemeldet (nicht still verschluckt)",
  warnText.includes("Speicher voll"), warnText.slice(0, 60).trim());

await page.evaluate(() => window.__restoreStorage());
await page.locator('[role="checkbox"][aria-label*="Tag 4 "]').first().click();
await page.waitForTimeout(500);
check("Warnung verschwindet, sobald wieder gespeichert werden kann",
  (await page.locator('[role="alert"]').count()) === 0);

/* ── Konsole sauber? ── */
if (errors.length) {
  console.log("⚠️ JS-/Konsolenfehler:", JSON.stringify(errors.slice(0, 10), null, 2));
  failures++;
} else {
  console.log("✅ Keine JS-/Konsolenfehler auf allen Seiten");
}

await browser.close();
if (failures > 0) {
  console.log(`\n${failures} Check(s) fehlgeschlagen`);
  process.exit(1);
}
console.log("\nAlle Feature-Checks bestanden");
