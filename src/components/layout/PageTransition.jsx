import { motion, useReducedMotion } from "framer-motion";
import { useProgress } from "../../context/ProgressContext.jsx";

/**
 * Einheitliche Seiten-Eingangsanimation. Respektiert sowohl die
 * System-Einstellung (prefers-reduced-motion) als auch den
 * App-Toggle „Reduzierte Animationen".
 */
export default function PageTransition({ children }) {
  const systemReduced = useReducedMotion();
  const { settings } = useProgress();
  if (systemReduced || settings.reducedMotion) return <div>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0.33, 1] }}
    >
      {children}
    </motion.div>
  );
}
