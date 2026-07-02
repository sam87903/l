import { memo } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, BookOpen, FileSearch, GraduationCap, Home, ListChecks } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { cx } from "../../utils/misc.js";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { to: "/",          icon: Home,          label: "Start", end: true },
  { to: "/plan",      icon: ListChecks,    label: "Plan" },
  { to: "/semester",  icon: GraduationCap, label: "Semester" },
  { to: "/glossar",   icon: BookOpen,      label: "Glossar" },
  { to: "/statistik", icon: BarChart3,     label: "Statistik" },
  { to: "/klausuren", icon: FileSearch,    label: "Klausuren" },
];

/** Schwebende Navigation: unten auf Mobile, linke Rail auf Desktop. */
const BottomNav = memo(function BottomNav() {
  return (
    <GlassCard as="nav" className={styles.nav} aria-label="Hauptnavigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cx(styles.navItem, isActive && styles.navItemActive)}
        >
          {({ isActive }) => (
            <>
              {/* Aktiv-Zustand über Form (gefülltes Icon) UND Farbe – WCAG 1.4.1 */}
              <Icon
                size={20}
                aria-hidden="true"
                fill={isActive ? "currentColor" : "none"}
                fillOpacity={isActive ? 0.28 : 0}
                strokeWidth={isActive ? 2.4 : 2}
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </GlassCard>
  );
});

export default BottomNav;
