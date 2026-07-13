import { useCallback, useEffect, useRef, useState } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
const SUPPORTED = !!synth && typeof window !== "undefined" && "SpeechSynthesisUtterance" in window;
const VOICE_KEY = "mrk7-voice";

/** Text in Sätze zerlegen – kurze Häppchen umgehen das 15-s-Limit von Chrome. */
const toSentences = (text) => (text.match(/[^.!?]+[.!?]*/g) || [text]).map((s) => s.trim()).filter(Boolean);

/**
 * Bewertet, wie natürlich eine Stimme klingt (höher = besser). Premium-,
 * Enhanced-, Neural- und Siri-Stimmen klingen deutlich menschlicher als die
 * kompakten Standardstimmen; Google- und benannte Personenstimmen folgen.
 */
const voiceScore = (v) => {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let s = 0;
  if (/premium|enhanced|neural|natural/.test(n)) s += 120;
  if (/siri/.test(n)) s += 80;
  if (/google/.test(n)) s += 50;
  if (/petra|anna|markus|viktor|yannick|helena|katja|conrad|amala/.test(n)) s += 25;
  if (v.localService === false) s += 15;
  if (/de-de/i.test(v.lang)) s += 10;
  return s;
};

const germanVoices = () =>
  (synth?.getVoices() || []).filter((v) => /^de/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a));

/**
 * Sprachausgabe der Podcast-Skripte über die Web Speech API. Liest eine
 * Liste von Segmenten (Strings) vor, satzweise gequeued, und meldet über
 * `index` das gerade gesprochene Segment zurück (für die Mitlese-Hervorhebung).
 * Wählt automatisch die natürlichste verfügbare deutsche Stimme, lässt aber
 * eine manuelle Auswahl zu (persistiert). Läuft komplett offline.
 */
export function useSpeech() {
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURIState] = useState(() => {
    try {
      return (SUPPORTED && localStorage.getItem(VOICE_KEY)) || "";
    } catch {
      return "";
    }
  });
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(-1);
  const [rate, setRate] = useState(0.95);

  const unitsRef = useRef([]); // [{ t: Satz, si: Segment-Index }]
  const posRef = useRef(0);
  const rateRef = useRef(0.95);
  rateRef.current = rate;
  const voiceUriRef = useRef(voiceURI);
  voiceUriRef.current = voiceURI;
  const doneRef = useRef(null);
  const keepAliveRef = useRef(null);

  // Stimmen laden (kommen asynchron nach) und nach Natürlichkeit sortieren.
  useEffect(() => {
    if (!SUPPORTED) return;
    const load = () => setVoices(germanVoices());
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);

  const resolveVoice = useCallback(() => {
    const all = synth.getVoices();
    if (voiceUriRef.current) {
      const found = all.find((v) => v.voiceURI === voiceUriRef.current);
      if (found) return found;
    }
    return germanVoices()[0] || null;
  }, []);

  const setVoiceURI = useCallback((uri) => {
    setVoiceURIState(uri);
    try {
      localStorage.setItem(VOICE_KEY, uri);
    } catch {
      /* Speicher nicht verfügbar – Auswahl gilt nur für diese Sitzung */
    }
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
    // Leicht wärmere Tonlage; natürlicher als der neutrale Standard.
    u.pitch = 1.02;
    const v = resolveVoice();
    if (v) u.voice = v;
    u.onend = () => {
      posRef.current += 1;
      speakNext();
    };
    u.onerror = () => {
      posRef.current += 1;
      speakNext();
    };
    synth.speak(u);
  }, [resolveVoice]);

  const start = useCallback(
    (segments, opts = {}) => {
      if (!SUPPORTED) return;
      synth.cancel();
      const units = [];
      segments.forEach((seg, si) => {
        for (const sentence of toSentences(seg)) units.push({ t: sentence, si });
      });
      unitsRef.current = units;
      posRef.current = opts.fromSegment ? units.findIndex((u) => u.si >= opts.fromSegment) : 0;
      if (posRef.current < 0) posRef.current = 0;
      doneRef.current = opts.onDone ?? null;
      setSpeaking(true);
      setPaused(false);
      stopKeepAlive();
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

  useEffect(
    () => () => {
      if (!SUPPORTED) return;
      stopKeepAlive();
      synth.cancel();
    },
    []
  );

  return {
    supported: SUPPORTED,
    speaking,
    paused,
    index,
    rate,
    setRate,
    voices,
    voiceURI,
    setVoiceURI,
    start,
    pause,
    resume,
    stop,
  };
}
