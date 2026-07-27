import { useCallback, useEffect, useRef, useState } from "react";
import { ensureNeuralVoice, isNeuralVoiceStored, synthNeural, NEURAL_VOICE } from "../services/neuralTts.js";

// Kurzes stilles WAV – entsperrt das Audio-Element innerhalb der Nutzergeste
// (iOS erlaubt spätere programmatische Wiedergabe nur nach einer solchen Geste).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=";

/**
 * Podcast-Wiedergabe mit neuronaler Stimme. Bietet dieselbe Schnittstelle wie
 * useSpeech (speaking, paused, index, start, pause, resume, stop), damit der
 * Player die Engine transparent tauschen kann. Synthese läuft abschnittsweise:
 * ganze Absätze werden nacheinander erzeugt und abgespielt.
 *
 * Zentral ist die Generationsnummer `genRef`: Jeder Start und jeder Stopp
 * erhöht sie. Weil das Erzeugen eines Abschnitts Sekunden dauert, können
 * mehrere Ketten gleichzeitig unterwegs sein – etwa wenn die nächste Folge
 * startet, während die alte noch rechnet. Jede Fortsetzung prüft ihre
 * Generation und bricht ab, wenn sie überholt wurde. Ohne das liefen zwei
 * Ketten parallel: Sie überschrieben sich gegenseitig die Wiedergabe und
 * zählten den Kapitelzeiger doppelt hoch.
 */
export function useNeuralPlayer({ onError } = {}) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Vorlade-Status: Modell wird einmalig heruntergeladen und im Browser
  // gecacht, damit die Wiedergabe später sofort startet. Liegt es aus einer
  // früheren Sitzung schon vor, gilt es sofort als bereit – ohne Ladeanzeige.
  const [ready, setReady] = useState(() => isNeuralVoiceStored());
  const [preloading, setPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(false);
  const preloadStartedRef = useRef(false);

  const audioRef = useRef(null);
  const segsRef = useRef([]);
  const posRef = useRef(0);
  const genRef = useRef(0);
  // Pausiert der Nutzer, während ein Abschnitt noch erzeugt wird, darf das
  // fertige Ergebnis nicht einfach losspielen – sonst „reagiert Pause nicht".
  const pausedRef = useRef(false);
  const urlRef = useRef(null);
  const doneRef = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };
  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  /** Laufende Wiedergabe entwerten und das Audio-Element stilllegen. */
  const halt = useCallback(() => {
    genRef.current += 1;
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.pause();
    }
  }, []);

  const playNext = useCallback(async () => {
    const gen = genRef.current;
    const segs = segsRef.current;
    const i = posRef.current;
    if (i >= segs.length) {
      setSpeaking(false);
      setIndex(-1);
      const done = doneRef.current;
      doneRef.current = null;
      done?.();
      return;
    }
    setIndex(segs[i].si);
    try {
      const url = await synthNeural(segs[i].t);
      // Überholt? Dann gehört das Ergebnis zu einer abgelösten Wiedergabe.
      if (gen !== genRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      revoke();
      urlRef.current = url;
      const a = ensureAudio();
      a.onended = null;
      a.src = url;
      a.onended = () => {
        if (gen !== genRef.current) return;
        posRef.current += 1;
        playNext();
      };
      // Während der Synthese pausiert: Abschnitt bereitlegen, aber warten.
      if (!pausedRef.current) await a.play().catch(() => {});
    } catch (err) {
      if (gen !== genRef.current) return;
      setSpeaking(false);
      setLoading(false);
      onErrorRef.current?.(err);
    }
  }, []);

  /**
   * Modell im Hintergrund vorladen und cachen (einmalig). Danach startet die
   * Wiedergabe ohne Wartezeit. Fehler (z. B. offline) werden still gemerkt –
   * erst beim tatsächlichen Abspielen wird auf die Gerätestimme zurückgefallen.
   */
  const preload = useCallback(() => {
    if (ready || preloadStartedRef.current) return;
    // Ohne Netz und ohne gespeichertes Modell gibt es nichts zu holen – dann
    // gar nicht erst anfragen, sonst gibt es unterwegs nur Fehlermeldungen.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPreloadError(true);
      return;
    }
    preloadStartedRef.current = true;
    setPreloading(true);
    setPreloadError(false);
    setProgress(0);
    ensureNeuralVoice(NEURAL_VOICE, setProgress)
      .then(() => {
        setReady(true);
        setPreloading(false);
      })
      .catch(() => {
        setPreloading(false);
        setPreloadError(true);
        preloadStartedRef.current = false; // erneuten Versuch erlauben
      });
  }, [ready]);

  const start = useCallback(
    async (segments, opts = {}) => {
      // Erst die vorherige Kette entwerten, dann die neue aufsetzen.
      halt();
      const gen = genRef.current;
      pausedRef.current = false;

      // Audio innerhalb der Geste entsperren (iOS).
      const a = ensureAudio();
      a.src = SILENT_WAV;
      a.play().catch(() => {});

      segsRef.current = segments.map((t, si) => ({ t, si }));
      posRef.current = opts.fromSegment ?? 0;
      if (posRef.current < 0) posRef.current = 0;
      doneRef.current = opts.onDone ?? null;
      setSpeaking(true);
      setPaused(false);
      // Ist das Modell schon vorgeladen, entfällt die Wartezeit.
      if (!ready) setLoading(true);
      setProgress(ready ? 100 : 0);
      try {
        await ensureNeuralVoice(NEURAL_VOICE, setProgress);
        setReady(true);
      } catch (err) {
        if (gen !== genRef.current) return;
        setSpeaking(false);
        setLoading(false);
        onErrorRef.current?.(err);
        return;
      }
      if (gen !== genRef.current) return;
      setLoading(false);
      playNext();
    },
    [halt, playNext, ready]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    audioRef.current?.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    // Wurde während der Pause ein Abschnitt fertig, liegt er bereits als
    // Quelle im Element und startet hier.
    audioRef.current?.play().catch(() => {});
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    halt();
    pausedRef.current = false;
    doneRef.current = null;
    const a = audioRef.current;
    if (a) a.removeAttribute("src");
    revoke();
    setSpeaking(false);
    setPaused(false);
    setIndex(-1);
    setLoading(false);
  }, [halt]);

  useEffect(
    () => () => {
      genRef.current += 1;
      const a = audioRef.current;
      if (a) {
        a.onended = null;
        a.pause();
        a.removeAttribute("src");
      }
      revoke();
    },
    []
  );

  return { speaking, paused, index, loading, progress, ready, preloading, preloadError, preload, start, pause, resume, stop };
}
