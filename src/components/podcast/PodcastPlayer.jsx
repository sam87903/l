import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, Loader, Pause, Play, Square } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { useToast } from "../ui/Toast.jsx";
import { PODCASTS, podcastMinutes } from "../../data/podcast.js";
import { useSpeech } from "../../hooks/useSpeech.js";
import { useNeuralPlayer } from "../../hooks/useNeuralPlayer.js";
import { ACCENT } from "../../constants/theme.js";
import { STORAGE_KEYS } from "../../constants/config.js";
import { cx, kb } from "../../utils/misc.js";
import { storage } from "../../services/storage.js";
import cardStyles from "../cards/cards.module.css";
import styles from "./podcast.module.css";

const NEURAL_KEY = "mrk7-neural";
const AUTO_KEY = "mrk7-podauto";
const RATES = [
  { v: 0.85, label: "langsam" },
  { v: 0.95, label: "natürlich" },
  { v: 1.1, label: "zügig" },
];

/**
 * Stimm-Namen für die Auswahl kürzen: Sprachkürzel raus, Qualitätsangabe rein.
 * Ohne die Qualität hießen „Anna (Premium)" und „Anna (Kompakt)" beide nur
 * „Anna" – man könnte die gute Stimme nicht von der robotischen unterscheiden.
 */
const QUALITY = /premium|enhanced|kompakt|compact|erweitert/i;

const voiceLabel = (v) => {
  const quality = v.name.match(/\(([^)]*)\)/)?.[1];
  const nice = v.name.replace(/\s*\(.*?\)\s*/g, " ").replace(/de[-_]DE/gi, "").trim() || v.name;
  const premium = /premium|enhanced|neural|natural|siri/i.test(`${v.name} ${v.voiceURI}`);
  const zusatz = quality && QUALITY.test(quality) ? ` (${quality})` : "";
  return `${nice}${zusatz}${premium ? " ✨" : ""}`;
};

/** Eine Podcast-Episode: aufklappbares Skript + Sprachausgabe-Steuerung. */
function Episode({ ep, open, onToggle, engine, canPlay, neuralMode, rate, setRate, activeId, onPlay }) {
  const isActive = activeId === ep.id;
  const isPlaying = isActive && engine.speaking;
  const isPaused = isActive && engine.paused;
  const isLoading = isActive && !!engine.loading;
  const mins = podcastMinutes(ep);

  const startFrom = (fromSegment) => onPlay(ep, fromSegment);

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
  const [autoNext, setAutoNext] = useState(true);
  const { push } = useToast();
  const speech = useSpeech();

  // Zuletzt gehörte Stelle: {id, seg}. Bei 9 Folgen mit zusammen 159 Kapiteln
  // ist das Wiederfinden sonst mühsam – erst recht in Etappen unterwegs.
  const [resume, setResume] = useState(null);

  // Zuletzt gewählte Stimmen-Art, Auto-Weiter und Hörposition wiederherstellen.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(storage.get(NEURAL_KEY)).then((v) => {
      if (!cancelled && v === "1") setNeuralMode(true);
    });
    Promise.resolve(storage.get(AUTO_KEY)).then((v) => {
      if (!cancelled && v === "0") setAutoNext(false);
    });
    Promise.resolve(storage.get(STORAGE_KEYS.podcastPos)).then((v) => {
      if (cancelled || !v) return;
      try {
        const saved = JSON.parse(v);
        if (saved?.id && PODCASTS.some((e) => e.id === saved.id)) setResume(saved);
      } catch {
        /* kaputter Eintrag – ohne Weiterhören-Vorschlag weitermachen */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const autoNextRef = useRef(autoNext);
  autoNextRef.current = autoNext;

  const handleNeuralError = useCallback(() => {
    setNeuralMode(false);
    storage.set(NEURAL_KEY, "0");
    push("KI-Stimme nicht verfügbar (Internet nötig) – zurück zur Gerätestimme.", "🔇");
  }, [push]);

  const neural = useNeuralPlayer({ onError: handleNeuralError });

  const engine = neuralMode ? neural : speech;
  const canPlay = neuralMode || speech.supported;

  // KI-Stimme automatisch vorladen, sobald sie gewählt und die Sektion offen
  // ist – dann startet die Wiedergabe später ohne Wartezeit.
  useEffect(() => {
    if (neuralMode && open) neural.preload();
  }, [neuralMode, open, neural.preload]);

  const toggleSection = useCallback(() => setOpen((v) => !v), []);

  const toggleAutoNext = () => {
    const next = !autoNext;
    setAutoNext(next);
    storage.set(AUTO_KEY, next ? "1" : "0");
  };

  // Eine Folge abspielen; endet sie und Auto-Weiter ist an, startet die
  // nächste Folge automatisch (Kette über onDone).
  const playRef = useRef();
  const playEpisode = useCallback(
    (ep, fromSegment = 0) => {
      setActiveId(ep.id);
      setOpenId(ep.id);
      const idx = PODCASTS.findIndex((e) => e.id === ep.id);
      const next = PODCASTS[idx + 1];
      engine.start(
        ep.segments.map((s) => s.text),
        {
          fromSegment,
          onDone: () => {
            if (autoNextRef.current && next) playRef.current(next, 0);
          },
        }
      );
    },
    [engine]
  );
  playRef.current = playEpisode;

  // Hörposition mitschreiben, solange etwas läuft. engine.index ist das
  // gerade gesprochene Kapitel; -1 heißt „nichts aktiv" und wird ignoriert,
  // damit ein Stopp die Marke nicht auf den Anfang zurücksetzt.
  useEffect(() => {
    if (!activeId || engine.index < 0) return;
    const mark = { id: activeId, seg: engine.index };
    setResume(mark);
    storage.set(STORAGE_KEYS.podcastPos, JSON.stringify(mark));
  }, [activeId, engine.index]);

  const resumeEpisode = useMemo(
    () => (resume ? PODCASTS.find((e) => e.id === resume.id) : null),
    [resume]
  );

  // Selbsttest der KI-Stimme: benennt den ersten Schritt, der scheitert.
  const [diagSteps, setDiagSteps] = useState(null);
  const [diagBusy, setDiagBusy] = useState(false);
  const runDiagnose = async () => {
    setDiagBusy(true);
    setDiagSteps(null);
    try {
      const { diagnoseNeuralVoice } = await import("../../services/neuralTts.js");
      setDiagSteps(await diagnoseNeuralVoice());
    } catch (err) {
      setDiagSteps([{ name: "Selbsttest", ok: false, info: String(err?.message || err) }]);
    }
    setDiagBusy(false);
  };

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

          {/* Da weitermachen, wo zuletzt aufgehört wurde */}
          {resumeEpisode && !engine.speaking && (
            <button
              className={cx(styles.resumeRow, "hover-pop")}
              onClick={() => playEpisode(resumeEpisode, resume.seg)}
              disabled={!canPlay}
            >
              <Play size={14} aria-hidden="true" />
              <span className={styles.resumeBody}>
                <span className={styles.resumeKicker}>Weiterhören</span>
                <span className={styles.resumeTitle}>
                  {resumeEpisode.title} · Kapitel {resume.seg + 1} von {resumeEpisode.segments.length}
                </span>
              </span>
            </button>
          )}

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

          <button
            className={cx(styles.autoRow, "hover-pop")}
            onClick={toggleAutoNext}
            role="switch"
            aria-checked={autoNext}
            aria-label="Automatisch zur nächsten Folge"
          >
            <span className={cx(styles.autoSwitch, autoNext && styles.autoSwitchOn)} aria-hidden="true">
              <span className={styles.autoKnob} />
            </span>
            <span className={styles.autoLabel}>▶▶ Auto-Weiter zur nächsten Folge</span>
          </button>

          {neuralMode ? (
            <div className={styles.voicePanel}>
              <p className={styles.voiceTip}>
                ✨ <strong>Neuronale KI-Stimme (Kerstin, weiblich)</strong> – klingt deutlich menschlicher und rechnet
                direkt in deinem Browser, ohne dass Daten das Gerät verlassen.
              </p>
              {neural.ready ? (
                <p className={cx(styles.voiceStatus, styles.voiceStatusOk)}>
                  ✅ Stimme geladen &amp; gespeichert – startet sofort, auch offline.
                </p>
              ) : neural.preloading ? (
                <div className={styles.voiceStatus}>
                  <span>⏳ Stimme wird vorbereitet… {neural.progress || 0}%</span>
                  <span className={styles.voiceBar} aria-hidden="true">
                    <span className={styles.voiceBarFill} style={{ width: `${neural.progress || 0}%` }} />
                  </span>
                  <span className={styles.voiceHint}>Einmaliger Download (~60 MB), danach dauerhaft gespeichert.</span>
                </div>
              ) : neural.preloadError ? (
                <p className={cx(styles.voiceStatus, styles.voiceStatusWarn)}>
                  ⚠️ Konnte nicht geladen werden. Beim Abspielen wird die Gerätestimme genutzt.
                </p>
              ) : null}

              {/* Selbsttest: Ohne benannten Fehler lässt sich aus der Ferne
                  nicht klären, woran die KI-Stimme scheitert. */}
              <button className={cx(styles.diagBtn, "hover-pop")} onClick={runDiagnose} disabled={diagBusy}>
                {diagBusy ? "Prüfe …" : "🔍 Selbsttest der KI-Stimme"}
              </button>
              {diagSteps && (
                <ul className={styles.diagList}>
                  {diagSteps.map((s) => (
                    <li key={s.name} className={styles.diagRow}>
                      <span aria-hidden="true">
                        {s.level === "info" ? "ℹ️" : s.ok ? "✅" : "❌"}
                      </span>
                      <span>
                        {s.name}
                        {s.info ? <span className={styles.diagInfo}> — {s.info}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
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
                {/* Zeigen, welche Stimme tatsächlich spricht – sonst bleibt
                    unklar, ob gerade eine gute oder die kompakte Notlösung läuft. */}
                {speech.activeVoice && (
                  <p className={cx(styles.voiceStatus, speech.activeIsNatural && styles.voiceStatusOk)}>
                    {speech.activeIsNatural ? "✅" : "ℹ️"} Aktiv: <strong>{voiceLabel(speech.activeVoice)}</strong>
                    {speech.activeIsNatural ? " – klingt natürlich." : " – eine Premium-Stimme klingt deutlich besser."}
                  </p>
                )}
                {!speech.premiumAvailable && (
                  <p className={styles.voiceTip}>
                    💡 <strong>Die beste Stimme steckt schon in deinem iPhone</strong> – sie muss nur einmal
                    geladen werden: <strong>Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen ›
                    Deutsch</strong>, dort eine <strong>Siri-</strong> oder <strong>Premium-Stimme</strong> laden.
                    Danach hier „Automatisch" wählen – sie klingt so gut wie jede KI-Stimme, läuft komplett
                    offline und kostet nichts.
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
              onPlay={playEpisode}
            />
          ))}

          <p className={styles.footnote}>
            🔊 Gerätestimme funktioniert immer offline; auf iPhone und iPad werden ganze Absätze am
            Stück gelesen. Die KI-Stimme braucht beim ersten Laden Internet – danach ist sie auf dem
            Gerät gespeichert und funktioniert ebenfalls offline.
          </p>
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default PodcastPlayer;
