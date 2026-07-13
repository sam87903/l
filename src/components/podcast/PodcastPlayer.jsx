import { memo, useCallback, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, Pause, Play, Square } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { PODCASTS, podcastMinutes } from "../../data/podcast.js";
import { useSpeech } from "../../hooks/useSpeech.js";
import { ACCENT } from "../../constants/theme.js";
import { cx, kb } from "../../utils/misc.js";
import cardStyles from "../cards/cards.module.css";
import styles from "./podcast.module.css";

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
function Episode({ ep, open, onToggle, speech, activeId, setActiveId }) {
  const isActive = activeId === ep.id;
  const isPlaying = isActive && speech.speaking;
  const isPaused = isActive && speech.paused;
  const mins = podcastMinutes(ep);

  const startFrom = (fromSegment) => {
    setActiveId(ep.id);
    speech.start(
      ep.segments.map((s) => s.text),
      { fromSegment }
    );
  };

  const onPrimary = () => {
    if (isPlaying && !isPaused) {
      speech.pause();
    } else if (isPaused) {
      speech.resume();
    } else {
      startFrom(0);
    }
  };

  const primaryLabel = isPlaying && !isPaused ? "Pause" : isPaused ? "Fortsetzen" : "Podcast starten";
  const PrimaryIcon = isPlaying && !isPaused ? Pause : Play;

  return (
    <GlassCard
      tint={open ? ACCENT.orange : undefined}
      style={{ "--c": ACCENT.orange, borderRadius: "var(--r-sm)", marginBottom: "var(--s-2)", overflow: "hidden" }}
    >
      <div
        className={cx(styles.epHead, "hover-pop")}
        onClick={onToggle}
        {...kb(onToggle)}
        aria-expanded={open}
      >
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

          {speech.supported ? (
            <div className={styles.controls}>
              <button
                className={cx(styles.playBtn, "hover-pop")}
                onClick={onPrimary}
                aria-label={primaryLabel}
              >
                <PrimaryIcon size={16} aria-hidden="true" />
                {primaryLabel}
              </button>
              {isActive && (speech.speaking || speech.paused) && (
                <button className={cx(styles.stopBtn, "hover-pop")} onClick={speech.stop} aria-label="Stopp">
                  <Square size={14} aria-hidden="true" /> Stopp
                </button>
              )}
              <div className={styles.rateRow} role="group" aria-label="Tempo">
                {RATES.map((r) => (
                  <button
                    key={r.v}
                    className={cx(styles.rateBtn, speech.rate === r.v && styles.rateBtnOn)}
                    onClick={() => speech.setRate(r.v)}
                    aria-pressed={speech.rate === r.v}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {speech.supported && speech.voices.length > 1 && isActive && (
            <label className={styles.voiceRow}>
              <span className={styles.voiceLbl}>🎙️ Stimme</span>
              <select
                className={styles.voiceSelect}
                value={speech.voiceURI}
                onChange={(e) => speech.setVoiceURI(e.target.value)}
              >
                <option value="">Automatisch (natürlichste)</option>
                {speech.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {voiceLabel(v)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!speech.supported && (
            <p className={styles.noTts}>
              🔇 Die Sprachausgabe wird von diesem Browser nicht unterstützt – lies das Skript einfach mit.
            </p>
          )}

          <div className={styles.script}>
            {ep.segments.map((seg, i) => {
              const current = isActive && speech.index === i;
              return (
                <div
                  key={i}
                  className={cx(styles.seg, current && styles.segCurrent)}
                  onClick={speech.supported ? () => startFrom(i) : undefined}
                  role={speech.supported ? "button" : undefined}
                  tabIndex={speech.supported ? 0 : undefined}
                  onKeyDown={speech.supported ? (e) => { if (e.key === "Enter") startFrom(i); } : undefined}
                  title={speech.supported ? "Ab hier vorlesen" : undefined}
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
 * Podcast-Sektion auf der Plan-Seite: aufklappbare Liste von Hör-Episoden,
 * die die Themenblöcke des Studiengangs strukturiert aufgreifen. Start-Knopf
 * liest das Skript vor (Web Speech API), das Skript ist zum Mitlesen sichtbar.
 */
const PodcastPlayer = memo(function PodcastPlayer() {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const speech = useSpeech();

  const toggleSection = useCallback(() => setOpen((v) => !v), []);

  const toggleEpisode = useCallback(
    (id) => {
      setOpenId((prev) => {
        const next = prev === id ? null : id;
        // Zugeklapptes Kapitel darf nicht im Hintergrund weiterreden.
        if (prev === id && activeId === id) speech.stop();
        return next;
      });
    },
    [activeId, speech]
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
            Lieber hören als lesen? Diese Folgen fassen die Themenblöcke deines Studiums in kurzen,
            gesprochenen Kapiteln zusammen. Tippe auf eine Folge, drücke <strong>Podcast starten</strong> –
            und lass dir den Stoff vorlesen. Das Skript läuft zum Mitlesen mit.
          </p>

          {PODCASTS.map((ep) => (
            <Episode
              key={ep.id}
              ep={ep}
              open={openId === ep.id}
              onToggle={() => toggleEpisode(ep.id)}
              speech={speech}
              activeId={activeId}
              setActiveId={setActiveId}
            />
          ))}

          <p className={styles.footnote}>
            🔊 Die Wiedergabe nutzt die Sprachausgabe deines Geräts und funktioniert offline. Für eine
            besonders natürliche Stimme lade auf dem iPhone unter Einstellungen, Bedienungshilfen,
            Gesprochene Inhalte, Stimmen, Deutsch eine Stimme mit dem Zusatz „Premium" – sie erscheint
            dann oben in der Stimmen-Auswahl mit einem ✨.
          </p>
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default PodcastPlayer;
