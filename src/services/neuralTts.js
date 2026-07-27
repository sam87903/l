/**
 * Neuronale Sprachausgabe im Browser (Piper/VITS, ohne API-Schlüssel).
 *
 * Die Bibliothek und das deutsche Stimmmodell (Kerstin, weiblich) werden per
 * CDN geladen und danach im Browser gespeichert. Es fließen keine Zugangsdaten
 * und keine Kosten – gerechnet wird lokal auf dem Gerät.
 *
 * Warum das wackelig ist – die Bibliothek braucht vier fremde Hosts:
 *   1. die Bibliothek selbst (CDN)
 *   2. huggingface.co für das Stimmmodell (~20 MB)
 *   3. cdnjs.cloudflare.com für die ONNX-Laufzeit (WebAssembly)
 *   4. cdn.jsdelivr.net für den Phonemizer (WebAssembly)
 * Fällt einer davon aus oder blockiert das Netz ihn, gibt es keine KI-Stimme.
 * Deshalb bleibt die Gerätestimme der verlässliche Weg, und Fehler werden
 * hier mit Klartext gemeldet statt still verschluckt.
 */

/**
 * Ladequellen in der Reihenfolge der Zuverlässigkeit.
 *
 * esm.sh steht vorn, weil jsDelivrs „+esm" die interne Aufteilung des Pakets
 * bricht: Das Bundle lädt intern per relativem Pfad `./piper-*.js` nach, und
 * unter der +esm-Adresse zeigt dieser Pfad ins Leere. esm.sh löst sowohl die
 * relativen Teile als auch die Abhängigkeit onnxruntime-web korrekt auf.
 */
const SOURCES = [
  "https://esm.sh/@diffusionstudio/vits-web@1.0.3",
  "https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm",
];

/** Standard-Stimme: Kerstin – deutsche neuronale Frauenstimme. */
export const NEURAL_VOICE = "de_DE-kerstin-low";

const READY_KEY = "mrk7-voice-ready";

let enginePromise = null;
/** Zuletzt aufgetretener Ladefehler im Klartext – für die Anzeige. */
let lastError = null;

export const neuralError = () => lastError;

/**
 * Mehrfädiges WebAssembly braucht SharedArrayBuffer, und das setzt Header
 * voraus (COOP/COEP), die eine statisch gehostete Seite nicht senden kann.
 * Die Bibliothek stellt die Fadenzahl ungefragt auf `hardwareConcurrency`.
 * Indem wir diesen Wert vorher auf 1 setzen, bleibt sie einfädig – langsamer,
 * aber überhaupt lauffähig.
 */
function forceSingleThread() {
  try {
    if (navigator.hardwareConcurrency === 1) return;
    Object.defineProperty(navigator, "hardwareConcurrency", {
      value: 1,
      configurable: true,
    });
  } catch {
    /* Lässt sich nicht überschreiben – dann eben mit dem Standardwert */
  }
}

/** Bibliothek einmalig laden, mit Ausweichquelle. */
async function engine() {
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    forceSingleThread();
    const fehler = [];
    for (const url of SOURCES) {
      try {
        const mod = await import(/* @vite-ignore */ url);
        if (typeof mod?.predict !== "function") throw new Error("unerwarteter Aufbau");
        lastError = null;
        return mod;
      } catch (err) {
        fehler.push(`${new URL(url).host}: ${err?.message || err}`);
      }
    }
    lastError = `KI-Bibliothek nicht ladbar – ${fehler.join(" · ")}`;
    throw new Error(lastError);
  })();
  enginePromise = enginePromise.catch((err) => {
    enginePromise = null; // erneuten Versuch erlauben
    throw err;
  });
  return enginePromise;
}

/** Merken, dass das Modell lokal liegt – ohne Netz nachschlagbar. */
const markStored = (voiceId) => {
  try {
    localStorage.setItem(READY_KEY, voiceId);
  } catch {
    /* Speicher nicht verfügbar – dann eben ohne Merker */
  }
};

/**
 * Liegt das Stimmmodell schon lokal?
 *
 * Bewusst nur über einen lokalen Merker – die Bibliothek allein zum
 * Nachschauen vom CDN zu laden würde offline scheitern und im Flugzeug
 * bei jedem Blick in den Reise-Check einen Netzwerkfehler erzeugen.
 */
export function isNeuralVoiceStored(voiceId = NEURAL_VOICE) {
  try {
    return localStorage.getItem(READY_KEY) === voiceId;
  } catch {
    return false;
  }
}

/**
 * Stellt sicher, dass das Stimmmodell verfügbar ist. Beim ersten Mal wird es
 * heruntergeladen (Fortschritt 0–100 über onProgress), danach aus dem
 * Browser-Speicher geladen.
 */
export async function ensureNeuralVoice(voiceId = NEURAL_VOICE, onProgress) {
  const tts = await engine();
  try {
    const stored = await tts.stored();
    if (Array.isArray(stored) && stored.includes(voiceId)) {
      markStored(voiceId);
      onProgress?.(100);
      return;
    }
  } catch {
    /* Speicherabfrage nicht möglich (z. B. Safari) – dann eben herunterladen */
  }
  await tts.download(voiceId, (p) => {
    if (onProgress && p && p.total) onProgress(Math.min(100, Math.round((p.loaded / p.total) * 100)));
  });
  markStored(voiceId);
}

/** Synthetisiert einen Textabschnitt und liefert eine Object-URL (WAV). */
export async function synthNeural(text, voiceId = NEURAL_VOICE) {
  const tts = await engine();
  const wav = await tts.predict({ text, voiceId });
  return URL.createObjectURL(wav);
}

/**
 * Selbsttest für die Fehlersuche: prüft der Reihe nach, woran es hakt, und
 * gibt jeden Schritt im Klartext zurück. Ohne diesen Bericht bliebe im
 * Fehlerfall nur „geht nicht" – und das ließe sich aus der Ferne nicht lösen.
 */
export async function diagnoseNeuralVoice(voiceId = NEURAL_VOICE) {
  const schritte = [];
  // „info" markiert Punkte, die nur bremsen – als Fehler wären sie irreführend.
  const add = (name, ok, info = "", level) =>
    schritte.push({ name, ok, info, level: level ?? (ok ? "ok" : "fail") });

  add("Internet", typeof navigator === "undefined" || navigator.onLine !== false);
  add("WebAssembly", typeof WebAssembly !== "undefined");
  const sab = typeof SharedArrayBuffer !== "undefined";
  add("Mehrere Rechenkerne", sab, sab ? "" : "nicht verfügbar – rechnet einfädig, also langsamer", sab ? "ok" : "info");
  const opfs = typeof navigator !== "undefined" && !!navigator.storage?.getDirectory;
  add("Modell dauerhaft ablegbar", opfs,
    opfs ? "Safari kann trotzdem scheitern – dann lädt es bei jedem Start neu" : "Modell wird jedes Mal neu geladen",
    "info");

  let tts = null;
  try {
    tts = await engine();
    add("KI-Bibliothek geladen", true);
  } catch (err) {
    add("KI-Bibliothek geladen", false, err?.message || String(err));
    return schritte;
  }

  try {
    await tts.download(voiceId, () => {});
    markStored(voiceId);
    add("Stimmmodell geladen", true);
  } catch (err) {
    add("Stimmmodell geladen", false, err?.message || String(err));
    return schritte;
  }

  try {
    const wav = await tts.predict({ text: "Test.", voiceId });
    add("Sprachausgabe erzeugt", wav instanceof Blob && wav.size > 0, `${Math.round((wav?.size || 0) / 1024)} kB`);
  } catch (err) {
    add("Sprachausgabe erzeugt", false, err?.message || String(err));
  }
  return schritte;
}
