/** Zentrale App-Konfiguration – keine Magic Numbers im Komponenten-Code. */

export const SEMESTER_START = "2026-09-01";
export const DEFAULT_START_DATE = "2026-07-10";
export const APP_NAME = "Marokko-Lernplan";
export const APP_VERSION = "3.9.0";

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
  wrongPool: "mrk7-wq",
  mastered: "mrk7-wm",
  exams: "mrk7-ex",
  autoBackups: "mrk7-autobak",
  srs: "mrk7-sr",
  quizView: "mrk7-qview",
  timer: "mrk7-tm",
  chainsDone: "mrk7-ch",
  notes: "mrk7-notes",
  podcastAuto: "mrk7-podauto",
  simHistory: "mrk7-sim",
};

/** Wie viele Probeklausur-Ergebnisse aufgehoben werden. */
export const SIM_HISTORY_CAP = 20;

/** Leitner-System: Wiederholungsintervall in Tagen je Box (1–5). */
export const LEITNER_INTERVALS = { 1: 0, 2: 3, 3: 7, 4: 14, 5: 30 };
export const LEITNER_MAX_BOX = 5;

/** Auto-Backup: Intervall (ms) und wie viele Versionen behalten werden. */
export const AUTO_BACKUP_INTERVAL_MS = 60000;
export const AUTO_BACKUP_KEEP = 3;

/** Fehler-Kartei (Leitner light): Wartezeit in Tagen je Box; oberste Stufe bestanden = gemeistert. */
export const MISTAKE_INTERVALS = { 1: 0, 2: 1, 3: 3 };
export const MISTAKE_MAX_BOX = 3;

/** Max. gespeicherte Zeichen pro Altklausur. */
export const EXAM_TEXT_LIMIT = 120000;

/** Smart-Quiz: wählbare Fragenanzahl und Obergrenze der Fehler-Kartei. */
export const SMART_QUIZ_SIZES = [5, 10, 15];
export const MISTAKE_POOL_CAP = 80;

/** Timer-Voreinstellungen in Minuten (dritte Option ist eine frei wählbare Dauer). */
export const TIMER_PRESETS = [20, 25];
export const BREAK_MINUTES = 5;
/** Grenzen für die selbst gewählte Fokus-Dauer (Minuten). */
export const TIMER_CUSTOM_MIN = 1;
export const TIMER_CUSTOM_MAX = 180;

/** XP-Vergabe pro Aktion. */
export const XP_RULES = {
  day: 50,           // abgeschlossener Lerntag
  card: 10,          // gewusste Lernkarte
  perfectQuiz: 100,  // fehlerfreies Quiz
  minute: 2,         // Fokus-Minute
  favorite: 5,       // Glossar-Favorit
  mastered: 15,      // im Fehler-Training gemeisterte Frage
  minutesPerDay: 20, // Aktivitäts-Gutschrift beim Abhaken eines Tages
};

/** Wie viele Glossar-Einträge pro Scroll-Schub nachgeladen werden. */
export const LIST_CHUNK = 40;
export const RECENTS_LIMIT = 20;
