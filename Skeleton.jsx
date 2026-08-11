import React from "react";
import { colors, radius } from "../theme";

/**
 * Shimmering placeholder block — replaces the single centered spinner that
 * previously stood in for every loading state in the app.
 */
export function Skeleton({ width = "100%", height = 14, rounded = radius.sm, style }) {
  return (
    <span
      style={{
        display: "block",
        width,
        height,
        borderRadius: rounded,
        background: `linear-gradient(90deg, ${colors.card} 25%, ${colors.cardHover} 37%, ${colors.card} 63%)`,
        backgroundSize: "400% 100%",
        animation: "cs-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = "60%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16 }}>
      <Skeleton height={12} width="40%" style={{ marginBottom: 12 }} />
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;
