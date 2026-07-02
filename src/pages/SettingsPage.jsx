import { useRef, useState } from "react";
import { Bell, Download, FileSpreadsheet, Printer, RotateCcw, Upload, Volume2 } from "lucide-react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { downloadCSV, downloadJSON, parseBackup } from "../utils/exportData.js";
import { requestNotificationPermission } from "../services/notifications.js";
import { playChime } from "../services/audio.js";
import { GLOSSARY } from "../data/glossary.js";
import { PLAN } from "../data/plan.js";
import { ACCENT } from "../constants/theme.js";
import { APP_VERSION } from "../constants/config.js";
import { todayISO } from "../utils/dates.js";
import { cx } from "../utils/misc.js";
import styles from "./pages.module.css";

const THEME_OPTIONS = [
  { id: "auto", label: "🌗 Auto" },
  { id: "light", label: "☀️ Hell" },
  { id: "dark", label: "🌙 Dunkel" },
];

/** Einstellungen: Theme, Datum, Sound, Benachrichtigungen, Backup, Export. */
export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { startDate, setStartDate, settings, setSettings, exportData, importData, resetAll, doneDays, favorites } = useProgress();
  const { push } = useToast();
  const fileInputRef = useRef(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);

  const toggleSound = () => {
    const next = !settings.sound;
    setSettings((s) => ({ ...s, sound: next }));
    if (next) playChime();
  };

  const toggleNotifications = async () => {
    if (settings.notifications) {
      setSettings((s) => ({ ...s, notifications: false }));
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setSettings((s) => ({ ...s, notifications: true }));
      push("Benachrichtigungen aktiviert", "🔔");
    } else {
      push(permission === "unsupported" ? "Vom Browser nicht unterstützt" : "Berechtigung abgelehnt", "🔕");
    }
  };

  const exportBackup = () => {
    downloadJSON(`marokko-lernplan-backup-${todayISO()}.json`, exportData());
    push("Backup heruntergeladen", "💾");
  };

  const exportCsv = () => {
    const rows = [["Typ", "Name", "Wert"]];
    PLAN.forEach((d) => rows.push(["Lerntag", `Tag ${d.nr} – ${d.t}`, doneDays[d.nr] ? "erledigt" : "offen"]));
    favorites.forEach((t) => rows.push(["Favorit", t, GLOSSARY[t] ?? ""]));
    downloadCSV(`marokko-lernplan-${todayISO()}.csv`, rows);
    push("CSV exportiert", "📄");
  };

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPendingImport(parseBackup(await file.text()));
    } catch {
      push("Ungültige Backup-Datei", "⚠️");
    }
  };

  const confirmImport = () => {
    importData(pendingImport);
    setPendingImport(null);
    push("Backup wiederhergestellt", "✅");
  };

  const confirmReset = () => {
    resetAll();
    setResetOpen(false);
    push("Alles zurückgesetzt", "🧹");
  };

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={styles.banner} style={{ "--c": ACCENT.blue }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>⚙️ Einstellungen</p>
        <h2 className={styles.bannerTitle}>App anpassen &amp; Daten sichern</h2>
        <p className={styles.bannerText}>Version {APP_VERSION} · Fortschritt wird lokal auf diesem Gerät gespeichert.</p>
      </GlassCard>

      <div className={styles.sectionTitle}>🎨 Darstellung</div>
      <GlassCard className={styles.settingRow}>
        <div className={styles.settingBody}>
          <div className={styles.settingTitle}>Theme</div>
          <div className={styles.settingDesc}>„Auto" folgt der Systemeinstellung deines Geräts.</div>
        </div>
        <div className={styles.segmented} role="group" aria-label="Theme wählen">
          {THEME_OPTIONS.map((opt) => (
            <button key={opt.id}
              className={cx(styles.segment, mode === opt.id && styles.segmentActive, "hover-pop")}
              onClick={() => setMode(opt.id)} aria-pressed={mode === opt.id}>
              {opt.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className={styles.sectionTitle}>📅 Lernplan</div>
      <GlassCard className={styles.settingRow}>
        <div className={styles.settingBody}>
          <div className={styles.settingTitle}>Abreisedatum</div>
          <div className={styles.settingDesc}>Startpunkt des 21-Tage-Plans und Basis für „Heute dran".</div>
        </div>
        <input className={styles.dateInput} style={{ flex: "0 0 auto", width: 150 }}
          type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          aria-label="Abreisedatum" />
      </GlassCard>

      <div className={styles.sectionTitle}>🔔 Timer &amp; Feedback</div>
      <GlassCard className={styles.settingRow}>
        <Volume2 size={18} aria-hidden="true" style={{ flexShrink: 0, color: ACCENT.blue }} />
        <div className={styles.settingBody}>
          <div className={styles.settingTitle}>Sound</div>
          <div className={styles.settingDesc}>Dezenter Klang am Ende einer Fokus-Session.</div>
        </div>
        <div className={cx(styles.switch, settings.sound && styles.switchOn)} role="switch"
          aria-checked={settings.sound} aria-label="Sound umschalten" tabIndex={0}
          onClick={toggleSound}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleSound())}>
          <span className={styles.switchKnob} />
        </div>
      </GlassCard>
      <GlassCard className={styles.settingRow}>
        <Bell size={18} aria-hidden="true" style={{ flexShrink: 0, color: ACCENT.violet }} />
        <div className={styles.settingBody}>
          <div className={styles.settingTitle}>Benachrichtigungen</div>
          <div className={styles.settingDesc}>Meldung, wenn Timer oder Pause abgelaufen sind.</div>
        </div>
        <div className={cx(styles.switch, settings.notifications && styles.switchOn)} role="switch"
          aria-checked={settings.notifications} aria-label="Benachrichtigungen umschalten" tabIndex={0}
          onClick={toggleNotifications}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleNotifications())}>
          <span className={styles.switchKnob} />
        </div>
      </GlassCard>

      <div className={styles.sectionTitle}>💾 Daten</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--s-2)" }}>
        <Button tint={ACCENT.teal} onClick={exportBackup}>
          <Download size={15} aria-hidden="true" /> Backup (JSON)
        </Button>
        <Button tint={ACCENT.blue} onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} aria-hidden="true" /> Backup laden
        </Button>
        <Button onClick={exportCsv}>
          <FileSpreadsheet size={15} aria-hidden="true" /> CSV-Export
        </Button>
        <Button onClick={() => window.print()}>
          <Printer size={15} aria-hidden="true" /> PDF / Drucken
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onImportFile}
        style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />

      <div className={styles.sectionTitle} style={{ color: ACCENT.red }}>⚠️ Gefahrenzone</div>
      <Button tint={ACCENT.red} style={{ width: "100%" }} onClick={() => setResetOpen(true)}>
        <RotateCcw size={15} aria-hidden="true" /> Gesamten Fortschritt zurücksetzen
      </Button>

      <Modal open={resetOpen} title="Wirklich alles zurücksetzen?" danger
        confirmLabel="Ja, zurücksetzen" onConfirm={confirmReset} onClose={() => setResetOpen(false)}>
        Abgehakte Tage, Quiz-Scores, Lernkarten, Favoriten und Streak werden
        unwiderruflich gelöscht. Erstelle vorher ggf. ein Backup.
      </Modal>
      <Modal open={pendingImport != null} title="Backup wiederherstellen?"
        confirmLabel="Wiederherstellen" onConfirm={confirmImport} onClose={() => setPendingImport(null)}>
        Der aktuelle Fortschritt wird durch den Stand aus der Backup-Datei ersetzt.
      </Modal>
    </PageTransition>
  );
}
