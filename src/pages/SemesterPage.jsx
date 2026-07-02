import PageTransition from "../components/layout/PageTransition.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import SemesterAccordion from "../components/semester/SemesterAccordion.jsx";
import WahlmoduleList from "../components/semester/WahlmoduleList.jsx";
import { SEMESTERS } from "../data/semesters/index.js";
import { ACCENT } from "../constants/theme.js";
import styles from "./pages.module.css";

/** Gesamtes Curriculum: 7 Semester, 210 ECTS, Wahlmodul-Katalog. */
export default function SemesterPage() {
  return (
    <PageTransition>
      <GlassCard tint={ACCENT.blue} className={styles.banner} style={{ "--c": ACCENT.blue }}>
        <div className={styles.bannerGlow} aria-hidden="true" />
        <p className={styles.bannerKicker}>🎓 Gesamtes Curriculum</p>
        <h2 className={styles.bannerTitle}>B.Sc. E-Commerce · HRW · BPO 02.06.2023</h2>
        <p className={styles.bannerText}>
          Alle 7 Semester, 210 ECTS, mit echten Modulinhalten aus dem Modulhandbuch.
          Jedes Thema mit Definition und Beispiel. Tippe auf ein Semester, dann auf ein Modul.
        </p>
      </GlassCard>

      {SEMESTERS.map((semester) => (
        <SemesterAccordion key={semester.nr} semester={semester} />
      ))}

      <WahlmoduleList />
    </PageTransition>
  );
}
