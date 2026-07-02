import { useCallback, useState } from "react";
import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import SemesterPager from "../components/semester/SemesterPager.jsx";
import SemesterAccordion from "../components/semester/SemesterAccordion.jsx";
import WahlmoduleList from "../components/semester/WahlmoduleList.jsx";
import { SEMESTERS } from "../data/semesters/index.js";
import { ACCENT } from "../constants/theme.js";
import styles from "./pages.module.css";

/** Gesamtes Curriculum: Pager (1–7) + Semester-Akkordeons + Wahlmodule. */
export default function SemesterPage() {
  const [openNr, setOpenNr] = useState(1);

  const selectSemester = useCallback((nr) => {
    setOpenNr(nr);
    // Nach dem Aufklappen zum gewählten Semester scrollen.
    requestAnimationFrame(() => {
      document.getElementById(`semester-${nr}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const toggleSemester = useCallback(
    (nr) => setOpenNr((current) => (current === nr ? null : nr)),
    []
  );

  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={styles.banner} style={{ "--c": ACCENT.blue }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>🎓 Gesamtes Curriculum</p>
        <h2 className={styles.bannerTitle}>B.Sc. E-Commerce · HRW · BPO 02.06.2023</h2>
        <p className={styles.bannerText}>
          Alle 7 Semester, 210 ECTS, mit echten Modulinhalten aus dem Modulhandbuch.
          Wähle oben ein Semester, dann ein Modul.
        </p>
      </GlassCard>

      <SemesterPager selected={openNr} onSelect={selectSemester} />

      {SEMESTERS.map((semester) => (
        <SemesterAccordion
          key={semester.nr}
          semester={semester}
          open={openNr === semester.nr}
          onToggle={toggleSemester}
        />
      ))}

      <WahlmoduleList />
    </PageTransition>
  );
}
