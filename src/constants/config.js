/** Zentrale App-Konfiguration – keine Magic Numbers im Komponenten-Code. */

export const SEMESTER_START = "2026-09-01";
export const DEFAULT_START_DATE = "2026-07-10";
export const APP_NAME = "Marokko-Lernplan";
export const APP_VERSION = "3.0.0";

/** Storage-Schlüssel. mrk6-* bleibt kompatibel zu Fortschritt aus v2. */
export const STORAGE_KEYS = {
  doneDays: "mrk6-ck",
  startDate: "mrk6-sd",
  theme: "mrk6-th",
  quizBest: "mrk6-qb",
  flashcards: "mrk6-fc",
  favorites: "mrk7-fav",
  recents: "mrk7-rec",
  activity: "mrk7-act",
  settings: "mrk7-set",
};

/** Timer-Voreinstellungen in Minuten. */
export const TIMER_PRESETS = [20, 25, 45];
export const BREAK_MINUTES = 5;

/** XP-Vergabe pro Aktion. */
export const XP_RULES = {
  day: 50,           // abgeschlossener Lerntag
  card: 10,          // gewusste Lernkarte
  perfectQuiz: 100,  // fehlerfreies Quiz
  minute: 2,         // Fokus-Minute
  favorite: 5,       // Glossar-Favorit
  minutesPerDay: 20, // Aktivitäts-Gutschrift beim Abhaken eines Tages
};

/** Wie viele Glossar-Einträge pro Scroll-Schub nachgeladen werden. */
export const LIST_CHUNK = 40;
export const RECENTS_LIMIT = 20;
