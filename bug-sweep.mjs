import { chromium } from "playwright-core";
import path from "node:path";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const msgs = [];
page.on("console", (m) => { if (m.type()==="warning"||m.type()==="error") msgs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => msgs.push(`[pageerror] ${e}`));
const APP = "file://" + path.resolve("release/marokko-lernplan-app.html");
await page.goto(APP); await page.waitForSelector("text=Salam",{timeout:20000});
// Klausuren mit mehreren Klausuren (Cache-Pfad) hart durchtesten
await page.goto(APP+"#/klausuren"); await page.waitForSelector('input[placeholder^="Name"]',{timeout:8000});
const add=async(n,t)=>{await page.fill('input[placeholder^="Name"]',n);await page.fill('textarea[placeholder^="Klausurtext"]',t);await page.click('button:has-text("Analysieren & speichern")');await page.waitForTimeout(500);};
await add("K1","Netzeffekte Kritische Masse Betreiber-Modell E-Marketplace Customer Journey SEO Kapitalwert.");
await add("K2","Netzeffekte Long Tail Plattformökonomie Affiliate-Marketing ER-Modell Normalisierung.");
await add("K3","Bullwhip Kanban ABC-Analyse Just-in-Time Meldebestand Sicherheitsbestand.");
await page.waitForTimeout(400);
// Radar/Heatmap/Simulator alle sichtbar → alle nutzen analyzeExam-Cache
const t0=Date.now();
await page.reload(); await page.waitForSelector('text=Modul-Heatmap',{timeout:8000});
console.log("ExamsPage-Render mit 3 Klausuren:", Date.now()-t0, "ms");
console.log(msgs.length ? "GEFUNDEN:\n"+[...new Set(msgs)].join("\n") : "Konsole sauber");
await browser.close();
