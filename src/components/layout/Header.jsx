import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Moon, Settings, Sun, SunMoon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import styles from "./layout.module.css";

const MODE_META = {
  auto:  { icon: SunMoon, label: "Theme: automatisch (System)" },
  light: { icon: Sun,     label: "Theme: hell" },
  dark:  { icon: Moon,    label: "Theme: dunkel" },
};

/** Kopfzeile mit Branding, Streak, Level, Theme-Umschalter und Settings. */
const Header = memo(function Header() {
  const { mode, cycleMode } = useTheme();
  const { stats } = useProgress();
  const navigate = useNavigate();
  const { icon: ModeIcon, label } = MODE_META[mode] ?? MODE_META.auto;

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <span className={styles.brandFlag} aria-hidden="true">🇲🇦</span>
        <span style={{ minWidth: 0 }}>
          <h1 className={styles.brandTitle}>Marokko-Lernplan</h1>
          <p className={styles.brandSub}>HRW E-Commerce · Level {stats.level}</p>
        </span>
      </Link>
      <div className={styles.headerActions}>
        {stats.streak > 0 && (
          <span className={styles.streakChip} title={`${stats.streak} Tage Lern-Streak`}>
            <Flame size={12} aria-hidden="true" />
            {stats.streak}
          </span>
        )}
        <button className={`${styles.iconBtn} hover-pop`} onClick={cycleMode} aria-label={label} title={label}>
          <ModeIcon size={17} aria-hidden="true" />
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
