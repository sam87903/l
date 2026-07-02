# 🇲🇦 Marokko-Lernplan · HRW E-Commerce B.Sc.

Interaktive Lernapp zur Vorbereitung auf das E-Commerce-Studium an der Hochschule Ruhr West (BPO 02.06.2023).

## Dateien

- **`index.html`** – Fertige, eigenständige App. Einfach im Browser öffnen (Handy oder Desktop), keine Installation nötig. Fortschritt wird lokal im Browser gespeichert (localStorage).
- **`marokko-lernplan.jsx`** – React-Quellcode (eine Datei, default export `App`). Läuft auch als claude.ai-Artefakt (nutzt dort `window.storage`, sonst localStorage).

## Features (v2)

- 🏠 **Start**: 21-Tage-Lernplan mit Abhaken, "Heute dran"-Karte, ⏱ 20-Min-Fokus-Timer, Statistik, Quiz-Verzeichnis mit 🏆 Bestscores, Ressourcen-Bibliothek
- 🔬 **Detail**: Tages-Kompendium mit Lernziel, Prüfungsrelevanz, klickbaren Kernbegriffen und kuratierten Links
- 🎓 **Semester**: Alle 7 Semester / 210 ECTS mit Themen (Definition + Beispiel), 🃏 Lernkarten mit Gewusst-Tracking & Shuffle, Wahlmodul-Katalog
- 📖 **Glossar**: ~150 Fachbegriffe mit Volltextsuche
- 🌓 Dark/Light Theme, ✈️/🎓 Countdowns (Abreise & Semesterstart 01.09.2026)

## Selbst bauen

```bash
npm i react@18 react-dom@18 esbuild
# entry.jsx: importiert App aus marokko-lernplan.jsx und rendert in #root
npx esbuild entry.jsx --bundle --minify --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --outfile=bundle.js
# bundle.js in ein HTML-Grundgerüst inlinen → index.html
```
