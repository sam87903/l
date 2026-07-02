import { memo } from "react";
import { ExternalLink } from "lucide-react";
import styles from "./ui.module.css";

/** Antippbarer externer Link im Pill-Format. */
const Pill = memo(function Pill({ label, href, color }) {
  return (
    <a
      className={`${styles.pill} hover-pop`}
      style={{ "--c": color }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {label}
      <ExternalLink size={10} strokeWidth={2.5} aria-hidden="true" style={{ opacity: 0.6 }} />
    </a>
  );
});

export default Pill;
