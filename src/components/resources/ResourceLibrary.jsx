import { memo, useMemo, useState } from "react";
import GlassCard from "../ui/GlassCard.jsx";
import Pill from "../ui/Pill.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { CATS, MODS, RES } from "../../data/resources.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./resources.module.css";

/** Kuratierte externe Lernressourcen, nach Kategorie und Modul gruppiert. */
const ResourceLibrary = memo(function ResourceLibrary() {
  const [category, setCategory] = useState("video");
  const activeCat = CATS.find((c) => c.id === category);

  const byModule = useMemo(
    () =>
      MODS.map((mod) => ({
        ...mod,
        links: RES.filter((r) => r.cat === category && r.mod === mod.id),
      })).filter((m) => m.links.length > 0),
    [category]
  );

  return (
    <GlassCard tint={ACCENT.blue} className={styles.wrap}>
      <div className={styles.title}>
        <span className={styles.bar} aria-hidden="true" />
        Ressourcen-Bibliothek
        <span className={styles.meta}>· Modulhandbuch HRW BPO 2023</span>
      </div>
      <div className={styles.tabs} role="group" aria-label="Ressourcen-Kategorie">
        {CATS.map((cat) => (
          <button
            key={cat.id}
            className={cx(styles.tab, category === cat.id && styles.tabActive, "hover-pop")}
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
          >
            {cat.e} {cat.label}
          </button>
        ))}
      </div>
      {byModule.map((mod) => (
        <div key={mod.id} className={styles.group}>
          <div className={styles.groupHead} style={{ "--c": mod.c }}>
            <span aria-hidden="true">{mod.e}</span>
            <span className={styles.groupLabel}>{mod.label}</span>
            <span className={styles.groupDesc}>— {mod.desc}</span>
          </div>
          <div className={styles.pills}>
            {mod.links.map((link, i) => (
              <Pill key={i} label={link.l} href={link.u} color={activeCat.c} />
            ))}
          </div>
        </div>
      ))}
      {byModule.length === 0 && <EmptyState icon="📭">Keine Links in dieser Kategorie.</EmptyState>}
    </GlassCard>
  );
});

export default ResourceLibrary;
