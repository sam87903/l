import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import BottomNav from "./BottomNav.jsx";
import TimerPill from "../timer/TimerPill.jsx";
import styles from "./layout.module.css";

/** Grundgerüst aller Seiten: Header, Inhaltsbereich, Navigation. */
export default function AppLayout() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
      <TimerPill />
    </>
  );
}
