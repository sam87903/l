# Handoff – Marokko-Lernplan

## 1) Goal

Build **"Marokko-Lernplan"** — a mobile-first study PWA for the **B.Sc.
E-Commerce program at Hochschule Ruhr West (HRW, BPO 02.06.2023)**, used to
prepare during a Morocco trip before semester start (01.09.2026).

The app started as a single pasted JSX file and was iteratively rebuilt into
a full React 19 / Vite project with the following standing requirements
(all delivered, none may regress):

- Professional refactor into ~60–100 files, no removed features, all
  original content preserved
- Apple / Notion / Linear / Duolingo-inspired UI, 2026 design guidelines
  (HIG navigation, WCAG 2.2 AA)
- PWA + offline support
- Mobile-fast loading (iPhone 13 + iPad Pro specifically)
- A "smart" quiz system: mistake training, exam-analysis tab, Smart-Quiz
  generator from a question bank
- Focus timer with early-finish (banks partial minutes)
- Automatic per-minute rotating backups (keep 2–3 versions)
- **Most recent explicit request, now delivered:** *"Verbesser die
  Lernkarten"* — upgrade flashcards to a real Leitner spaced-repetition
  system

The repo is **private**, so GitHub Pages deploy is best-effort
(`continue-on-error`) and the primary distribution channel is a
**compressed, self-extracting single-file HTML build** the user opens
directly on their iPhone/iPad (`release/marokko-lernplan-app.html`).

## 2) Current State

- Branch `claude/marokko-lernplan-jsx-4kw1it` is up to date with `main`;
  working tree is **clean**, nothing pending.
- Last PR (**#7**, Leitner flashcard upgrade) is **merged** into `main`.
- All prior PRs (#1–#7) merged; no open PRs.
- `npm run build` (PWA → `dist/`) and `npm run build:phone` (single-file →
  `release/marokko-lernplan-app.html`, ~377 KB) both succeed.
- `npx vitest run` → **21/21 tests pass**.
- `node scripts/smoke-e2e.mjs` (Playwright, real Chromium, `file://`) →
  **14/14 checks pass**, no console/page errors.
- The latest `release/marokko-lernplan-app.html` was already sent to the
  user as a file attachment in this session.

## 3) Active Files

Core app structure (React 19 + Vite, CSS Modules, Context API):

- `src/context/ProgressContext.jsx` — central state provider: doneDays,
  quizBest, fcKnown, favorites, recents, activity, settings, wrongPool,
  mastered, exams, **`srs`** (new Leitner state), `reviewCard()` action,
  `stats` memo, export/import/reset, rotating auto-backups.
- `src/utils/decks.js` — **new**: deck registry (`DECKS`, `getDeck`,
  `GLOSSAR_DECK_ID`, `GLOSSARY_CARDS`), `isDue()`, `collectDueCards()`,
  `countDueCards()`.
- `src/utils/dates.js` — has `addDaysISO()` (new) for Leitner due dates.
- `src/constants/config.js` — `LEITNER_INTERVALS = {1:0,2:3,3:7,4:14,5:30}`,
  `LEITNER_MAX_BOX = 5`, `STORAGE_KEYS.srs`, plus existing
  `SMART_QUIZ_SIZES`, `MISTAKE_POOL_CAP`, `AUTO_BACKUP_INTERVAL_MS`,
  `AUTO_BACKUP_KEEP`, `MASTERY_STREAK`, `EXAM_TEXT_LIMIT`, `XP_RULES`.
- `src/components/flashcards/FlashcardDeck.jsx` — rewritten: takes
  `deckId` (not `known`/`onKnown` props anymore), reads `fcKnown`/`srs`
  from context, shows box badges + Neu/Fällig filters + swipe gestures
  (Framer Motion `drag="x"`).
- `src/components/flashcards/DueTrainer.jsx` — **new**: global
  cross-deck "Karten-Training" that collects all due cards, weakest box
  first, requeues wrong answers.
- `src/components/flashcards/flashcards.module.css` — new classes:
  `.toolAlert`, `.boxRow`, `.boxPill(Filled)`, `.boxNr`, `.boxBadge(Due)`,
  `.swipeHint`, `.trainerText`.
- `src/components/semester/ModuleCard.jsx`, `src/pages/GlossaryPage.jsx` —
  updated call sites (`<FlashcardDeck deckId={...} cards={...} color={...}/>`).
- `src/pages/PlanPage.jsx` — renders `<DueTrainer />` between
  `SmartQuizCard` and `MistakeTrainer`.
- `src/constants/theme.js`, `src/styles/tokens.css` — added
  `ACCENT.orange` / `--orange: #f0a24b`.
- `src/utils/exportData.js` — `BACKUP_KEYS` now includes `"srs"`.
- `src/utils/__tests__/decks.test.js` — **new** unit tests (registry,
  `isDue`, `collectDueCards` sort order, Leitner interval config,
  `addDaysISO`).
- `scripts/smoke-e2e.mjs` — extended with a Leitner E2E flow (Glossar
  learn mode → mark "Nochmal" → card becomes due → Plan-page
  Karten-Training resolves it).
- Other established modules (untouched this session, still relevant):
  `src/components/quiz/SmartQuizCard.jsx`, `Quiz.jsx`,
  `MistakeTrainer.jsx`, `src/utils/questionBank.js`,
  `src/utils/examAnalysis.js`, `src/components/timer/FocusTimer.jsx`,
  `src/services/autoBackup.js`.

## 4) Changes Made (this session)

Implemented the full Leitner spaced-repetition upgrade for flashcards:

1. **Config & utilities**: Leitner constants, `addDaysISO()`, and the new
   `src/utils/decks.js` deck registry with due-card collection logic.
2. **ProgressContext**: added `srs` storage slice (`useStoredState`,
   `STORAGE_KEYS.srs`), `reviewCard(deckId, index, known)` action
   implementing Leitner logic (known → box+1, due in
   3/7/14/30 days; not known → box 1, due today), wired into context
   value/deps, backup whitelist, `importData`, `resetAll`.
3. **FlashcardDeck.jsx**: rewritten to read from context directly
   (`deckId` prop instead of `known`/`onKnown`), added box badge display,
   per-deck box-count overview, "Neu" and "Fällig" filters, swipe gestures
   (right = Gewusst, left = Nochmal when flipped; swipe to navigate when
   not flipped).
4. **DueTrainer.jsx** (new component): deck-agnostic training session that
   pulls all due cards across every module + the glossary, weakest boxes
   first, requeues incorrect answers until the session is cleared.
5. Updated call sites in `ModuleCard.jsx` and `GlossaryPage.jsx` to the new
   `FlashcardDeck` API; added `DueTrainer` to `PlanPage.jsx`.
6. Added `--orange` design token / `ACCENT.orange` for the due-filter and
   trainer accents.
7. Added unit tests (`decks.test.js`) and extended the Playwright E2E
   smoke test with a full Leitner round-trip.
8. Ran `npm run build`, `npm run build:phone`, `npx vitest run`, and
   `node scripts/smoke-e2e.mjs` — all green.
9. Committed, pushed to `claude/marokko-lernplan-jsx-4kw1it`, opened
   **PR #7**, merged it (squash) into `main`.
10. Sent the rebuilt `release/marokko-lernplan-app.html` to the user as a
    file attachment.

## 5) Failed Attempts

No failed implementation attempts in this session (flashcard work landed
cleanly on the first pass — verified via `node --check`, vitest, and E2E
before committing).

Earlier-session issues (already resolved, listed for context/history):

- **Classifier/model temporarily unavailable** (recurring): blocked Bash
  a few times; fix was to wait and retry, and re-apply edits idempotently
  with guard checks since some edits silently didn't land the first time.
- **Unterminated string** in `ExamUpload.jsx` (`placeholder="... „BWL EC –
  WiSe 2024/25""` had a stray straight quote) — fixed by simplifying the
  placeholder text.
- **`React is not defined`** in an esbuild test bundle — fixed with
  `--jsx=automatic`.
- **GitHub Pages workflow failed** ("Resource not accessible by
  integration") because the repo is private — user chose to keep it
  private; Pages steps made `continue-on-error: true` with outcome guards
  so CI stays green.
- **E2E selector timeouts/ambiguity** — needed scoped selectors
  (`#quiz-verzeichnis >> ...`), exact role matching
  (`getByRole("button", { name: "Start", exact: true })`) to avoid
  matching multiple "Start" buttons, and a `waitForTimeout` so ≥1 minute
  elapses before the timer's early-finish button appears.

## 6) Next Steps

No pending work is currently tracked — the flashcard upgrade (the last
explicit user request) is fully shipped, tested, merged, and delivered to
the user. Nothing was said would follow it yet.

Possible follow-ups if the user asks (not yet requested, do not start
unprompted):

- Extend Leitner review beyond flashcards into the quiz "mistake pool"
  (`wrongPool` in `ProgressContext.jsx`) for a unified spaced-repetition
  model across cards and quiz questions.
- Add a due-count badge/indicator on the bottom nav or dashboard so the
  user notices fällige Karten without opening the Plan tab.
- Consider push-notification style reminders (`settings.notifications`
  already exists) when cards become due, similar to the existing timer
  notifications via `src/services/notifications.js`.
- If the user ever makes the repo public, revisit the GitHub Pages
  workflow (`continue-on-error` guards in `.github/workflows/`) to enable
  real Pages deployment as a secondary distribution channel.
