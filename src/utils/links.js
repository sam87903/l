/** URL-Helfer für externe Lernressourcen. */

export const BOOK = "https://drive.google.com/file/d/1zu9nR85-tedUw2c074pIm2S_KQdy-kWw/view";

/** Deges-Buch auf einer bestimmten PDF-Seite öffnen (?pli=1 erzwingt Reload). */
export const B = (page) => `${BOOK}?pli=1#page=${page}`;

export const YT = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

/** Studyflix-Inhalte zuverlässig über die YouTube-Suche finden. */
export const SF = (q) => YT("Studyflix " + q);

export const K = (q) => `https://knowunity.de/knows?q=${encodeURIComponent(q)}`;
export const DOC = (q) => `https://www.studocu.com/de/search?q=${encodeURIComponent(q)}`;
export const QZ = (q) => `https://quizlet.com/de/search?query=${encodeURIComponent(q)}&type=sets`;
