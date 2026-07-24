/**
 * Gesten-Regression: Lernkarten antippen (umdrehen) und wischen (blättern
 * bzw. bewerten). Deckt den Fall ab, dass mehrere Wischgesten nacheinander
 * funktionieren müssen - genau dort brach die Geste bei der Umstellung von
 * framer-motion auf native Pointer-Events.
 * Aufruf: node scripts/smoke-gestures.mjs
 */
import { chromium } from "playwright-core";
import path from "node:path";
const APP = "file://" + path.resolve("release/marokko-lernplan-app.html");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
let fail=0; const check=(n,ok,d="")=>{console.log(`${ok?"✅":"❌"} ${n}${d?` – ${d}`:""}`); if(!ok)fail++;};

await page.goto(APP);
await page.waitForSelector("text=Salam, bereit zu lernen?", { timeout: 20000 });
await page.click('a[href="#/glossar"]');
await page.click('button:has-text("🃏 Lernmodus")');
await page.waitForSelector("text=Lernkarten", { timeout: 8000 });
const card = page.locator('[class*="cardInner"]').first();
const pos = async () => (await page.locator('[class*="_pos_"]').first().textContent()).trim();
const flipped = async () => ((await card.getAttribute("style"))||"").includes("180deg");

// menschlich getaktete Geste
const drag = async (dx, steps=6, pause=16) => {
  const box = await card.boundingBox(); const cy = box.y+box.height/2;
  const x0 = box.x + box.width*(dx<0 ? 0.7 : 0.3);
  await page.mouse.move(x0, cy); await page.mouse.down();
  for (let i=1;i<=steps;i++){ await page.mouse.move(x0 + (dx*i)/steps, cy); await page.waitForTimeout(pause); }
  await page.mouse.up(); await page.waitForTimeout(600);
};

check("Karte startet ungedreht", !(await flipped()));
await card.click(); await page.waitForTimeout(400);
check("Antippen dreht um", await flipped());
await card.click(); await page.waitForTimeout(400);
check("Erneut antippen dreht zurück", !(await flipped()));

let p = await pos(); await drag(-100);
check("Wischen links → nächste Karte", p !== await pos(), `${p} → ${await pos()}`);
p = await pos(); await drag(100);
check("Wischen rechts → vorherige Karte", p !== await pos(), `${p} → ${await pos()}`);
p = await pos(); await drag(-15, 2, 10);
check("Winziges Ziehen (15px) blättert nicht", p === await pos(), `${p} → ${await pos()}`);
p = await pos(); await drag(-25, 2, 10);
check("Ziehen 25px blättert nicht", p === await pos(), `${p} → ${await pos()}`);
p = await pos(); await drag(-60, 3, 6);
check("Schnelles Schnippen (60px) blättert", p !== await pos(), `${p} → ${await pos()}`);
// Vertikal
p = await pos();
{ const box = await card.boundingBox(); const cy=box.y+box.height/2; const x0=box.x+box.width*0.5;
  await page.mouse.move(x0,cy); await page.mouse.down();
  for(let i=1;i<=5;i++){ await page.mouse.move(x0+4, cy+i*20); await page.waitForTimeout(14); }
  await page.mouse.up(); await page.waitForTimeout(400); }
check("Vertikales Ziehen blättert nicht", p === await pos(), `${p} → ${await pos()}`);
check("Kein Rest-Versatz", !/--swipe:\s*-?[1-9]/.test((await card.getAttribute("style"))||""));
console.log("JS-Fehler:", errs.length?errs.slice(0,3):"keine");
await b.close(); process.exit(fail?1:0);
