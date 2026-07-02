import { memo, useRef, useState } from "react";
import { FileUp, ScanSearch } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Button from "../ui/Button.jsx";
import { ACCENT } from "../../constants/theme.js";
import { useToast } from "../ui/Toast.jsx";
import styles from "./exams.module.css";

const MIN_TEXT_LENGTH = 80;

/** Eingabe einer Altklausur: Text einfügen oder .txt/.md-Datei laden. */
const ExamUpload = memo(function ExamUpload({ onAdd }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef(null);
  const { push } = useToast();

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type === "application/pdf") {
      push("PDF bitte öffnen, Text kopieren und hier einfügen", "📄");
      return;
    }
    setText(await file.text());
    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
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
    <GlassCard tint={ACCENT.blue} className={styles.upload}>
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
        placeholder="Klausurtext hier einfügen … (aus PDF: Text markieren → kopieren → einfügen)"
      />
      <p className={styles.hint}>
        💡 PDF-Klausur? Öffne sie, wähle „Alles auswählen" → „Kopieren" und füge den Text hier ein.
        Je mehr Klausuren du speicherst, desto besser erkennt die Analyse wiederkehrende Muster.
      </p>
      <div className={styles.actions}>
        <Button tint={ACCENT.blue} style={{ flex: 2 }} onClick={analyze} disabled={text.trim().length < MIN_TEXT_LENGTH}>
          <ScanSearch size={15} aria-hidden="true" /> Analysieren &amp; speichern
        </Button>
        <Button style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
          <FileUp size={15} aria-hidden="true" /> Datei
        </Button>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" onChange={loadFile}
        style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
    </GlassCard>
  );
});

export default ExamUpload;
