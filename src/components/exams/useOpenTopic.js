import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Öffnet ein Klausurthema zum gezielten Lernen: Ist der Begriff im Glossar,
 * springt es zur Definition (vorgefilterte Glossar-Suche); sonst – wenn das
 * zugehörige Modul ein Quiz hat – ins passende Quiz. Fallback: Glossar-Suche.
 */
export function useOpenTopic() {
  const navigate = useNavigate();
  return useCallback(
    (item) => {
      if (!item.inGlossary && item.module?.quiz?.length) {
        navigate("/plan", { state: { openQuizSection: true, openQuiz: item.module.id } });
      } else {
        navigate("/glossar", { state: { query: item.term } });
      }
    },
    [navigate]
  );
}
