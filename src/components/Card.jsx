import React from "react";
import { colors, radius, spacing } from "../theme";

/**
 * Shared surface primitive — replaces the six near-duplicate ad hoc card
 * styles that existed before (statCard, financeCard, kpiCard, refCard,
 * idCard, brandMiniCard). Those screens adopt this in later steps; this
 * file just establishes the one pattern they'll converge on.
 */
export default function Card({
  padding = spacing.lg,
  accentColor,
  interactive,
  as: Tag = "div",
  style,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`${interactive ? "cs-card-interactive" : ""} ${className || ""}`}
      style={{
        position: "relative",
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding,
        overflow: "hidden",
        textAlign: "inherit",
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      {...rest}
    >
      {accentColor && (
        <span
          style={{
            position: "absolute",
            insetInlineStart: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: accentColor,
          }}
        />
      )}
      {children}
    </Tag>
  );
}
