/**
 * Erzeugt aus dist-single/index.html eine kompakte Handy-Version:
 * CSS + JS werden gzip-komprimiert und base64-eingebettet; ein winziger
 * Loader entpackt sie beim Öffnen per DecompressionStream (nativ, schnell).
 * Ergebnis: ~55% kleinere Datei bei identischem Inhalt.
 */
import fs from "node:fs";
import zlib from "node:zlib";

const src = fs.readFileSync("dist-single/index.html", "utf8");

const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const script = src.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/);
if (!script) throw new Error("Kein Modul-Script in dist-single/index.html gefunden");

// Splash-Style wird unten selbst gepflegt; nur das App-CSS wird komprimiert.
const appCss = styles.length > 1 ? styles.slice(1).join("\n") : styles[0] ?? "";

const pack = (text) => zlib.gzipSync(Buffer.from(text, "utf8"), { level: 9 }).toString("base64");
const cssB64 = pack(appCss);
const jsB64 = pack(script[1]);

const html = `<!doctype html>
<!--
  Selbstentpackende Einzeldatei des Marokko-Lernplans.
  Lesbarer Quellcode: React/Vite-Projekt unter src/ im Repository;
  diese Datei erzeugt scripts/make-compact.mjs aus dem Produktions-Build.
  Alles ist eingebettet (keine externen Ressourcen) – daher kein Preload nötig.
-->
<html lang="de" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0a0e1a" />
<meta name="color-scheme" content="dark light" />
<meta name="description" content="Marokko-Lernplan – interaktive Lernplattform für den B.Sc. E-Commerce an der HRW" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<title>Marokko-Lernplan · HRW E-Commerce</title>
<style>
:root { --splash-bg: #0a0e1a; --splash-fg: #8a96b8; --splash-err: #ff6b6b; }
html, body { margin: 0; background: var(--splash-bg); }
#splash {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.75rem;
  padding: 0 1.5rem; text-align: center;
  color: var(--splash-fg); font: 0.9rem/1.5 system-ui, sans-serif;
  animation: splashPulse 2s ease-in-out infinite;
}
#splash span { font-size: 2.5rem; }
#splash p { margin: 0; }
#splash.error { animation: none; color: var(--splash-err); }
@keyframes splashPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { #splash { animation: none; } }
</style>
</head>
<body>
<div id="root">
  <div id="splash" role="status" aria-live="polite">
    <span aria-hidden="true">🇲🇦</span>
    <p id="splash-text">Lernplan wird geladen…</p>
  </div>
</div>
<noscript><p style="color:#eef2fb;font-family:system-ui;padding:2rem;text-align:center">Bitte JavaScript aktivieren, um den Marokko-Lernplan zu nutzen.</p></noscript>
<script>
(async () => {
  const splash = document.getElementById("splash");
  const fail = (message) => {
    splash.classList.add("error");
    splash.setAttribute("role", "alert");
    splash.querySelector("span").textContent = "⚠️";
    document.getElementById("splash-text").innerHTML = message;
  };
  const unpack = async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  };
  try {
    if (typeof DecompressionStream === "undefined") {
      return fail("Dein Browser ist zu alt für diese Version.<br />Bitte einen aktuellen Browser verwenden (Chrome/Edge, Firefox oder Safari ab 16.4).");
    }
    const cssReady = unpack(CSS_B64);
    const jsReady = unpack(JS_B64);
    // CSS anwenden, sobald es entpackt ist – nicht auf das größere JS warten.
    const style = document.createElement("style");
    style.textContent = await cssReady;
    document.head.appendChild(style);
    const mod = document.createElement("script");
    mod.type = "module";
    mod.textContent = await jsReady;
    document.body.appendChild(mod);
    // React ersetzt #root beim Start komplett – der Splash verschwindet
    // damit auch für Screenreader von selbst aus dem DOM.
  } catch (err) {
    console.error("Fehler beim Entpacken der App:", err);
    fail("Fehler beim Laden der Anwendung.<br />Bitte die Seite neu laden oder die Datei erneut öffnen.");
  }
})();
</script>
</body>
</html>`;

const out = html.replace("CSS_B64", JSON.stringify(cssB64)).replace("JS_B64", JSON.stringify(jsB64));
fs.mkdirSync("release", { recursive: true });
fs.writeFileSync("release/marokko-lernplan-app.html", out);

// Integritäts-Check: eingebettete Payloads wieder entpacken und vergleichen.
const roundtrip = (b64, original) =>
  zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf8") === original;
if (!roundtrip(cssB64, appCss) || !roundtrip(jsB64, script[1])) throw new Error("Roundtrip fehlgeschlagen");

console.log(
  `OK – release/marokko-lernplan-app.html: ${(out.length / 1024).toFixed(0)} KB ` +
  `(vorher ${(src.length / 1024).toFixed(0)} KB, JS ${(script[1].length / 1024).toFixed(0)} KB → ${(jsB64.length / 1024).toFixed(0)} KB)`
);
