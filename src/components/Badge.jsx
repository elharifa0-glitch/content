import React from "react";
import { colors, radius, alpha, softBg } from "../theme";

// Replaces the five near-duplicate badge/pill styles that existed before
// (miniBadge, badgeDanger, badgeWarning, badgeGeneric, attentionTag).
const TONES = {
  default: colors.textDim,
  info: colors.status.ready,
  success: colors.good,
  warning: colors.warning,
  danger: colors.danger,
  accent: colors.accentPurple,
};

// Precomputed, theme-reactive tinted backgrounds for each named tone —
// `alpha()` can't blend a `var(...)` token at render time, only a real hex,
// so named tones use these instead. A caller-supplied raw hex (e.g. a
// brand's own color) still goes through `alpha()` below since that *is* a
// real hex, not a theme token.
const TONE_SOFT_BG = {
  default: softBg.default,
  info: softBg.info,
  success: softBg.success,
  warning: softBg.warning,
  danger: softBg.danger,
  accent: softBg.accent,
};

export default function Badge({ tone = "default", color, icon, children, style }) {
  const c = color || TONES[tone] || TONES.default;
  const bg = color ? alpha(color, 0.14) : (TONE_SOFT_BG[tone] || TONE_SOFT_BG.default);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: radius.pill,
        color: c,
        background: bg,
        whiteSpace: "nowrap",
        lineHeight: 1.6,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
