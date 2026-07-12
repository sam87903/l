/**
 * E2E-Sweep der neueren Features in echtem Chromium (file://):
 * persistenter Timer + Pill, Semester-Pager/Ketten/Brücken, Analytics
 * (Radar, Erfolgsquote, Empfehlungen), Klausur-Simulator/Heatmap/Insights,
 * A11y-Toggles, Theme. Aufruf: node scripts/smoke-features.mjs [chromium]
 */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = process.argv[2] ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const APP = "file://" + path.join(root, "release/marokko-lernplan-app.html");

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

/* ── Semester: Pager-Farben, Ketten, Brücken ── */
const pagerCount = await page.locator('[class*="pagerBtn"]').count();
check("Semester-Pager: 7 Knöpfe", pagerCount === 7, `${pagerCount}`);
const numColors = await page.$$eval('[class*="pagerNum"]', (els) =>
  els.map((el) => getComputedStyle(el).color)
);
check("Jeder Knopf hat eigene Semesterfarbe", new Set(numColors).size >= 6, `${new Set(numColors).size} Farben`);

await page.locator('[class*="pagerBtn"]').nth(2).click();
await page.waitForTimeout(700);
check("Pager-Klick öffnet Semester 3", await page.locator("#semester-3 [aria-expanded]").first().getAttribute("aria-expanded") === "true");

check("4 Lernketten sichtbar", (await page.locator('[class*="chainHead"]').count()) === 4);
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

/* ── Glossar: Suche + Favorit ── */
await page.click('a[href="#/glossar"]');
await page.waitForSelector('input[type="search"], input[placeholder*="uch"]', { timeout: 5000 });
await page.fill('input[type="search"], input[placeholder*="uch"]', "Netzeffekte");
await page.waitForTimeout(700);
check("Glossar-Suche findet Netzeffekte", await page.locator("text=Netzeffekte").first().isVisible());

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
