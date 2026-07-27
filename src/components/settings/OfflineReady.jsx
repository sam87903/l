import { memo, useCallback, useEffect, useState } from "react";
import { Loader2, Plane, RefreshCw } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useOnline } from "../../hooks/useOnline.js";
import {
  fmtBytes,
  getStorageEstimate,
  isAppCached,
  isPersisted,
  isServiceWorkerActive,
  requestPersistentStorage,
} from "../../services/offlineReady.js";
import { ensureNeuralVoice, isNeuralVoiceStored, neuralVoiceProven, NEURAL_VOICE } from "../../services/neuralTts.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./offline.module.css";

const Row = ({ ok, title, desc, pending }) => (
  <div className={styles.row}>
    <span className={cx(styles.mark, ok && styles.markOk, !ok && !pending && styles.markOpen)} aria-hidden="true">
      {pending ? "…" : ok ? "✓" : "!"}
    </span>
    <div className={styles.rowBody}>
      <div className={styles.rowTitle}>{title}</div>
      <div className={styles.rowDesc}>{desc}</div>
    </div>
  </div>
);

/**
 * Reise-Check: zeigt vor dem Abflug, ob die App wirklich ohne Internet
 * läuft – App im Offline-Speicher, dauerhafte Speicherung zugesichert,
 * KI-Stimme geladen – und stellt das Fehlende auf Knopfdruck her.
 */
const OfflineReady = memo(function OfflineReady() {
  const online = useOnline();
  const { push } = useToast();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);

  const refresh = useCallback(async () => {
    const [cached, sw, persisted, est] = await Promise.all([
      isAppCached(),
      isServiceWorkerActive(),
      isPersisted(),
      getStorageEstimate(),
    ]);
    // Stimm-Status kommt aus einem lokalen Merker – bewusst ohne Netzzugriff,
    // damit der Reise-Check auch im Flugmodus fehlerfrei durchläuft.
    setState({ cached, sw, persisted, est, voice: isNeuralVoiceStored(), voiceProven: neuralVoiceProven() });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** App-Daten dauerhaft schützen + Status neu erheben. */
  const prepare = async () => {
    setBusy(true);
    const granted = await requestPersistentStorage();
    await refresh();
    setBusy(false);
    push(
      granted
        ? "Daten dauerhaft geschützt – dein Fortschritt bleibt erhalten."
        : "Browser hat den dauerhaften Schutz nicht zugesagt (App zum Home-Bildschirm hinzufügen hilft).",
      granted ? "🔒" : "ℹ️"
    );
  };

  /** KI-Stimme jetzt herunterladen, damit sie offline verfügbar ist. */
  const loadVoice = async () => {
    setVoiceBusy(true);
    setVoiceProgress(0);
    try {
      await ensureNeuralVoice(NEURAL_VOICE, setVoiceProgress);
      push("Stimmmodell gespeichert. Ob es hier auch spricht, zeigt der Podcast-Selbsttest.", "🎙️");
    } catch (err) {
      push(`KI-Stimme nicht ladbar: ${String(err?.message || "unbekannter Fehler").slice(0, 80)}`, "⚠️");
    }
    setVoiceBusy(false);
    refresh();
  };

  const allReady = state && state.cached && state.sw && state.persisted;

  return (
    <GlassCard tint={ACCENT.orange} style={{ "--c": ACCENT.orange, padding: "var(--s-4)", marginBottom: "var(--s-3)" }}>
      <div className={styles.head}>
        <Plane size={16} color={ACCENT.orange} aria-hidden="true" />
        <span className={styles.kicker}>Reise-Check · Offline-Bereitschaft</span>
        <button className={cx(styles.refresh, "hover-pop")} onClick={refresh} aria-label="Status neu prüfen">
          <RefreshCw size={13} aria-hidden="true" />
        </button>
      </div>

      {!state ? (
        <p className={styles.lead}>Status wird geprüft …</p>
      ) : (
        <>
          <p className={cx(styles.lead, allReady && styles.leadOk)}>
            {allReady
              ? "✅ Alles bereit – die App läuft komplett ohne Internet."
              : "Noch nicht vollständig – die folgenden Punkte solltest du vor dem Abflug erledigen."}
          </p>

          <Row
            ok={state.sw && state.cached}
            title="App offline gespeichert"
            desc={
              state.sw && state.cached
                ? "Die App startet auch ohne Netz."
                : online
                  ? "Lade die Seite einmal neu, damit sie sich speichert."
                  : "Nur mit Internet einrichtbar."
            }
          />
          <Row
            ok={state.persisted}
            title="Fortschritt dauerhaft geschützt"
            desc={
              state.persisted
                ? "Dein Lernfortschritt wird vom Gerät nicht automatisch gelöscht."
                : "Ohne diesen Schutz darf das Gerät die Daten löschen – unbedingt aktivieren."
            }
          />
          {/* Bewusst zurückhaltend formuliert: Ein geladenes Modell heißt noch
              nicht, dass die Stimme auf diesem Gerät auch spricht. Der Haken
              steht erst, wenn sie es nachweislich getan hat. */}
          <Row
            ok={state.voiceProven}
            pending={voiceBusy}
            title="KI-Stimme für Podcasts (optional)"
            desc={
              voiceBusy
                ? `Wird geladen … ${voiceProgress}%`
                : state.voiceProven
                  ? "Erprobt und gespeichert – läuft offline."
                  : state.voice
                    ? "Modell liegt da, hat hier aber noch nicht gesprochen. Test im Podcast-Bereich."
                    : "Ohne sie liest die Gerätestimme vor – die funktioniert immer offline."
            }
          />

          {state.est && (
            <p className={styles.storage}>
              Belegt: <strong>{fmtBytes(state.est.usage)}</strong>
              {state.est.quota ? ` von ${fmtBytes(state.est.quota)} verfügbar` : ""}
            </p>
          )}

          <div className={styles.actions}>
            {!state.persisted && (
              <Button tint={ACCENT.orange} onClick={prepare} disabled={busy} style={{ flex: 1 }}>
                {busy ? <><Loader2 size={14} className="anim-spin" aria-hidden="true" /> Prüfe …</> : "🔒 Daten schützen"}
              </Button>
            )}
            {!state.voice && (
              <Button onClick={loadVoice} disabled={voiceBusy || !online} style={{ flex: 1 }}>
                {voiceBusy ? `Lädt … ${voiceProgress}%` : "🎙️ KI-Stimme laden"}
              </Button>
            )}
          </div>

          <p className={styles.hint}>
            💡 Tipp fürs Fliegen: Öffne die App vor dem Abflug einmal mit Internet, lege sie über
            „Zum Home-Bildschirm" ab und lade hier deine Daten-Sicherung herunter. Danach
            funktionieren Plan, Semester, Glossar, Quizze, Karten, Klausuren und Podcasts
            vollständig ohne Netz.
          </p>
        </>
      )}
    </GlassCard>
  );
});

export default OfflineReady;
