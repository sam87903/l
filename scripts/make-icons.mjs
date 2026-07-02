/** Rendert public/icon.svg per Chromium zu PNG-Icons (iOS braucht PNG). */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(root, "public/icon.svg"), "utf8");
const executablePath = process.argv[2] ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
for (const size of [512, 192, 180]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0}</style><div style="width:${size}px;height:${size}px">${svg.replace(
      "<svg ", `<svg width="${size}" height="${size}" `
    )}</div>`
  );
  await page.screenshot({
    path: path.join(root, `public/icon-${size}.png`),
    omitBackground: true,
  });
  await page.close();
  console.log(`✅ public/icon-${size}.png`);
}
await browser.close();
