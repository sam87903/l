import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import Collapse from "../ui/Collapse.jsx";
import { kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

/** Ein Modulthema mit aufklappbarer Definition + Beispiel. */
const TopicItem = memo(function TopicItem({ topic, color }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <GlassCard tint={open ? color : undefined} style={{ "--c": color, borderRadius: "var(--r-sm)" }}>
      <div className={`${styles.topicHead} hover-pop`} onClick={toggle} {...kb(toggle)} aria-expanded={open}>
        <span style={{ color }} aria-hidden="true">▸</span>
        <span style={{ flex: 1 }}>{topic.t}</span>
        {open ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div className={styles.topicDetail}>
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
