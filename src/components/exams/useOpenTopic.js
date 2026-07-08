import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GLOSSARY } from "../../data/glossary.js";

/**
 * Öffnet ein Klausurthema zum gezielten Lernen: Ist der Begriff im Glossar,
 * springt es zur Definition (vorgefilterte Suche + automatisch aufgeklappt);
 * sonst – wenn das zugehörige Modul ein Quiz hat – ins passende Quiz.
 */
export function useOpenTopic() {
  const navigate = useNavigate();
  return useCallback(
    (item) => {
      if (!item.inGlossary && item.module?.quiz?.length) {
        navigate("/plan", { state: { openQuizSection: true, openQuiz: item.module.id } });
        return;
      }
      // Kanonische Glossar-Schreibweise auflösen (z. B. „kritische Masse" → „Kritische Masse")
      const term =
        Object.keys(GLOSSARY).find((k) => k.toLowerCase() === item.term.toLowerCase()) ?? item.term;
      navigate("/glossar", { state: { query: term, openTerm: term } });
    },
    [navigate]
  );
}
