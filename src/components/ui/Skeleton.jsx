import { memo } from "react";
import styles from "./ui.module.css";

/** Lade-Platzhalter mit Shimmer-Animation. */
const Skeleton = memo(function Skeleton({ height = 80, style }) {
  return <div className={styles.skeleton} style={{ height, ...style }} aria-hidden="true" />;
});

export default Skeleton;
