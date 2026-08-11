import React from "react";
import { colors, radius, spacing, transitions, softBg, borderTint } from "../theme";

const SIZES = {
  sm: { padding: "7px 12px", fontSize: 12.5, gap: 5, height: 32 },
  md: { padding: "10px 16px", fontSize: 13.5, gap: 7, height: 40 },
};

function variantStyle(variant, tone) {
  const accentColor = tone || colors.accentBlue;
  switch (variant) {
    case "primary":
      return {
        background: tone ? tone : colors.accentGradient,
        border: "1px solid transparent",
        color: colors.onAccent,
        fontWeight: 800,
      };
    case "secondary":
      return {
        background: colors.card,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontWeight: 700,
      };
    case "ghost":
      return {
        background: "transparent",
        border: "1px solid transparent",
        color: colors.textDim,
        fontWeight: 700,
      };
    case "danger":
      return {
        background: softBg.danger,
        border: `1px solid ${borderTint.danger}`,
        color: colors.danger,
        fontWeight: 700,
      };
    default:
      return { background: colors.card, border: `1px solid ${colors.border}`, color: colors.text };
  }
}

/**
 * Shared button primitive. Renders a <button> by default, or an <a> when
 * `href` is passed (needed for the existing WhatsApp/mailto-style links
 * that are styled as buttons elsewhere in the app).
 */
export default function Button({
  variant = "secondary",
  size = "md",
  tone,
  icon,
  iconPosition = "start",
  fullWidth,
  disabled,
  href,
  target,
  rel,
  style,
  className,
  children,
  ...rest
}) {
  const sizeStyle = SIZES[size] || SIZES.md;
  const vStyle = variantStyle(variant, tone);

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: sizeStyle.gap,
    padding: sizeStyle.padding,
    minHeight: sizeStyle.height,
    borderRadius: radius.sm,
    fontSize: sizeStyle.fontSize,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.5 : 1,
    transition: `background ${transitions.fast}, border-color ${transitions.fast}, transform ${transitions.fast}, box-shadow ${transitions.fast}`,
    ...vStyle,
    ...style,
  };

  const content = (
    <>
      {icon && iconPosition === "start" && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      {children && <span style={{ minWidth: 0 }}>{children}</span>}
      {icon && iconPosition === "end" && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        className={`cs-btn cs-btn-${variant} ${className || ""}`}
        style={baseStyle}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={`cs-btn cs-btn-${variant} ${className || ""}`}
      style={baseStyle}
      {...rest}
    >
      {content}
    </button>
  );
}
