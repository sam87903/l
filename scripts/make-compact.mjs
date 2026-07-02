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

// Splash-Style (aus index.html) unkomprimiert lassen, App-CSS komprimieren.
const splashCss = styles.length > 1 ? styles[0] : "";
const appCss = styles.length > 1 ? styles.slice(1).join("\n") : styles[0] ?? "";

const pack = (text) => zlib.gzipSync(Buffer.from(text, "utf8"), { level: 9 }).toString("base64");
const cssB64 = pack(appCss);
const jsB64 = pack(script[1]);

const html = `<!doctype html>
<html lang="de" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0a0e1a" />
<meta name="description" content="Marokko-Lernplan – interaktive Lernplattform für den B.Sc. E-Commerce an der HRW" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<title>Marokko-Lernplan · HRW E-Commerce</title>
<style>${splashCss || "html,body{margin:0;background:#0a0e1a}#splash{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;color:#8a96b8;font:.9rem system-ui,sans-serif}#splash span{font-size:2.5rem}"}</style>
</head>
<body>
<div id="root"><div id="splash"><span>🇲🇦</span>Lernplan wird geladen…</div></div>
<noscript><p style="color:#eef2fb;font-family:system-ui;padding:2rem">Bitte JavaScript aktivieren.</p></noscript>
<script>
(async () => {
  const unpack = async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  };
  try {
    if (typeof DecompressionStream === "undefined") throw new Error("no-ds");
    const [css, js] = await Promise.all([unpack(CSS_B64), unpack(JS_B64)]);
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const mod = document.createElement("script");
    mod.type = "module";
    mod.textContent = js;
    document.body.appendChild(mod);
  } catch (err) {
    document.getElementById("splash").innerHTML =
      "<span>⚠️</span>Dein Browser ist zu alt für diese Version.<br>Bitte einen aktuellen Browser (Chrome/Safari ab 2023) verwenden.";
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
