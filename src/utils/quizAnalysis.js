/**
 * Lokale Lernanalyse nach einem Quiz: ordnet Fragen den Modulthemen zu,
 * erkennt Stärken/Wissenslücken und priorisiert, was zuerst zu lernen ist.
 */

const wordSet = (text) =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-zä-üß]+/i)
      .filter((w) => w.length >= 5)
  );

/** Bestpassendes Modulthema zu einer Quizfrage (Keyword-Überlappung). */
export function topicForQuestion(module, question) {
  if (question.topic) return question.topic;
  const questionWords = [...wordSet(`${question.q} ${question.options.join(" ")}`)];
  let best = null;
  let bestScore = 0;
  for (const topic of module.topics ?? []) {
    const topicWords = wordSet(`${topic.t} ${(topic.def ?? "").slice(0, 400)}`);
    const score = questionWords.filter((w) => topicWords.has(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = topic.t;
    }
  }
  return best ?? module.name;
}

const correctIndex = (q) => (Array.isArray(q.corrects) ? q.corrects[0] : q.correct);

/** Vollständige Auswertung eines beendeten Quiz. */
export function buildQuizAnalysis(module, questions, answers) {
  const rows = questions.map((q, qi) => {
    const picked = answers[qi];
    const ok = picked === correctIndex(q);
    return {
      qi,
      ok,
      topic: topicForQuestion(module, q),
      question: q.q,
      correctText: q.options[correctIndex(q)],
      explain: q.explain,
    };
  });

  const wrong = rows.filter((r) => !r.ok);
  const right = rows.filter((r) => r.ok);
  const wrongByTopic = new Map();
  for (const r of wrong) wrongByTopic.set(r.topic, (wrongByTopic.get(r.topic) ?? 0) + 1);

  const strengths = [...new Set(right.map((r) => r.topic))].filter((t) => !wrongByTopic.has(t));
  const priorities = [...wrongByTopic.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count }));

  const score = rows.length ? right.length / rows.length : 0;
  const nextActivity =
    score === 1
      ? "Stark! Nimm dir als Nächstes die Lernkarten oder das Quiz des nächsten Moduls vor."
      : score >= 0.5
        ? "Starte das Fehler-Training (2× richtig = gemeistert) und wiederhole danach die Lernkarten dieses Moduls."
        : "Lies zuerst die Themen im Semester-Tab (Definition + Beispiel), übe dann im Fehler-Training und schließe mit den Lernkarten ab.";

  return {
    score: Math.round(score * 100),
    strengths,
    gaps: wrong,
    priorities,
    critical: priorities[0]
      ? `Besonders kritisch für die Prüfung (${module.exam}) ist: ${priorities[0].topic}.`
      : null,
    nextActivity,
  };
}

/** Prompt für eine externe KI-Tiefenanalyse (ChatGPT/Claude). */
export function buildQuizPrompt(module, questions, answers) {
  const lines = questions.map((q, qi) => {
    const picked = answers[qi];
    const ok = picked === correctIndex(q);
    return [
      `Frage ${qi + 1}: ${q.q}`,
      `  Antwort des Nutzers: ${q.options[picked] ?? "keine"} → ${ok ? "RICHTIG" : "FALSCH"}`,
      ok ? null : `  Richtige Antwort: ${q.options[correctIndex(q)]}`,
      q.explain ? `  Erklärung: ${q.explain}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return `Du bist ein Lernanalyse-Assistent für Studierende. Deine Aufgabe ist es, nach einem Quiz oder einer Übung die Antworten des Nutzers auszuwerten und konkrete Wissenslücken zu identifizieren.

Analysiere:
- welche Themen korrekt beherrscht werden
- welche Themen unsicher oder falsch sind
- welche Konzepte fehlen oder missverstanden wurden

Gib anschließend aus:
1. Stärken (kurz & konkret)
2. Wissenslücken (mit Fachbegriffen)
3. Priorisierte Lernliste (was zuerst lernen)
4. Empfohlene nächste Lernaktivität (z. B. Quiz, Zusammenfassung, Übungsaufgaben)

Antworte klar, strukturiert und ohne Floskeln. Formuliere auch:
- "Du hast Probleme mit …"
- "Besonders kritisch ist … für die Prüfung"

KONTEXT
Studiengang: B.Sc. E-Commerce (HRW)
Modul: ${module.name} (${module.code})
Prüfungsform: ${module.exam}
Modulthemen: ${(module.topics ?? []).map((t) => t.t).join("; ")}

QUIZ-ERGEBNIS DES NUTZERS
${lines.join("\n\n")}`;
}
