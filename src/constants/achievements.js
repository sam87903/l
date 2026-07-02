/**
 * Erfolge (Badges). `test` erhält das Stats-Objekt aus dem ProgressContext
 * und liefert true, sobald der Erfolg freigeschaltet ist.
 */
export const ACHIEVEMENTS = [
  { id: "first-day",   icon: "🌱", title: "Erster Schritt",   desc: "Ersten Lerntag abgeschlossen",          test: (s) => s.doneCount >= 1 },
  { id: "week-one",    icon: "📊", title: "Woche gemeistert", desc: "7 Lerntage abgeschlossen",              test: (s) => s.doneCount >= 7 },
  { id: "plan-done",   icon: "🏁", title: "Marokko-Champion", desc: "Alle 21 Tage des Plans abgeschlossen",  test: (s) => s.doneCount >= s.total },
  { id: "cards-10",    icon: "🃏", title: "Kartenkenner",     desc: "10 Lernkarten gewusst",                 test: (s) => s.knownTotal >= 10 },
  { id: "cards-50",    icon: "🎴", title: "Kartenmeister",    desc: "50 Lernkarten gewusst",                 test: (s) => s.knownTotal >= 50 },
  { id: "quiz-first",  icon: "🧩", title: "Quiz-Starter",     desc: "Erstes Quiz abgeschlossen",             test: (s) => s.quizCount >= 1 },
  { id: "quiz-gold",   icon: "🏆", title: "Perfektionist",    desc: "Ein Quiz fehlerfrei gelöst",            test: (s) => s.quizzesPerfect >= 1 },
  { id: "quiz-crown",  icon: "👑", title: "Quiz-König",       desc: "5 Quizze fehlerfrei gelöst",            test: (s) => s.quizzesPerfect >= 5 },
  { id: "streak-3",    icon: "🔥", title: "Dranbleiber",      desc: "3 Tage Lern-Streak",                    test: (s) => s.streak >= 3 },
  { id: "streak-7",    icon: "🚀", title: "Unaufhaltsam",     desc: "7 Tage Lern-Streak",                    test: (s) => s.streak >= 7 },
  { id: "focus-100",   icon: "⏱️", title: "Fokus-Profi",      desc: "100 Fokus-Minuten gesammelt",           test: (s) => s.focusTotal >= 100 },
  { id: "fav-10",      icon: "⭐", title: "Sammler",          desc: "10 Glossar-Favoriten markiert",         test: (s) => s.favCount >= 10 },
  { id: "mistake-10",  icon: "🔁", title: "Aus Fehlern gelernt", desc: "10 Fehler-Fragen gemeistert",        test: (s) => s.mastered >= 10 },
];
