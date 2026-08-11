// ============================================================================
// Global design tokens — single source of truth for color, type, spacing,
// radius, shadow, motion and layering across the app.
//
// Color is theme-aware: `colors` below is a proxy of CSS custom-property
// references (var(--cs-x)), not literal hex. The actual hex values for each
// mode live in `darkPalette` / `lightPalette` and are written to :root by
// globalStyles.js, switched instantly via the `data-theme` attribute that
// ThemeContext manages. Everything that reads from `colors` — inline style
// objects included — repaints automatically when the theme toggles, with
// no per-component logic needed.
//
// This file is additive: nothing here changes data, business logic or
// Supabase calls.
// ============================================================================

// Raw hex palettes — the only place literal color values live.
export const darkPalette = {
  bg: "#080B14",
  bgElevated: "#0B1020",
  surface: "#0F1424",
  surfaceHover: "#141A2C",
  card: "#121729",
  cardHover: "#161D33",
  border: "#1E2740",
  borderStrong: "#2A3557",

  text: "#F3F5FA",
  textDim: "#9AA3BF",
  textFaint: "#6B7494",

  accentBlue: "#6C8CFF",
  accentPurple: "#8B6CF0",
  accentMagenta: "#C65FC9",
  accentPink: "#EE73B4",
  onAccent: "#0B0E17",

  status: { idea: "#9AA3BF", ready: "#5FA8D3", scheduled: "#E7A33E", done: "#4FB286" },
  danger: "#F2777A",
  warning: "#E7A33E",
  good: "#4FB286",
  info: "#5FA8D3",

  shadowColor: "rgba(3,5,12,0.4)",
  shadowColorStrong: "rgba(3,5,12,0.55)",
};

export const lightPalette = {
  bg: "#F7F8FB",
  bgElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceHover: "#F2F4F8",
  card: "#FFFFFF",
  cardHover: "#F5F6FA",
  border: "#E4E7EE",
  borderStrong: "#D3D8E3",

  text: "#151A24",
  textDim: "#5B6472",
  textFaint: "#8A93A1",

  // Deepened relative to the dark-mode accents so they stay legible on a
  // white surface — same blue → purple → pink identity, more saturated.
  accentBlue: "#3D5FE0",
  accentPurple: "#6B46C8",
  accentMagenta: "#A83FAE",
  accentPink: "#D94F9A",
  onAccent: "#FFFFFF",

  status: { idea: "#5B6472", ready: "#2E7DAE", scheduled: "#B5790A", done: "#1F9D63" },
  danger: "#C8404A",
  warning: "#B5790A",
  good: "#1F9D63",
  info: "#2E7DAE",

  shadowColor: "rgba(15,20,35,0.08)",
  shadowColorStrong: "rgba(15,20,35,0.14)",
};

// hex -> rgba(...) — used when building the CSS custom properties above
// (globalStyles.js) and for one-off blends against real, non-token hex
// values (e.g. a user's own brand color), never against a `var(...)` string.
export function alpha(hex, opacity) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Theme-reactive color proxy — every value is a CSS variable reference.
// Components read `colors.text`, `colors.accentBlue`, etc. exactly as
// before; the browser resolves the live value against whichever
// data-theme is active.
export const colors = {
  bg: "var(--cs-bg)",
  bgElevated: "var(--cs-bg-elevated)",
  surface: "var(--cs-surface)",
  surfaceHover: "var(--cs-surface-hover)",
  card: "var(--cs-card)",
  cardHover: "var(--cs-card-hover)",
  border: "var(--cs-border)",
  borderStrong: "var(--cs-border-strong)",

  text: "var(--cs-text)",
  textDim: "var(--cs-text-dim)",
  textFaint: "var(--cs-text-faint)",

  accentBlue: "var(--cs-accent-blue)",
  accentPurple: "var(--cs-accent-purple)",
  accentMagenta: "var(--cs-accent-magenta)",
  accentPink: "var(--cs-accent-pink)",
  accentGradient: "var(--cs-accent-gradient)",
  accentGradientSoft: "var(--cs-accent-gradient-soft)",
  onAccent: "var(--cs-on-accent)",

  status: {
    idea: "var(--cs-status-idea)",
    ready: "var(--cs-status-ready)",
    scheduled: "var(--cs-status-scheduled)",
    done: "var(--cs-status-done)",
  },
  danger: "var(--cs-danger)",
  warning: "var(--cs-warning)",
  good: "var(--cs-good)",
  info: "var(--cs-info)",
};

// Precomputed tinted-background / tinted-border variants for the semantic
// colors above — the theme-aware equivalent of the old `alpha(hex, n)`
// call-sites (that helper can't blend a `var(...)` string at render time,
// only a real hex, so anything theme-reactive gets a named token instead).
export const softBg = {
  default: "var(--cs-default-soft)",
  info: "var(--cs-info-soft)",
  success: "var(--cs-good-soft)",
  warning: "var(--cs-warning-soft)",
  danger: "var(--cs-danger-soft)",
  accent: "var(--cs-accent-purple-soft)",
  accentBlue: "var(--cs-accent-blue-soft)",
};

export const borderTint = {
  danger: "var(--cs-danger-border)",
  warning: "var(--cs-warning-border)",
  accent: "var(--cs-accent-purple-border)",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// 4px base scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const typography = {
  fontFamily: {
    arabic: "'Tajawal', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', ui-monospace, 'Cascadia Code', Consolas, monospace",
  },
  // One hierarchy, referenced everywhere instead of the ~24 ad hoc sizes
  // that existed before (8.5px–22px scattered per element).
  scale: {
    pageTitle: { fontSize: 24, fontWeight: 800, lineHeight: 1.25 },
    sectionTitle: { fontSize: 17, fontWeight: 800, lineHeight: 1.3 },
    cardTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.4 },
    body: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 },
    secondary: { fontSize: 12, fontWeight: 500, lineHeight: 1.6 },
    caption: { fontSize: 11, fontWeight: 700, lineHeight: 1.5, letterSpacing: "0.02em" },
  },
};

export const shadows = {
  sm: "0 1px 2px var(--cs-shadow-color)",
  md: "0 4px 16px var(--cs-shadow-color-strong)",
  lg: "0 12px 40px var(--cs-shadow-color-strong)",
  accentGlow: "var(--cs-accent-glow)",
};

export const transitions = {
  fast: "120ms cubic-bezier(.4,0,.2,1)",
  base: "180ms cubic-bezier(.4,0,.2,1)",
  slow: "320ms cubic-bezier(.4,0,.2,1)",
};

export const zIndex = {
  dropdown: 50,
  drawer: 55,
  modal: 60,
  toast: 70,
};

// Max-widths — mirrors the breakpoints already in use in the app's
// responsive CSS (900 / 700 / 380) so new and old rules agree.
export const breakpoints = {
  mobile: 700,
  tablet: 900,
  desktop: 1200,
};

const theme = {
  colors, softBg, borderTint, alpha, radius, spacing, typography, shadows, transitions, zIndex, breakpoints,
  darkPalette, lightPalette,
};

export default theme;
