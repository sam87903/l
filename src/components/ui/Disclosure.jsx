import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "./GlassCard.jsx";
import Collapse from "./Collapse.jsx";
import { kb } from "../../utils/misc.js";

/** Aufklappbare Detail-Sektion (Progressive Disclosure für Dashboards). */
const Disclosure = memo(function Disclosure({ icon, title, meta, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);

  return (
    <GlassCard style={{ marginBottom: "var(--s-2)", overflow: "hidden" }}>
      <div
        className="hover-pop"
        onClick={toggle}
        {...kb(toggle)}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: "var(--s-2)",
          minHeight: 48, padding: "var(--s-2) var(--s-4)", cursor: "pointer" }}
      >
        <span aria-hidden="true">{icon}</span>
        <span style={{ flex: 1, fontSize: "var(--fs-sm)", fontWeight: 800 }}>{title}</span>
        {meta && <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 600 }}>{meta}</span>}
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </div>
      <Collapse open={open}>
        <div style={{ padding: "0 var(--s-4) var(--s-4)" }}>{children}</div>
      </Collapse>
    </GlassCard>
  );
});

export default Disclosure;
