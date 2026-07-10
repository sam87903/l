import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// BUILD_TARGET=single erzeugt eine einzelne, offline nutzbare HTML-Datei
// (z.B. zum direkten Öffnen auf dem Smartphone ohne Webserver).
const single = process.env.BUILD_TARGET === "single";

export default defineConfig({
  base: "./",
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
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
