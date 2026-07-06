import { memo, useRef, useState } from "react";
import { FileUp, Loader2, ScanSearch } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import { ACCENT } from "../../constants/theme.js";
import { useToast } from "../ui/Toast.jsx";
import { extractFileText } from "../../utils/fileText.js";
import { cx } from "../../utils/misc.js";
import styles from "./exams.module.css";

const MIN_TEXT_LENGTH = 80;
const ACCEPT = ".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Eingabe einer Altklausur: Text einfügen, Dateien laden (.pdf, .docx,
 * .txt, .md – auch mehrere) oder einfach per Drag & Drop hineinziehen.
 */
const ExamUpload = memo(function ExamUpload({ onAdd }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const { push } = useToast();

  const importFiles = async (files) => {
    if (!files?.length || busy) return;
    setBusy(true);
    let added = 0;
    let combined = text;
    for (const file of files) {
      try {
        const extracted = await extractFileText(file);
        if (!extracted) throw new Error("Datei enthält keinen Text.");
        combined = combined.trim()
          ? `${combined.trim()}\n\n––– ${file.name} –––\n\n${extracted}`
          : extracted;
        added++;
        if (added === 1 && !name) setName(file.name.replace(/\.[^.]+$/, ""));
      } catch (error) {
        push(`${file.name}: ${error.message}`, "⚠️");
      }
    }
    if (added > 0) {
      setText(combined);
      push(added === 1 ? "Datei gelesen – Text übernommen" : `${added} Dateien gelesen`, "📄");
    }
    setBusy(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    importFiles([...event.dataTransfer.files]);
  };

  const analyze = () => {
    if (text.trim().length < MIN_TEXT_LENGTH) {
      push(`Mindestens ${MIN_TEXT_LENGTH} Zeichen Klausurtext nötig`, "✋");
      return;
    }
    onAdd(name, text.trim());
    setName("");
    setText("");
  };

  return (
    <GlassCard
      tint={ACCENT.blue}
      className={cx(styles.upload, dragOver && styles.dragOver)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <label htmlFor="exam-name" className="visually-hidden">Name der Klausur</label>
      <input
        id="exam-name"
        className={styles.nameInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name, z.B. BWL EC – WiSe 2024/25"
      />
      <label htmlFor="exam-text" className="visually-hidden">Klausurtext</label>
      <textarea
        id="exam-text"
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Klausurtext einfügen – oder PDF/Word-Datei laden bzw. hierher ziehen …"
      />
      <p className={styles.hint}>
        💡 Lädt <strong>.pdf</strong>, <strong>.docx</strong>, .txt und .md direkt – auch mehrere
        Dateien auf einmal (werden zusammengeführt). Bei gescannten PDFs ohne Textebene: Text im
        Viewer markieren, kopieren und hier einfügen.
      </p>
      <div className={styles.actions}>
        <Button tint={ACCENT.blue} style={{ flex: 2 }} onClick={analyze} disabled={busy || text.trim().length < MIN_TEXT_LENGTH}>
          <ScanSearch size={15} aria-hidden="true" /> Analysieren &amp; speichern
        </Button>
        <Button style={{ flex: 1 }} onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy
            ? <><Loader2 size={15} className={styles.spin} aria-hidden="true" /> Lese …</>
            : <><FileUp size={15} aria-hidden="true" /> Datei</>}
        </Button>
      </div>
      <input ref={fileRef} type="file" multiple accept={ACCEPT}
        onChange={(e) => { const files = [...e.target.files]; e.target.value = ""; importFiles(files); }}
        style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
    </GlassCard>
  );
});

export default ExamUpload;
