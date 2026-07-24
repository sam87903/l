import { useProgress } from "../../context/ProgressContext.jsx";

/**
 * Einheitliche Seiten-Eingangsanimation (CSS, ohne Animations-Bibliothek).
 * Die System-Einstellung `prefers-reduced-motion` und der App-Toggle
 * „Reduzierte Animationen" stellen sie über animations.css ruhig; bei
 * aktivem Toggle wird die Klasse zusätzlich gar nicht erst gesetzt.
 */
export default function PageTransition({ children }) {
  const { settings } = useProgress();
  return <div className={settings.reducedMotion ? undefined : "anim-page"}>{children}</div>;
}
