import { useCallback, useEffect, useRef, useState } from "react";
import { ensureNeuralVoice, synthNeural, NEURAL_VOICE } from "../services/neuralTts.js";

// Kurzes stilles WAV – entsperrt das Audio-Element innerhalb der Nutzergeste
// (iOS erlaubt spätere programmatische Wiedergabe nur nach einer solchen Geste).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=";

/**
 * Podcast-Wiedergabe mit neuronaler Stimme. Bietet dieselbe Schnittstelle wie
 * useSpeech (speaking, paused, index, start, pause, resume, stop), damit der
 * Player die Engine transparent tauschen kann. Synthese läuft abschnittsweise:
 * ganze Absätze werden nacheinander erzeugt und abgespielt. Fehler werden über
 * onError gemeldet, damit der Aufrufer auf die Gerätestimme zurückfallen kann.
 */
export function useNeuralPlayer({ onError } = {}) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Vorlade-Status: Modell wird einmalig heruntergeladen und im Browser
  // gecacht, damit die Wiedergabe später sofort startet.
  const [ready, setReady] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(false);
  const preloadStartedRef = useRef(false);

  const audioRef = useRef(null);
  const segsRef = useRef([]);
  const posRef = useRef(0);
  const cancelRef = useRef(false);
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

  const playNext = useCallback(async () => {
    if (cancelRef.current) return;
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
      if (cancelRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      revoke();
      urlRef.current = url;
      const a = ensureAudio();
      a.src = url;
      a.onended = () => {
        posRef.current += 1;
        playNext();
      };
      await a.play();
    } catch (err) {
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
      cancelRef.current = false;
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
        setSpeaking(false);
        setLoading(false);
        onErrorRef.current?.(err);
        return;
      }
      if (cancelRef.current) return;
      setLoading(false);
      playNext();
    },
    [playNext, ready]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    doneRef.current = null;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.onended = null;
      a.removeAttribute("src");
    }
    revoke();
    setSpeaking(false);
    setPaused(false);
    setIndex(-1);
    setLoading(false);
  }, []);

  useEffect(
    () => () => {
      cancelRef.current = true;
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
      }
      revoke();
    },
    []
  );

  return { speaking, paused, index, loading, progress, ready, preloading, preloadError, preload, start, pause, resume, stop };
}
