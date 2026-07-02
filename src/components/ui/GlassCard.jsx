import { memo } from "react";
import { cx } from "../../utils/misc.js";
import styles from "./ui.module.css";

/** Liquid-Glass-Container; optionaler `tint` färbt Rand + Verlauf. */
const GlassCard = memo(function GlassCard({ tint, className, style, as: Tag = "div", children, ...rest }) {
  return (
    <Tag
      className={cx(styles.glass, className)}
      style={tint ? { ...style, "--tint": tint } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default GlassCard;
