# Entwicklerdokumentation

## Architektur

Die App folgt einem strikten Schichtenmodell:

1. **`data/`** – reine Inhalte (Glossar, Semester 1–7, 21-Tage-Plan,
   Detail-Kompendium, Ressourcen, Wahlmodule). Automatisch aus
   `legacy/marokko-lernplan.jsx` extrahiert; **Inhalte niemals hier
   umformulieren**, nur strukturell erweitern.
2. **`constants/` + `utils/` + `services/`** – pure Logik ohne React:
   Design-Konstanten, XP-/Streak-/Heatmap-Berechnung, Datums-Helfer,
   Storage-/Audio-/Notification-Adapter.
3. **`hooks/`** – wiederverwendbare React-Logik (persistenter State,
   Debounce, Countdown, inkrementelle Listen, matchMedia).
4. **`context/`** – zwei Provider:
   - `ThemeContext`: Modus `auto|light|dark`, setzt `data-theme` am `<html>`.
   - `ProgressContext`: gesamter Lernfortschritt inkl. abgeleiteter
     `stats` (memoisiert). Alle Mutationen laufen über benannte Actions
     (`toggleDay`, `saveQuizResult`, `setKnownCard`, …), die zugleich das
     Aktivitätslog für Streak/Heatmap füttern.
5. **`components/`** – präsentationsnahe Bausteine, per `React.memo`
   stabilisiert; Styling über CSS Modules mit Design-Tokens
   (`var(--…)`) und `color-mix()` für getönte Glass-Flächen.
6. **`pages/`** – Route-Ebene, lazy geladen (`React.lazy` + `Suspense`).

## Persistenz

`services/storage.js` kapselt `window.storage` (claude.ai-Artefakt) mit
Fallback auf `localStorage`. Schlüssel in `constants/config.js`
(`mrk6-*` bleibt kompatibel zu v2-Speicherständen, `mrk7-*` ist neu).
`useStoredState` lädt asynchron und meldet `loaded`; `ProgressProvider`
blockt das Rendering bis alle Slices geladen sind (`ready`).

## Cross-Page-Navigation

Sprünge wie „Quiz aus dem Semester-Tab öffnen" laufen über
`navigate("/plan", { state: { openQuizSection, openQuiz, scrollDay } })`;
`PlanPage` wertet `location.state` in einem Effekt aus.

## Builds

- `npm run build` → `dist/` (PWA: `public/sw.js` cache-first,
  `manifest.webmanifest`, installierbar).
- `npm run build:single` → `dist-single/index.html` via
  `vite-plugin-singlefile` (alle Chunks inline, HashRouter ⇒ läuft auch
  über `file://`; der Service Worker wird dort bewusst nicht registriert).
- Release-Artefakt: `release/marokko-lernplan-app.html` (committet, damit
  die Handy-Version ohne Build verfügbar ist).

## Tests

Vitest + React Testing Library (`npm test`):

- `utils/__tests__/dates.test.js` – Datumslogik
- `utils/__tests__/xp.test.js` – XP/Level/Streak
- `components/ui/__tests__/ProgressBar.test.jsx` – ARIA-Verhalten
- `__tests__/App.test.jsx` – kompletter App-Smoke-Test (Provider,
  Router, Dashboard)

Polyfills für jsdom (matchMedia, ResizeObserver, IntersectionObserver)
liegen in `src/test/setup.js`.

## Konventionen

- Deutsch für UI-Texte und Kommentare; Code-Bezeichner Englisch.
- Keine Magic Numbers – Konfiguration nach `constants/config.js`.
- Neue klickbare Nicht-Buttons brauchen `kb()` aus `utils/misc.js`
  (Tastaturbedienung) und sinnvolle ARIA-Attribute.
- Interaktive Ziele ≥ 44 px Höhe (Touch).
