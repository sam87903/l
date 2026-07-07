import { memo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/** Ein Modulthema mit aufklappbarer Definition + Beispiel. */
const TopicItem = memo(function TopicItem({ topic, color }) {
  const [open, setOpen] = useState(false);
  const headRef = useRef(null);
  const toggle = () => setOpen((v) => !v);
  // Doppelklick/-tipp auf Definition oder Beispiel klappt das Thema wieder ein
  // und holt den Themenkopf zurück in den Blick – man landet dort, wo man
  // das Thema aufgeklappt hat, statt weiter unten.
  const collapse = () => {
    setOpen(false);
    window.getSelection?.()?.removeAllRanges?.();
    headRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <GlassCard tint={open ? color : undefined} style={{ "--c": color, borderRadius: "var(--r-sm)" }}>
      <div ref={headRef} className={`${styles.topicHead} hover-pop`} onClick={toggle} {...kb(toggle)} aria-expanded={open}>
        <span style={{ color }} aria-hidden="true">▸</span>
        <span style={{ flex: 1 }}>{topic.t}</span>
        {open ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div className={styles.topicDetail} onDoubleClick={collapse} title="Doppelklick zum Einklappen">
          {topic.def && (
            <p className={styles.topicDef}>
              <span className={styles.topicLabel}>Definition: </span>{topic.def}
            </p>
          )}
          {topic.ex && (
            <p className={styles.topicEx} style={{ margin: "0 0 var(--s-2)" }}>
              <span className={styles.topicLabel}>Beispiel: </span>{topic.ex}
            </p>
          )}
        </div>
      </Collapse>
    </GlassCard>
  );
});

export default TopicItem;
