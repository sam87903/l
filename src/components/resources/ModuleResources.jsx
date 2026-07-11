import { memo, useMemo } from "react";
import Disclosure from "../ui/Disclosure.jsx";
import Pill from "../ui/Pill.jsx";
import { CATS, MODS, RES } from "../../data/resources.js";
import styles from "./resources.module.css";

/* Videos zuerst, dann Übungen, Buchstellen, Tabellen, Karteikarten. */
const CAT_ORDER = { video: 0, web: 1, book: 2, table: 3, card: 4 };
const CAT_LABEL = new Map(CATS.map((c) => [c.id, `${c.e} ${c.label}`]));

/**
 * Lernmaterial kategorisiert im Plan: pro Semester eine aufklappbare
 * Sektion, darin jedes Modul als eigene Kategorie („Einführung in die
 * BWL", „Grundlagen des Handelsmanagements", …) – und die Links darunter
 * sortiert nach Art (Videos, Übungen, Buchstellen, Karteikarten).
 */
const ModuleResources = memo(function ModuleResources() {
  const semesters = useMemo(() => {
    const byMod = new Map();
    for (const r of RES) {
      const list = byMod.get(r.mod) ?? [];
      list.push(r);
      byMod.set(r.mod, list);
    }
    const groups = new Map();
    for (const mod of MODS) {
      const links = (byMod.get(mod.id) ?? [])
        .slice()
        .sort((a, b) => (CAT_ORDER[a.cat] ?? 9) - (CAT_ORDER[b.cat] ?? 9));
      if (links.length === 0) continue;
      // Innerhalb des Moduls nach Link-Art gruppieren (Videos, Üben, …)
      const catGroups = [];
      for (const link of links) {
        const last = catGroups[catGroups.length - 1];
        if (last && last.cat === link.cat) last.links.push(link);
        else catGroups.push({ cat: link.cat, links: [link] });
      }
      const cur = groups.get(mod.sem) ?? [];
      cur.push({ ...mod, catGroups });
      groups.set(mod.sem, cur);
    }
    // Semester 1–5, „Studium allgemein" (sem 0) ans Ende
    return [...groups.entries()].sort((a, b) => (a[0] || 99) - (b[0] || 99));
  }, []);

  return (
    <section aria-label="Lernmaterial nach Semester und Modul">
      <div className={styles.title}>
        <span className={styles.bar} aria-hidden="true" />
        Lernmaterial · nach Semester &amp; Modul
      </div>
      {semesters.map(([sem, mods]) => (
        <Disclosure
          key={sem}
          icon={sem === 0 ? "🎓" : "📚"}
          title={sem === 0 ? "Studium allgemein" : `Semester ${sem}`}
          meta={`${mods.length} ${mods.length === 1 ? "Modul" : "Module"}`}
          defaultOpen={sem === 1}
        >
          {mods.map((mod) => (
            <div key={mod.id} className={styles.group}>
              <div className={styles.groupHead} style={{ "--c": mod.c }}>
                <span aria-hidden="true">{mod.e}</span>
                <span className={styles.catLabel}>{mod.name}</span>
                <span className={styles.catCode}>{mod.label}</span>
              </div>
              {mod.catGroups.map((g) => (
                <div key={g.cat} className={styles.subGroup}>
                  <div className={styles.subLabel}>{CAT_LABEL.get(g.cat) ?? g.cat}</div>
                  <div className={styles.pills}>
                    {g.links.map((link, i) => (
                      <Pill key={i} label={link.l} href={link.u} color={mod.c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Disclosure>
      ))}
    </section>
  );
});

export default ModuleResources;
