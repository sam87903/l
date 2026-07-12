import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import BottomNav from "./BottomNav.jsx";
import styles from "./layout.module.css";

const PAGE_NAMES = {
  "/": "Start",
  "/plan": "Plan",
  "/detail": "Tagesdetail",
  "/semester": "Semester",
  "/glossar": "Glossar",
  "/statistik": "Statistik",
  "/klausuren": "Klausuren",
  "/einstellungen": "Einstellungen",
};

/** Grundgerüst aller Seiten: Header, Inhaltsbereich, Navigation. */
export default function AppLayout() {
  const { pathname } = useLocation();
  const pageName = PAGE_NAMES[pathname] ?? "Seite";

  return (
    <>
      <a href="#inhalt" className="skip-link">Zum Inhalt springen</a>
      <Header />
      {/* Kündigt Screenreadern den Seitenwechsel an (SPA hat keine echten
          Seitenladungen, die das sonst täten). */}
      <div className="visually-hidden" role="status" aria-live="polite">{pageName}</div>
      <main id="inhalt" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
