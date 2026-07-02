import { motion } from "framer-motion";

/** Einheitliche Seiten-Eingangsanimation. */
export default function PageTransition({ children }) {
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
