import { useCallback, useEffect, useRef, useState } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
const SUPPORTED = !!synth && typeof window !== "undefined" && "SpeechSynthesisUtterance" in window;

/** Text in Sätze zerlegen – kurze Häppchen umgehen das 15-s-Limit von Chrome. */
const toSentences = (text) => (text.match(/[^.!?]+[.!?]*/g) || [text]).map((s) => s.trim()).filter(Boolean);

/**
 * Sprachausgabe der Podcast-Skripte über die Web Speech API. Liest eine
 * Liste von Segmenten (Strings) vor, satzweise gequeued, und meldet über
 * `index` das gerade gesprochene Segment zurück (für die Mitlese-Hervorhebung).
 * Läuft komplett offline; ohne Browser-Unterstützung bleibt `supported` false.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(-1);
  const [rate, setRate] = useState(1);

  const unitsRef = useRef([]); // [{ t: Satz, si: Segment-Index }]
  const posRef = useRef(0);
  const rateRef = useRef(1);
  rateRef.current = rate;
  const doneRef = useRef(null);
  const voiceRef = useRef(null);
  const keepAliveRef = useRef(null);

  // Deutsche Stimme wählen (Voices laden asynchron nach).
  useEffect(() => {
    if (!SUPPORTED) return;
    const pick = () => {
      const voices = synth.getVoices();
      voiceRef.current =
        voices.find((v) => /^de/i.test(v.lang) && /google|microsoft|deutsch|anna|petra|markus/i.test(v.name)) ||
        voices.find((v) => /^de/i.test(v.lang)) ||
        null;
    };
    pick();
    synth.addEventListener?.("voiceschanged", pick);
    return () => synth.removeEventListener?.("voiceschanged", pick);
  }, []);

  const stopKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const speakNext = useCallback(() => {
    const units = unitsRef.current;
    const i = posRef.current;
    if (i >= units.length) {
      setSpeaking(false);
      setPaused(false);
      setIndex(-1);
      stopKeepAlive();
      const done = doneRef.current;
      doneRef.current = null;
      done?.();
      return;
    }
    setIndex(units[i].si);
    const u = new SpeechSynthesisUtterance(units[i].t);
    u.lang = "de-DE";
    u.rate = rateRef.current;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onend = () => {
      posRef.current += 1;
      speakNext();
    };
    u.onerror = () => {
      posRef.current += 1;
      speakNext();
    };
    synth.speak(u);
  }, []);

  const start = useCallback(
    (segments, opts = {}) => {
      if (!SUPPORTED) return;
      synth.cancel();
      const units = [];
      segments.forEach((seg, si) => {
        for (const sentence of toSentences(seg)) units.push({ t: sentence, si });
      });
      unitsRef.current = units;
      // Optional ab einem bestimmten Segment starten (Klick ins Skript).
      posRef.current = opts.fromSegment ? units.findIndex((u) => u.si >= opts.fromSegment) : 0;
      if (posRef.current < 0) posRef.current = 0;
      doneRef.current = opts.onDone ?? null;
      setSpeaking(true);
      setPaused(false);
      stopKeepAlive();
      // Sanfter Wecker gegen den „hängenden" Zustand mancher Chrome-Versionen.
      keepAliveRef.current = setInterval(() => {
        if (synth.speaking && !synth.paused) synth.resume();
      }, 5000);
      speakNext();
    },
    [speakNext]
  );

  const pause = useCallback(() => {
    if (!SUPPORTED) return;
    synth.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!SUPPORTED) return;
    synth.resume();
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    if (!SUPPORTED) return;
    stopKeepAlive();
    doneRef.current = null;
    synth.cancel();
    setSpeaking(false);
    setPaused(false);
    setIndex(-1);
  }, []);

  // Beim Unmount nie im Hintergrund weiterreden.
  useEffect(
    () => () => {
      if (!SUPPORTED) return;
      stopKeepAlive();
      synth.cancel();
    },
    []
  );

  return { supported: SUPPORTED, speaking, paused, index, rate, setRate, start, pause, resume, stop };
}
