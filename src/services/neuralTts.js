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
 *   4. cdn.jsdelivr.net für den Phonemizer (WebAssembly, zusätzlich 17 MB Daten)
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

/**
 * Zeitgrenzen. Ohne sie bleibt die App stumm stehen statt einen Fehler zu
 * zeigen – und genau so fühlte es sich an: „Start" gedrückt, nichts passiert.
 * Der erste Satz bekommt deutlich mehr Zeit, weil dabei einmalig die
 * Phonemizer-Daten (17 MB) nachgeladen werden; danach reicht ein Bruchteil.
 */
const TIMEOUT = { laden: 35000, modell: 240000, ersterSatz: 120000, sprechen: 45000 };

/** Promise mit Zeitgrenze – nach `ms` wird mit Klartext abgebrochen. */
function mitFrist(promise, ms, was) {
  let uhr;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      uhr = setTimeout(() => reject(new Error(`${was} hat zu lange gebraucht (${Math.round(ms / 1000)} s)`)), ms);
    }),
  ]).finally(() => clearTimeout(uhr));
}

/* ════════════════════════════════════════════════════════════════════
   Hintergrundprozess (Web Worker)

   Der eigentliche Grund, warum die KI-Stimme bisher stumm blieb: Die
   Bibliothek ist für einen Worker geschrieben. Sie erkennt die Umgebung an
   `importScripts`, und ihr Emscripten-Lader holt die 17 MB Phonemizer-Daten
   mit einem *synchronen* XMLHttpRequest. Auf dem Hauptfaden ist genau das
   in modernen Browsern eingeschränkt bis verboten – der Aufruf kehrte nie
   zurück, also blieb die Wiedergabe ewig „am Rechnen".

   Im Worker ist synchrones Laden erlaubt, und ganz nebenbei blockiert das
   Rechnen nicht mehr die Oberfläche. Der Worker wird aus einer Blob-URL
   erzeugt, damit die App eine einzelne HTML-Datei bleiben kann.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Quelltext des Hintergrundprozesses. Exportiert, damit ein Test ihn auf
 * Syntaxfehler prüfen kann – als Zeichenkette fällt ein Tippfehler sonst
 * erst im Browser auf, und dort nur als stumme Stimme.
 */
export const NEURAL_WORKER_SRC = `
const SOURCES = ${JSON.stringify(SOURCES)};
let modPromise = null;

async function lib() {
  if (modPromise) return modPromise;
  modPromise = (async () => {
    const fehler = [];
    for (const url of SOURCES) {
      try {
        const m = await import(url);
        if (typeof m.predict !== "function") throw new Error("unerwarteter Aufbau");
        return m;
      } catch (err) {
        fehler.push(new URL(url).host + ": " + ((err && err.message) || err));
      }
    }
    throw new Error("KI-Bibliothek nicht ladbar - " + fehler.join(" | "));
  })();
  modPromise = modPromise.catch((err) => { modPromise = null; throw err; });
  return modPromise;
}

self.onmessage = async (ev) => {
  const d = ev.data || {};
  const id = d.id;
  try {
    const tts = await lib();
    if (d.cmd === "stored") {
      let liste = [];
      try { liste = await tts.stored(); } catch (e) { liste = []; }
      self.postMessage({ id, ok: true, stored: liste });
    } else if (d.cmd === "download") {
      await tts.download(d.voiceId, (p) => {
        if (p && p.total) self.postMessage({ id, progress: Math.min(100, Math.round((p.loaded / p.total) * 100)) });
      });
      self.postMessage({ id, ok: true });
    } else if (d.cmd === "predict") {
      const wav = await tts.predict({ text: d.text, voiceId: d.voiceId });
      const buf = await wav.arrayBuffer();
      self.postMessage({ id, ok: true, wav: buf }, [buf]);
    } else {
      self.postMessage({ id, ok: false, error: "unbekannter Befehl" });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err && err.message) || String(err) });
  }
};
`;

let workerHandle = null;
/** Ist der Worker als Ganzes gescheitert (z. B. Modul-Worker nicht erlaubt)? */
let workerFatal = false;
/** Welcher Weg zuletzt benutzt wurde – für den Selbsttest. */
let backendName = "unbestimmt";

export const neuralBackend = () => backendName;

function makeWorker() {
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL?.createObjectURL !== "function") {
    return null;
  }
  try {
    const url = URL.createObjectURL(new Blob([NEURAL_WORKER_SRC], { type: "text/javascript" }));
    const w = new Worker(url, { type: "module" });
    const offen = new Map();

    w.onmessage = (ev) => {
      const d = ev.data || {};
      const eintrag = offen.get(d.id);
      if (!eintrag) return;
      if (typeof d.progress === "number") {
        eintrag.onProgress?.(d.progress);
        return;
      }
      offen.delete(d.id);
      if (d.ok) eintrag.resolve(d);
      else eintrag.reject(new Error(d.error || "unbekannter Fehler im Hintergrundprozess"));
    };

    // Startet der Worker gar nicht erst (alte Browser ohne Modul-Worker),
    // meldet sich nur dieses Ereignis. Dann gilt der Weg als tot und der
    // Hauptfaden übernimmt – lieber langsam als gar nicht.
    w.onerror = (ev) => {
      workerFatal = true;
      const fehler = new Error(ev?.message || "Hintergrundprozess nicht startbar");
      offen.forEach((e) => e.reject(fehler));
      offen.clear();
    };
    w.onmessageerror = () => {
      workerFatal = true;
    };

    let n = 0;
    return {
      ruf(cmd, payload = {}, onProgress) {
        return new Promise((resolve, reject) => {
          const id = ++n;
          offen.set(id, { resolve, reject, onProgress });
          try {
            w.postMessage({ id, cmd, ...payload });
          } catch (err) {
            offen.delete(id);
            workerFatal = true;
            reject(err);
          }
        });
      },
    };
  } catch {
    return null;
  }
}

function worker() {
  if (workerFatal) return null;
  if (!workerHandle) workerHandle = makeWorker();
  return workerHandle;
}

/* ── Ausweichweg: dieselbe Bibliothek direkt auf dem Hauptfaden ── */

let enginePromise = null;

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
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 1, configurable: true });
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
        const mod = await mitFrist(import(/* @vite-ignore */ url), TIMEOUT.laden, "Laden der KI-Bibliothek");
        if (typeof mod?.predict !== "function") throw new Error("unerwarteter Aufbau");
        return mod;
      } catch (err) {
        fehler.push(`${new URL(url).host}: ${err?.message || err}`);
      }
    }
    throw new Error(`KI-Bibliothek nicht ladbar – ${fehler.join(" · ")}`);
  })();
  enginePromise = enginePromise.catch((err) => {
    enginePromise = null; // erneuten Versuch erlauben
    throw err;
  });
  return enginePromise;
}

async function aufHauptfaden(cmd, payload = {}, onProgress) {
  backendName = "Hauptfaden";
  const tts = await engine();
  if (cmd === "stored") {
    try {
      return { stored: await tts.stored() };
    } catch {
      return { stored: [] };
    }
  }
  if (cmd === "download") {
    await tts.download(payload.voiceId, (p) => {
      if (p && p.total) onProgress?.(Math.min(100, Math.round((p.loaded / p.total) * 100)));
    });
    return {};
  }
  if (cmd === "predict") {
    const wav = await tts.predict({ text: payload.text, voiceId: payload.voiceId });
    return { wav: await wav.arrayBuffer() };
  }
  throw new Error("unbekannter Befehl");
}

/**
 * Einen Befehl ausführen – bevorzugt im Worker. Nur wenn der Worker als
 * Ganzes nicht anspringt, wird auf den Hauptfaden ausgewichen. Ein fachlicher
 * Fehler (offline, Modell nicht ladbar) wird dagegen durchgereicht: Ihn auf
 * dem Hauptfaden zu wiederholen würde nur dieselbe Zeit erneut verbrennen.
 */
async function ruf(cmd, payload, onProgress) {
  const w = worker();
  if (w) {
    try {
      backendName = "Hintergrundprozess";
      return await w.ruf(cmd, payload, onProgress);
    } catch (err) {
      if (!workerFatal) throw err;
      workerHandle = null;
    }
  }
  return aufHauptfaden(cmd, payload, onProgress);
}

/* ════════════════════ Merker ════════════════════ */

const READY_KEY = "mrk7-voice-ready";

/** Merken, dass das Modell lokal liegt – ohne Netz nachschlagbar. */
const markStored = (voiceId) => {
  try {
    localStorage.setItem(READY_KEY, voiceId);
  } catch {
    /* Speicher nicht verfügbar – dann eben ohne Merker */
  }
};

/*
 * Zwei getrennte Merker, und das mit Absicht: Ein heruntergeladenes Modell
 * heißt noch lange nicht, dass die Sprachausgabe funktioniert – genau diese
 * Verwechslung ließ die App „Stimme geladen, startet sofort" behaupten,
 * während nichts zu hören war. Erst wenn wirklich Ton entstanden ist, gilt
 * die KI-Stimme als erprobt.
 */
const SPOKEN_KEY = "mrk7-voice-works";

const markSpoken = () => {
  try {
    localStorage.setItem(SPOKEN_KEY, "1");
  } catch {
    /* ohne Merker weiter */
  }
};

/** Hat die KI-Stimme auf diesem Gerät schon einmal nachweislich gesprochen? */
export function neuralVoiceProven() {
  try {
    return localStorage.getItem(SPOKEN_KEY) === "1";
  } catch {
    return false;
  }
}

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

/* ════════════════════ Öffentliche Schnittstelle ════════════════════ */

/**
 * Stellt sicher, dass das Stimmmodell verfügbar ist. Beim ersten Mal wird es
 * heruntergeladen (Fortschritt 0–100 über onProgress), danach aus dem
 * Browser-Speicher geladen.
 */
export async function ensureNeuralVoice(voiceId = NEURAL_VOICE, onProgress) {
  try {
    const { stored } = await mitFrist(ruf("stored", { voiceId }), TIMEOUT.laden, "Laden der KI-Bibliothek");
    if (Array.isArray(stored) && stored.includes(voiceId)) {
      markStored(voiceId);
      onProgress?.(100);
      return;
    }
  } catch (err) {
    // Ließ sich die Bibliothek nicht einmal laden, ist auch der Download
    // aussichtslos – dann lieber sofort mit dem echten Grund abbrechen.
    if (/nicht ladbar|zu lange/.test(err?.message || "")) throw err;
  }
  await mitFrist(ruf("download", { voiceId }, onProgress), TIMEOUT.modell, "Herunterladen des Stimmmodells");
  markStored(voiceId);
}

/** Synthetisiert einen Textabschnitt und liefert eine Object-URL (WAV). */
export async function synthNeural(text, voiceId = NEURAL_VOICE) {
  const frist = neuralVoiceProven() ? TIMEOUT.sprechen : TIMEOUT.ersterSatz;
  const { wav } = await mitFrist(ruf("predict", { text, voiceId }), frist, "Erzeugen der Sprachausgabe");
  if (!wav || wav.byteLength === 0) throw new Error("Sprachausgabe blieb leer");
  markSpoken();
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

/**
 * Selbsttest für die Fehlersuche: prüft der Reihe nach, woran es hakt, und
 * gibt jeden Schritt im Klartext zurück. Ohne diesen Bericht bliebe im
 * Fehlerfall nur „geht nicht" – und das ließe sich aus der Ferne nicht lösen.
 */
export async function diagnoseNeuralVoice(voiceId = NEURAL_VOICE, onStep) {
  const schritte = [];
  // „info" markiert Punkte, die nur bremsen – als Fehler wären sie irreführend.
  // onStep meldet jeden Schritt sofort: Der Modell-Download kann Minuten
  // dauern, und ein Knopf, der so lange nur „Prüfe …" sagt, wirkt hängend.
  const add = (name, ok, info = "", level) => {
    schritte.push({ name, ok, info, level: level ?? (ok ? "ok" : "fail") });
    onStep?.([...schritte]);
  };

  add("Internet", typeof navigator === "undefined" || navigator.onLine !== false);
  add("WebAssembly", typeof WebAssembly !== "undefined");
  const sab = typeof SharedArrayBuffer !== "undefined";
  add("Mehrere Rechenkerne", sab, sab ? "" : "nicht verfügbar – rechnet einfädig, also langsamer", sab ? "ok" : "info");
  const opfs = typeof navigator !== "undefined" && !!navigator.storage?.getDirectory;
  add("Modell dauerhaft ablegbar", opfs,
    opfs ? "Safari kann trotzdem scheitern – dann lädt es bei jedem Start neu" : "Modell wird jedes Mal neu geladen",
    "info");

  try {
    await mitFrist(ruf("stored", { voiceId }), TIMEOUT.laden, "Laden der KI-Bibliothek");
    add("KI-Bibliothek geladen", true, `Weg: ${backendName}`);
  } catch (err) {
    add("KI-Bibliothek geladen", false, err?.message || String(err));
    return schritte;
  }

  try {
    await mitFrist(ruf("download", { voiceId }), TIMEOUT.modell, "Herunterladen des Stimmmodells");
    markStored(voiceId);
    add("Stimmmodell geladen", true);
  } catch (err) {
    add("Stimmmodell geladen", false, err?.message || String(err));
    return schritte;
  }

  try {
    const { wav } = await mitFrist(
      ruf("predict", { text: "Test.", voiceId }),
      TIMEOUT.ersterSatz,
      "Erzeugen der Sprachausgabe"
    );
    const gut = !!wav && wav.byteLength > 0;
    if (gut) markSpoken();
    add("Sprachausgabe erzeugt", gut, `${Math.round((wav?.byteLength || 0) / 1024)} kB`);
  } catch (err) {
    add("Sprachausgabe erzeugt", false, err?.message || String(err));
  }
  return schritte;
}
