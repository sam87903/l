/**
 * Neuronale Sprachausgabe im Browser (Piper/VITS, ohne API-Schlüssel).
 *
 * Läuft ausschließlich online: Die Bibliothek und das deutsche Stimmmodell
 * (Kerstin, weiblich) werden per CDN geladen und danach im Browser gespeichert
 * (IndexedDB). Es fließen keine Zugangsdaten und keine Kosten – gerechnet wird
 * lokal auf dem Gerät. Alles ist optional: Schlägt der Download, die Bibliothek
 * oder die Synthese fehl, wirft die Funktion, und der Aufrufer fällt auf die
 * Gerätestimme (Web Speech API) zurück.
 *
 * Bewusst per dynamischem Import von einer festen URL geladen, damit weder die
 * schwere Laufzeit noch das Modell in die Offline-HTML-Datei wandern.
 */

// Gebündeltes ES-Modul inkl. onnxruntime-web über jsDelivr.
const CDN = "https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm";

/** Standard-Stimme: Kerstin – deutsche neuronale Frauenstimme. */
export const NEURAL_VOICE = "de_DE-kerstin-low";

let enginePromise = null;

/** Bibliothek einmalig laden (gecacht). Wirft, wenn offline oder blockiert. */
async function engine() {
  if (!enginePromise) {
    enginePromise = import(/* @vite-ignore */ CDN).catch((err) => {
      enginePromise = null; // erneuten Versuch erlauben
      throw err;
    });
  }
  return enginePromise;
}

/**
 * Stellt sicher, dass das Stimmmodell verfügbar ist. Beim ersten Mal wird es
 * heruntergeladen (Fortschritt 0–100 über onProgress), danach aus dem Cache
 * geladen.
 */
export async function ensureNeuralVoice(voiceId = NEURAL_VOICE, onProgress) {
  const tts = await engine();
  const stored = await tts.stored();
  if (Array.isArray(stored) && stored.includes(voiceId)) {
    onProgress?.(100);
    return;
  }
  await tts.download(voiceId, (p) => {
    if (onProgress && p && p.total) onProgress(Math.min(100, Math.round((p.loaded / p.total) * 100)));
  });
}

/** Synthetisiert einen Textabschnitt und liefert eine Object-URL (WAV). */
export async function synthNeural(text, voiceId = NEURAL_VOICE) {
  const tts = await engine();
  const wav = await tts.predict({ text, voiceId });
  return URL.createObjectURL(wav);
}
