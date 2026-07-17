import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Moon, Settings, Sun, SunMoon } from "lucide-react";
import MoroccoFlag from "../ui/MoroccoFlag.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { useOnline } from "../../hooks/useOnline.js";
import styles from "./layout.module.css";

const MODE_META = {
  auto:  { icon: SunMoon, state: "Automatisch (System)" },
  light: { icon: Sun,     state: "Hell" },
  dark:  { icon: Moon,    state: "Dunkel" },
};

/** Kopfzeile mit Branding, Streak, Level, Theme-Umschalter und Settings. */
const Header = memo(function Header() {
  const { mode, cycleMode } = useTheme();
  const { stats } = useProgress();
  const navigate = useNavigate();
  const online = useOnline();
  const { icon: ModeIcon, state } = MODE_META[mode] ?? MODE_META.auto;

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <span className={styles.brandFlag} aria-hidden="true"><MoroccoFlag size={24} /></span>
        <span style={{ minWidth: 0 }}>
          <h1 className={styles.brandTitle}>Marokko-Lernplan</h1>
          <p className={styles.brandSub}>HRW E-Commerce · Level {stats.level}</p>
        </span>
      </Link>
      <div className={styles.headerActions}>
        {!online && (
          <span className={styles.offlineChip} title="Kein Internet – die App läuft komplett lokal weiter">
            ✈️ Offline
          </span>
        )}
        {stats.streak > 0 && (
          <span className={styles.streakChip} title={`${stats.streak} Tage Lern-Streak`}>
            <Flame size={12} aria-hidden="true" />
            {stats.streak}
          </span>
        )}
        {/* Stabiles aria-label (APG); aktueller Zustand via title + Icon */}
        <button
          className={`${styles.iconBtn} hover-pop`}
          onClick={cycleMode}
          aria-label="Design-Modus wechseln"
          title={`Design-Modus wechseln – aktuell: ${state}`}
        >
          <ModeIcon size={17} aria-hidden="true" focusable="false" />
        </button>
        <button
          className={`${styles.iconBtn} hover-pop`}
          onClick={() => navigate("/einstellungen")}
          aria-label="Einstellungen"
        >
          <Settings size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
});

export default Header;
