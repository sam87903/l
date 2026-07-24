/**
 * Offline-Regression: baut die PWA lokal auf, kappt das Netz und prueft,
 * dass die App weiterhin startet, navigiert, Fortschritt speichert und die
 * Kernfunktionen laufen. Kritisch fuer die Nutzung ohne Internet.
 *
 * Voraussetzung: PAGES=1 npm run build:single, dann die Dateien wie im
 * Deploy in ein Verzeichnis legen (index.html, sw.js, manifest, icons).
 * Aufruf: node scripts/smoke-offline.mjs <site-verzeichnis>
 */
import { chromium } from "playwright-core";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = process.argv[2];
const MIME={".html":"text/html",".js":"text/javascript",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png"};
const server = http.createServer((req,res)=>{
  const p = path.join(ROOT, req.url==="/"?"index.html":req.url.split("?")[0]);
  try { const d=fs.readFileSync(p); res.writeHead(200,{"Content-Type":MIME[path.extname(p)]||"application/octet-stream"}); res.end(d); }
  catch { res.writeHead(404); res.end("x"); }
});
await new Promise(r=>server.listen(8643,r));
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport:{width:390,height:844} });
const page = await ctx.newPage();
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
let fail=0; const check=(n,ok,d="")=>{console.log(`${ok?"✅":"❌"} ${n}${d?` – ${d}`:""}`); if(!ok)fail++;};
const shell = () => page.waitForSelector('nav', {timeout:15000}).then(()=>true).catch(()=>false);

// ── ONLINE einrichten ──
await page.goto("http://localhost:8643/");
await page.waitForSelector("text=Salam, bereit zu lernen?", {timeout:20000});
await page.evaluate(async()=>{ await navigator.serviceWorker.ready; });
await page.waitForTimeout(1500);
await page.click('a[href="#/plan"]'); await page.waitForSelector("text=Dein Fahrplan");
await page.locator('[role="checkbox"][aria-label*="Tag 1 "]').first().click();
await page.waitForTimeout(400);

// ── OFFLINE ──
await ctx.setOffline(true);
// A) Neustart auf dem Dashboard (wie beim App-Icon-Start)
await page.goto("http://localhost:8643/#/", {waitUntil:"domcontentloaded"});
check("Kaltstart offline auf Dashboard", await page.waitForSelector("text=Salam, bereit zu lernen?",{timeout:15000}).then(()=>true).catch(()=>false));
check("Offline-Hinweis im Header", await page.locator("text=Offline").first().isVisible().catch(()=>false));
// B) Deep-Link offline (Hash-Route direkt)
await page.goto("http://localhost:8643/#/semester", {waitUntil:"domcontentloaded"});
check("Deep-Link /semester offline", await page.waitForSelector('[class*="pagerBtn"]',{timeout:12000}).then(()=>true).catch(()=>false));
// C) Fortschritt erhalten
await page.click('a[href="#/plan"]'); await page.waitForSelector("text=Dein Fahrplan",{timeout:10000});
check("Fortschritt offline erhalten", (await page.locator('[role="checkbox"][aria-label*="Tag 1 "]').first().getAttribute("aria-checked"))==="true");
// D) Offline weiterlernen + Neustart
await page.locator('[role="checkbox"][aria-label*="Tag 2 "]').first().click();
await page.waitForTimeout(400);
await page.goto("http://localhost:8643/#/plan", {waitUntil:"domcontentloaded"});
await shell(); await page.waitForSelector("text=Dein Fahrplan",{timeout:12000});
check("Offline Gelerntes übersteht Neustart", (await page.locator('[role="checkbox"][aria-label*="Tag 2 "]').first().getAttribute("aria-checked"))==="true");
// E) Quiz offline spielen
await page.click("text=Quiz-Verzeichnis"); await page.waitForTimeout(600);
const q = await page.locator('[class*="dirRow"]').first();
await q.click(); await page.waitForTimeout(600);
const opt = page.locator('[class*="_option_"]').first();
const quizOk = await opt.isVisible().catch(()=>false);
if (quizOk) { await opt.click(); await page.waitForTimeout(400); }
check("Quiz offline spielbar", quizOk);
// F) Reise-Check offline erreichbar
await page.click('button[aria-label="Einstellungen"]'); await page.waitForTimeout(900);
check("Reise-Check offline sichtbar", await page.locator("text=Reise-Check").isVisible().catch(()=>false));
const t = await page.evaluate(()=>document.body.innerText);
check("Reise-Check meldet App gespeichert", /App offline gespeichert/.test(t));

console.log("JS-Fehler:", errs.length?errs.slice(0,4):"keine");
await b.close(); server.close();
process.exit(fail?1:0);
