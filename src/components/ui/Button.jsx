import { memo } from "react";
import { cx } from "../../utils/misc.js";
import styles from "./ui.module.css";

/**
 * Basis-Button. `tint` erzeugt eine eingefärbte Variante,
 * `ghost` eine rahmenlose.
 */
const Button = memo(function Button({ tint, ghost, className, style, children, ...rest }) {
  return (
    <button
      className={cx(styles.btn, tint && styles.btnTinted, ghost && styles.btnGhost, "hover-pop", className)}
      style={tint ? { ...style, "--c": tint } : style}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
