import { memo, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, Loader, Pause, Play, Square } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { useToast } from "../ui/Toast.jsx";
import { PODCASTS, podcastMinutes } from "../../data/podcast.js";
import { useSpeech } from "../../hooks/useSpeech.js";
import { useNeuralPlayer } from "../../hooks/useNeuralPlayer.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, kb } from "../../utils/misc.js";
import { storage } from "../../services/storage.js";
import cardStyles from "../cards/cards.module.css";
import styles from "./podcast.module.css";

const NEURAL_KEY = "mrk7-neural";
const RATES = [
  { v: 0.85, label: "langsam" },
  { v: 0.95, label: "natürlich" },
  { v: 1.1, label: "zügig" },
];

/** Stimm-Namen für die Auswahl kürzen (Sprachkürzel entfernen). */
const voiceLabel = (v) => {
  const nice = v.name.replace(/\s*\(.*?\)\s*/g, " ").replace(/de[-_]DE/gi, "").trim();
  const premium = /premium|enhanced|neural|natural|siri/i.test(`${v.name} ${v.voiceURI}`);
  return `${nice || v.name}${premium ? " ✨" : ""}`;
};

/** Eine Podcast-Episode: aufklappbares Skript + Sprachausgabe-Steuerung. */
function Episode({ ep, open, onToggle, engine, canPlay, neuralMode, rate, setRate, activeId, setActiveId }) {
  const isActive = activeId === ep.id;
  const isPlaying = isActive && engine.speaking;
  const isPaused = isActive && engine.paused;
  const isLoading = isActive && !!engine.loading;
  const mins = podcastMinutes(ep);

  const startFrom = (fromSegment) => {
    setActiveId(ep.id);
    engine.start(
      ep.segments.map((s) => s.text),
      { fromSegment }
    );
  };

  const onPrimary = () => {
    if (isLoading) return;
    if (isPlaying && !isPaused) engine.pause();
    else if (isPaused) engine.resume();
    else startFrom(0);
  };

  const primaryLabel = isLoading
    ? `KI-Stimme lädt… ${engine.progress || 0}%`
    : isPlaying && !isPaused
      ? "Pause"
      : isPaused
        ? "Fortsetzen"
        : "Podcast starten";
  const PrimaryIcon = isLoading ? Loader : isPlaying && !isPaused ? Pause : Play;

  return (
    <GlassCard
      tint={open ? ACCENT.orange : undefined}
      style={{ "--c": ACCENT.orange, borderRadius: "var(--r-sm)", marginBottom: "var(--s-2)", overflow: "hidden" }}
    >
      <div className={cx(styles.epHead, "hover-pop")} onClick={onToggle} {...kb(onToggle)} aria-expanded={open}>
        <span className={cx(styles.epIcon, isPlaying && styles.epIconLive)} aria-hidden="true">
          {ep.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={cx(styles.epTitle, open && styles.epTitleOpen)}>{ep.title}</div>
          <div className={styles.epMeta}>
            {ep.sem > 0 ? `Semester ${ep.sem}` : "Lernstrategie"} · {ep.segments.length} Kapitel · ca. {mins} Min
          </div>
        </div>
        {isPlaying && (
          <span className={styles.equalizer} aria-hidden="true">
            <i /><i /><i />
          </span>
        )}
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </div>

      <Collapse open={open}>
        <div className={styles.epBody}>
          <p className={styles.epTopic}>{ep.topic}</p>

          {canPlay ? (
            <div className={styles.controls}>
              <button
                className={cx(styles.playBtn, "hover-pop")}
                onClick={onPrimary}
                aria-label={primaryLabel}
                aria-busy={isLoading}
              >
                <PrimaryIcon size={16} aria-hidden="true" className={isLoading ? styles.spin : undefined} />
                {primaryLabel}
              </button>
              {isActive && (engine.speaking || engine.paused) && (
                <button className={cx(styles.stopBtn, "hover-pop")} onClick={engine.stop} aria-label="Stopp">
                  <Square size={14} aria-hidden="true" /> Stopp
                </button>
              )}
              {!neuralMode && setRate && (
                <div className={styles.rateRow} role="group" aria-label="Tempo">
                  {RATES.map((r) => (
                    <button
                      key={r.v}
                      className={cx(styles.rateBtn, rate === r.v && styles.rateBtnOn)}
                      onClick={() => setRate(r.v)}
                      aria-pressed={rate === r.v}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className={styles.noTts}>
              🔇 Die Sprachausgabe wird von diesem Browser nicht unterstützt – lies das Skript einfach mit.
            </p>
          )}

          <div className={styles.script}>
            {ep.segments.map((seg, i) => {
              const current = isActive && engine.index === i;
              return (
                <div
                  key={i}
                  className={cx(styles.seg, current && styles.segCurrent)}
                  onClick={canPlay ? () => startFrom(i) : undefined}
                  role={canPlay ? "button" : undefined}
                  tabIndex={canPlay ? 0 : undefined}
                  onKeyDown={canPlay ? (e) => { if (e.key === "Enter") startFrom(i); } : undefined}
                  title={canPlay ? "Ab hier vorlesen" : undefined}
                >
                  <div className={styles.segHead}>
                    <span className={styles.segNum}>{i + 1}</span>
                    {seg.heading}
                    {current && <span className={styles.segLive} aria-hidden="true">▶ läuft</span>}
                  </div>
                  <p className={styles.segText}>{seg.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Collapse>
    </GlassCard>
  );
}

/**
 * Podcast-Sektion auf der Plan-Seite: aufklappbare Liste von Hör-Episoden.
 * Zwei Vorlese-Engines: die Gerätestimme (Web Speech API, offline) oder – als
 * Beta – eine neuronale KI-Stimme (Piper/Kerstin, weiblich), die online im Browser
 * rechnet und deutlich menschlicher klingt. Schlägt die KI-Stimme fehl, wird
 * automatisch auf die Gerätestimme zurückgeschaltet.
 */
const PodcastPlayer = memo(function PodcastPlayer() {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [neuralMode, setNeuralMode] = useState(false);
  const { push } = useToast();
  const speech = useSpeech();

  // Zuletzt gewählte Stimmen-Art wiederherstellen.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(storage.get(NEURAL_KEY)).then((v) => {
      if (!cancelled && v === "1") setNeuralMode(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNeuralError = useCallback(() => {
    setNeuralMode(false);
    storage.set(NEURAL_KEY, "0");
    push("KI-Stimme nicht verfügbar (Internet nötig) – zurück zur Gerätestimme.", "🔇");
  }, [push]);

  const neural = useNeuralPlayer({ onError: handleNeuralError });

  const engine = neuralMode ? neural : speech;
  const canPlay = neuralMode || speech.supported;

  const toggleSection = useCallback(() => setOpen((v) => !v), []);

  const switchMode = (toNeural) => {
    engine.stop?.();
    setNeuralMode(toNeural);
    storage.set(NEURAL_KEY, toNeural ? "1" : "0");
  };

  const toggleEpisode = useCallback(
    (id) => {
      setOpenId((prev) => {
        const next = prev === id ? null : id;
        if (prev === id && activeId === id) engine.stop?.();
        return next;
      });
    },
    [activeId, engine]
  );

  return (
    <GlassCard tint={ACCENT.orange} id="podcast" style={{ marginBottom: "var(--s-4)", overflow: "hidden" }}>
      <div className={cx(cardStyles.head, "hover-pop")} onClick={toggleSection} {...kb(toggleSection)} aria-expanded={open}>
        <Headphones size={16} color={ACCENT.orange} aria-hidden="true" />
        <span
          style={{ flex: 1, fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase", color: ACCENT.orange }}
        >
          Podcast · Themen zum Anhören
        </span>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{PODCASTS.length} Folgen</span>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>

      <Collapse open={open}>
        <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>
          <p className={styles.intro}>
            Lieber hören als lesen? Diese Folgen fassen die Themenblöcke deines Studiums in
            gesprochenen Kapiteln zusammen. Tippe auf eine Folge, drücke <strong>Podcast starten</strong> –
            und lass dir den Stoff vorlesen. Das Skript läuft zum Mitlesen mit.
          </p>

          {/* Engine-Auswahl: Gerätestimme (offline) oder KI-Stimme (Beta, online) */}
          <div className={styles.engineRow} role="group" aria-label="Stimmen-Art">
            <button
              className={cx(styles.engineBtn, !neuralMode && styles.engineBtnOn)}
              onClick={() => switchMode(false)}
              aria-pressed={!neuralMode}
            >
              📱 Gerätestimme
            </button>
            <button
              className={cx(styles.engineBtn, neuralMode && styles.engineBtnOn)}
              onClick={() => switchMode(true)}
              aria-pressed={neuralMode}
            >
              ✨ KI-Stimme · Beta
            </button>
          </div>

          {neuralMode ? (
            <div className={styles.voicePanel}>
              <p className={styles.voiceTip}>
                ✨ <strong>Neuronale KI-Stimme (Kerstin, weiblich)</strong> – klingt deutlich menschlicher und rechnet
                direkt in deinem Browser, ohne dass Daten das Gerät verlassen. Beim <strong>ersten Start</strong> wird
                das Stimmmodell einmalig geladen (rund 60 MB, danach gespeichert), deshalb braucht es
                <strong> Internet</strong> und einen Moment Geduld. Klappt es nicht, schaltet die App
                automatisch auf die Gerätestimme zurück.
              </p>
            </div>
          ) : (
            speech.supported && speech.voices.length > 0 && (
              <div className={styles.voicePanel}>
                <label className={styles.voiceRow}>
                  <span className={styles.voiceLbl}>🎙️ Stimme</span>
                  <select
                    className={styles.voiceSelect}
                    value={speech.voiceURI}
                    onChange={(e) => speech.setVoiceURI(e.target.value)}
                    aria-label="Vorlese-Stimme wählen"
                  >
                    <option value="">Automatisch (natürlichste)</option>
                    {speech.voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {voiceLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>
                {!speech.premiumAvailable && (
                  <p className={styles.voiceTip}>
                    💡 Klingt die Gerätestimme roboterhaft? Dann probiere die <strong>KI-Stimme</strong> oben –
                    oder lade auf dem iPhone unter
                    <strong> Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen › Deutsch </strong>
                    eine <strong>Premium-</strong> oder <strong>Siri-Stimme</strong> herunter.
                  </p>
                )}
              </div>
            )
          )}

          {PODCASTS.map((ep) => (
            <Episode
              key={ep.id}
              ep={ep}
              open={openId === ep.id}
              onToggle={() => toggleEpisode(ep.id)}
              engine={engine}
              canPlay={canPlay}
              neuralMode={neuralMode}
              rate={speech.rate}
              setRate={speech.setRate}
              activeId={activeId}
              setActiveId={setActiveId}
            />
          ))}

          <p className={styles.footnote}>
            🔊 Gerätestimme funktioniert offline; auf iPhone und iPad werden ganze Absätze am Stück gelesen.
            Die KI-Stimme (Beta) läuft nur online, rechnet aber lokal in deinem Browser.
          </p>
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default PodcastPlayer;
