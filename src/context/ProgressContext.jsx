import { createContext, useCallback, useContext, useMemo } from "react";
import { useStoredState } from "../hooks/useStoredState.js";
import { DEFAULT_START_DATE, EXAM_TEXT_LIMIT, MASTERY_STREAK, RECENTS_LIMIT, STORAGE_KEYS, XP_RULES } from "../constants/config.js";
import { PLAN } from "../data/plan.js";
import { computeStreak, computeXp, levelInfo } from "../utils/xp.js";
import { todayISO } from "../utils/dates.js";

const ProgressContext = createContext(null);

const DEFAULT_SETTINGS = { sound: true, notifications: false };

/**
 * Zentraler Lernfortschritt: abgehakte Tage, Quiz-Bestscores, gewusste
 * Lernkarten, Favoriten, Aktivitätslog (Streak/Heatmap) und Einstellungen.
 */
export function ProgressProvider({ children }) {
  const [doneDays, setDoneDays, l1] = useStoredState(STORAGE_KEYS.doneDays, {});
  const [startDate, setStartDate, l2] = useStoredState(STORAGE_KEYS.startDate, DEFAULT_START_DATE, { raw: true });
  const [quizBest, setQuizBest, l3] = useStoredState(STORAGE_KEYS.quizBest, {});
  const [fcKnown, setFcKnown, l4] = useStoredState(STORAGE_KEYS.flashcards, {});
  const [favorites, setFavorites, l5] = useStoredState(STORAGE_KEYS.favorites, []);
  const [recents, setRecents, l6] = useStoredState(STORAGE_KEYS.recents, []);
  const [activity, setActivity, l7] = useStoredState(STORAGE_KEYS.activity, {});
  const [settings, setSettings, l8] = useStoredState(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [wrongPool, setWrongPool, l9] = useStoredState(STORAGE_KEYS.wrongPool, {});
  const [mastered, setMastered, l10] = useStoredState(STORAGE_KEYS.mastered, 0);
  const [exams, setExams, l11] = useStoredState(STORAGE_KEYS.exams, []);

  const ready = l1 && l2 && l3 && l4 && l5 && l6 && l7 && l8 && l9 && l10 && l11;

  const logActivity = useCallback(
    (minutes) => {
      const iso = todayISO();
      setActivity((a) => ({ ...a, [iso]: (a[iso] || 0) + minutes }));
    },
    [setActivity]
  );

  const toggleDay = useCallback(
    (nr) => {
      setDoneDays((d) => {
        const nowDone = !d[nr];
        if (nowDone) logActivity(XP_RULES.minutesPerDay);
        return { ...d, [nr]: nowDone };
      });
    },
    [setDoneDays, logActivity]
  );

  const saveQuizResult = useCallback(
    (modId, correct, totalQ) => {
      setQuizBest((q) => {
        const prev = q[modId];
        if (prev && prev.c >= correct) return q;
        return { ...q, [modId]: { c: correct, t: totalQ } };
      });
      logActivity(2);
    },
    [setQuizBest, logActivity]
  );

  const setKnownCard = useCallback(
    (modId, index, isKnown) => {
      setFcKnown((f) => {
        const set = new Set(f[modId] || []);
        isKnown ? set.add(index) : set.delete(index);
        return { ...f, [modId]: [...set] };
      });
      if (isKnown) logActivity(1);
    },
    [setFcKnown, logActivity]
  );

  const toggleFavorite = useCallback(
    (term) => setFavorites((f) => (f.includes(term) ? f.filter((t) => t !== term) : [...f, term])),
    [setFavorites]
  );

  const pushRecent = useCallback(
    (term) => setRecents((r) => [term, ...r.filter((t) => t !== term)].slice(0, RECENTS_LIMIT)),
    [setRecents]
  );

  const addFocusMinutes = useCallback((minutes) => logActivity(minutes), [logActivity]);

  /**
   * Fehler-Kartei: falsche Antworten landen im Pool; MASTERY_STREAK
   * richtige Antworten in Folge meistern die Frage (Leitner-Prinzip).
   */
  const recordAnswer = useCallback(
    (modId, questionIndex, wasCorrect) => {
      const key = `${modId}#${questionIndex}`;
      const current = wrongPool[key];
      if (wasCorrect) {
        if (!current) return;
        const streak = (current.streak ?? 0) + 1;
        if (streak >= MASTERY_STREAK) {
          const next = { ...wrongPool };
          delete next[key];
          setWrongPool(next);
          setMastered((m) => m + 1);
          logActivity(1);
        } else {
          setWrongPool({ ...wrongPool, [key]: { ...current, streak } });
        }
      } else {
        setWrongPool({
          ...wrongPool,
          [key]: { modId, qi: questionIndex, misses: (current?.misses ?? 0) + 1, streak: 0 },
        });
      }
    },
    [wrongPool, setWrongPool, setMastered, logActivity]
  );

  /** Altklausuren speichern/entfernen (für die Muster-Analyse). */
  const addExam = useCallback(
    (name, text) => {
      const exam = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || "Unbenannte Klausur",
        addedAt: new Date().toISOString(),
        text: text.slice(0, EXAM_TEXT_LIMIT),
      };
      setExams((list) => [exam, ...list]);
      logActivity(2);
      return exam.id;
    },
    [setExams, logActivity]
  );

  const removeExam = useCallback(
    (id) => setExams((list) => list.filter((e) => e.id !== id)),
    [setExams]
  );

  const stats = useMemo(() => {
    const doneCount = Object.values(doneDays).filter(Boolean).length;
    const knownTotal = Object.values(fcKnown).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    const quizzesPerfect = Object.values(quizBest).filter((b) => b.c === b.t).length;
    const focusTotal = Object.values(activity).reduce((sum, m) => sum + m, 0);
    const base = {
      doneCount,
      total: PLAN.length,
      knownTotal,
      quizzesPerfect,
      quizCount: Object.keys(quizBest).length,
      focusTotal,
      favCount: favorites.length,
      streak: computeStreak(activity),
      mastered,
      mistakesOpen: Object.keys(wrongPool).length,
    };
    const xp = computeXp(base);
    return { ...base, xp, ...levelInfo(xp) };
  }, [doneDays, fcKnown, quizBest, activity, favorites, mastered, wrongPool]);

  const exportData = useCallback(
    () => ({
      app: "marokko-lernplan",
      version: 3,
      exportedAt: new Date().toISOString(),
      startDate, doneDays, quizBest, fcKnown, favorites, recents, activity, settings,
      wrongPool, mastered, exams,
    }),
    [startDate, doneDays, quizBest, fcKnown, favorites, recents, activity, settings, wrongPool, mastered, exams]
  );

  const importData = useCallback(
    (data) => {
      if (data.startDate) setStartDate(data.startDate);
      if (data.doneDays) setDoneDays(data.doneDays);
      if (data.quizBest) setQuizBest(data.quizBest);
      if (data.fcKnown) setFcKnown(data.fcKnown);
      if (Array.isArray(data.favorites)) setFavorites(data.favorites);
      if (Array.isArray(data.recents)) setRecents(data.recents);
      if (data.activity) setActivity(data.activity);
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.wrongPool) setWrongPool(data.wrongPool);
      if (typeof data.mastered === "number") setMastered(data.mastered);
      if (Array.isArray(data.exams)) setExams(data.exams);
    },
    [setStartDate, setDoneDays, setQuizBest, setFcKnown, setFavorites, setRecents, setActivity, setSettings, setWrongPool, setMastered, setExams]
  );

  const resetAll = useCallback(() => {
    setDoneDays({});
    setQuizBest({});
    setFcKnown({});
    setFavorites([]);
    setRecents([]);
    setActivity({});
    setSettings(DEFAULT_SETTINGS);
    setStartDate(DEFAULT_START_DATE);
    setWrongPool({});
    setMastered(0);
    setExams([]);
  }, [setDoneDays, setQuizBest, setFcKnown, setFavorites, setRecents, setActivity, setSettings, setStartDate, setWrongPool, setMastered, setExams]);

  const value = useMemo(
    () => ({
      ready, stats,
      doneDays, toggleDay,
      startDate, setStartDate,
      quizBest, saveQuizResult,
      fcKnown, setKnownCard,
      favorites, toggleFavorite,
      recents, pushRecent,
      activity, addFocusMinutes,
      settings, setSettings,
      wrongPool, recordAnswer,
      exams, addExam, removeExam,
      exportData, importData, resetAll,
    }),
    [ready, stats, doneDays, toggleDay, startDate, setStartDate, quizBest, saveQuizResult,
     fcKnown, setKnownCard, favorites, toggleFavorite, recents, pushRecent, activity,
     addFocusMinutes, settings, setSettings, wrongPool, recordAnswer, exams, addExam,
     removeExam, exportData, importData, resetAll]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress muss innerhalb von <ProgressProvider> verwendet werden");
  return ctx;
}
