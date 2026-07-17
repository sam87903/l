import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// BUILD_TARGET=single erzeugt eine einzelne, offline nutzbare HTML-Datei
// (z.B. zum direkten Öffnen auf dem Smartphone ohne Webserver).
// PAGES=1 (zusätzlich): Single-Build für GitHub Pages – Manifest-, Icon-
// und SW-Verweise bleiben erhalten, weil die Dateien mit deployt werden.
const single = process.env.BUILD_TARGET === "single";
const pages = process.env.PAGES === "1";

// Flagge als Inline-Favicon für die Single-HTML (keine Nachbardateien).
const FLAG_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 24'%3E%3Crect width='36' height='24' fill='%23c1272d'/%3E%3Cpath d='M18 4 L22.7 18.47 L10.39 9.53 L25.61 9.53 L13.3 18.47 Z' fill='none' stroke='%23006233' stroke-width='1.4'/%3E%3C/svg%3E";

/* Single-Build: Links auf Nachbardateien (Icons/Manifest) entfernen – die
   existieren neben der alleinstehenden HTML nicht und erzeugen sonst
   ERR_FILE_NOT_FOUND-Konsolenfehler. Favicon stattdessen inline. */
const stripExternalLinks = {
  name: "strip-external-links",
  transformIndexHtml(html) {
    return html
      .replace(/^\s*<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\r?\n/gm, "")
      .replace("</title>", `</title>\n    <link rel="icon" href="${FLAG_DATA_URI}" />`);
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), ...(single ? [...(pages ? [] : [stripExternalLinks]), viteSingleFile()] : [])],
  build: {
    outDir: single ? "dist-single" : "dist",
    target: "es2020",
    // Sourcemaps fürs Debugging – aber nie in der Single-HTML (inline
    // Maps würden die Datei vervielfachen).
    sourcemap: !single,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
