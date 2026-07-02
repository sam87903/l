import { memo } from "react";
import { cx } from "../../utils/misc.js";
import styles from "./ui.module.css";

/** Kleine Info-Kapsel (Countdown, Status, Meta-Angaben). */
const Chip = memo(function Chip({ icon, children, className, ...rest }) {
  return (
    <span className={cx(styles.chip, className)} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
});

export default Chip;
