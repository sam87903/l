# 🇲🇦 Marokko-Lernplan · HRW E-Commerce B.Sc.

Professionelle, interaktive Lernplattform zur Vorbereitung auf das
E-Commerce-Studium an der Hochschule Ruhr West (BPO 02.06.2023).

Gebaut mit **React 19, Vite, Framer Motion, Lucide, React Router, CSS Modules** –
im Stil einer nativen Apple-App (Liquid Glass, Dark/Light/Auto-Theme).

## ✨ Features

| Bereich | Inhalt |
| --- | --- |
| 🏠 **Dashboard** | Fortschrittsring, Level & XP, Streak 🔥, Countdown (Abreise + Semesterstart), „Heute dran", Quick Actions, Aktivitäts-Heatmap, Erfolge |
| 📋 **Plan** | 21-Tage-Lernplan mit Abhaken, Wochenblöcken, Quiz-Verzeichnis (🏆 Bestscores) und Ressourcen-Bibliothek |
| 🔬 **Detail** | Tages-Kompendium: Lernziel, Prüfungsrelevanz, klickbare Kernbegriffe, Unterthemen mit kuratierten Links |
| 🎓 **Semester** | Alle 7 Semester / 210 ECTS mit Themen (Definition + Beispiel), Lernkarten mit Flip-Animation & Gewusst-Tracking, Wahlmodul-Katalog |
| 📖 **Glossar** | ~150 Fachbegriffe, Live-Suche (debounced), ⭐ Favoriten, „Zuletzt angesehen", Lernmodus, Alpha-Navigation, inkrementelles Rendering |
| 📊 **Statistik** | Hero-Fortschrittsring, Kontext-KPIs, Streak-Kalender, Details per Progressive Disclosure |
| 🧠 **Lernanalyse** | Nach jedem Quiz: Stärken, Wissenslücken („Du hast Probleme mit …"), priorisierte Lernliste, nächste Lernaktivität – plus KI-Prompt-Export für ChatGPT/Claude |
| 🔁 **Fehler-Training** | Falsch beantwortete Fragen werden wiederholt, bis sie 2× in Folge sitzen (Leitner-Prinzip) |
| 📄 **Klausuren** | Altklausuren einfügen → Themencluster, Aufgabentypen, Schwierigkeitsniveau, wiederkehrende Muster über mehrere Klausuren, „Top 10 Prüfungswahrscheinlichkeit" – alles lokal |
| ⏱️ **Timer** | Pomodoro mit 20/25/45 Min, 5-Min-Pausen, Sound, Vibration, Benachrichtigung |
| ⚙️ **Einstellungen** | Theme (Auto/Hell/Dunkel), Backup-Export/-Import (JSON), CSV-Export, PDF/Druck, Reset |
| 📱 **PWA** | Installierbar, Offline-Modus (Service Worker), Manifest, App-Icon |

Fortschritt wird lokal gespeichert (`localStorage`, kompatibel zu den
Speicherständen der v2-Einzeldatei).

## 🚀 Loslegen

```bash
npm install
npm run dev          # Entwicklungsserver
npm test             # Vitest + React Testing Library
npm run build        # PWA-Build → dist/
npm run build:single # Eine einzelne HTML-Datei → dist-single/index.html
```

**Fürs Handy ohne Server:** `release/marokko-lernplan-app.html` öffnen –
komplett eigenständig, komprimiert auf ~354 KB (Self-Extracting).

## 📱 iPhone / iPad (empfohlen: als App installieren)

1. Diesen Branch nach `main` mergen – der Workflow
   `.github/workflows/deploy-pages.yml` baut und veröffentlicht die App
   automatisch auf **GitHub Pages** (inkl. Aktivierung der Pages-Site).
2. In Safari öffnen: `https://sam87903.github.io/l/`
3. Teilen-Symbol → **„Zum Home-Bildschirm"** → die App liegt mit eigenem
   Icon auf dem Home-Bildschirm, startet im Vollbild und funktioniert
   dank Service Worker auch **offline**. Fortschritt wird pro Gerät
   gespeichert (Backup-Sync über Einstellungen → JSON-Export/-Import).

## 🗂️ Projektstruktur

```
src/
├── App.jsx                 Router, Provider, Lazy Pages
├── main.jsx                Einstieg, Service-Worker-Registrierung
├── components/
│   ├── layout/             Header, BottomNav (mobil) / Rail (Desktop), PageTransition
│   ├── ui/                 GlassCard, Button, Pill, Chip, ProgressBar/-Ring, Search,
│   │                       Modal, Toast, Collapse, Skeleton, EmptyState, ErrorBoundary
│   ├── cards/              WeekBanner, DayCard (21-Tage-Plan)
│   ├── quiz/               Quiz, QuizQuestion, QuizDirectory
│   ├── flashcards/         FlashcardDeck (3D-Flip, Spaced-Repetition light)
│   ├── timer/              FocusTimer (Pomodoro)
│   ├── dashboard/          Hero-Bausteine, StatGrid, QuickActions, Achievements
│   ├── semester/           SemesterAccordion, ModuleCard, TopicItem, Wahlmodule
│   ├── glossary/           GlossaryList/-Entry, AlphaNav
│   ├── detail/             DetailDayCard, TermPill
│   ├── resources/          ResourceLibrary
│   └── charts/             Heatmap, BarChart (reines SVG/CSS)
├── context/                ThemeContext, ProgressContext
├── hooks/                  useStoredState, useDebouncedValue, useMediaQuery,
│                           useCountdownTimer, useIncrementalList
├── services/               storage (localStorage/claude.ai), audio, notifications
├── utils/                  dates, xp/streak/heatmap, export, links, misc
├── constants/              config (Keys, XP-Regeln), theme, achievements
├── data/                   Glossar, 7 Semester-Dateien, Plan, Detail, Ressourcen,
│                           Wahlmodule (auto-extrahiert, Inhalte unverändert)
└── styles/                 tokens.css (Design Tokens), global.css
```

Weitere Details: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).
Die ursprüngliche Einzeldatei liegt referenzhalber in `legacy/`.
