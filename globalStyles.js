import { darkPalette, lightPalette, alpha, transitions, radius } from "./theme";

// ============================================================================
// Global stylesheet — the one place font-loading, theme variables, focus
// rings, keyframes and scrollbar styling live. Injected once at the app
// root (by ThemeContext), not per-screen.
//
// Inline style objects (still the app's styling approach) can't express
// :hover / :focus-visible / @keyframes / @media / CSS variables — this is
// the slice of real CSS that backs those, generated from the same raw
// palettes used everywhere else so there is exactly one source of truth
// for both dark and light mode.
// ============================================================================

function paletteVars(p) {
  return `
      --cs-bg: ${p.bg};
      --cs-bg-elevated: ${p.bgElevated};
      --cs-surface: ${p.surface};
      --cs-surface-hover: ${p.surfaceHover};
      --cs-card: ${p.card};
      --cs-card-hover: ${p.cardHover};
      --cs-border: ${p.border};
      --cs-border-strong: ${p.borderStrong};
      --cs-text: ${p.text};
      --cs-text-dim: ${p.textDim};
      --cs-text-faint: ${p.textFaint};
      --cs-accent-blue: ${p.accentBlue};
      --cs-accent-purple: ${p.accentPurple};
      --cs-accent-magenta: ${p.accentMagenta};
      --cs-accent-pink: ${p.accentPink};
      --cs-on-accent: ${p.onAccent};
      --cs-accent-gradient: linear-gradient(135deg, ${p.accentBlue} 0%, ${p.accentPurple} 45%, ${p.accentMagenta} 75%, ${p.accentPink} 100%);
      --cs-accent-gradient-soft: linear-gradient(135deg, ${alpha(p.accentBlue, 0.16)} 0%, ${alpha(p.accentPurple, 0.16)} 50%, ${alpha(p.accentPink, 0.16)} 100%);
      --cs-accent-glow: 0 0 0 1px ${alpha(p.accentPurple, 0.4)}, 0 8px 24px ${alpha(p.accentPurple, 0.35)};
      --cs-status-idea: ${p.status.idea};
      --cs-status-ready: ${p.status.ready};
      --cs-status-scheduled: ${p.status.scheduled};
      --cs-status-done: ${p.status.done};
      --cs-danger: ${p.danger};
      --cs-warning: ${p.warning};
      --cs-good: ${p.good};
      --cs-info: ${p.info};
      --cs-shadow-color: ${p.shadowColor};
      --cs-shadow-color-strong: ${p.shadowColorStrong};

      --cs-default-soft: ${alpha(p.textDim, 0.14)};
      --cs-danger-soft: ${alpha(p.danger, 0.14)};
      --cs-danger-border: ${alpha(p.danger, 0.4)};
      --cs-warning-soft: ${alpha(p.warning, 0.12)};
      --cs-warning-border: ${alpha(p.warning, 0.35)};
      --cs-good-soft: ${alpha(p.good, 0.14)};
      --cs-info-soft: ${alpha(p.info, 0.14)};
      --cs-accent-purple-soft: ${alpha(p.accentPurple, 0.14)};
      --cs-accent-purple-border: ${alpha(p.accentPurple, 0.4)};
      --cs-accent-blue-soft: ${alpha(p.accentBlue, 0.16)};
  `;
}

export function buildGlobalStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

    :root {
      ${paletteVars(darkPalette)}
      --cs-radius-sm: ${radius.sm}px;
      --cs-radius-md: ${radius.md}px;
      --cs-radius-lg: ${radius.lg}px;
      --cs-transition-base: ${transitions.base};
    }
    /* No explicit choice saved yet — follow the OS preference. An explicit
       data-theme attribute (set by ThemeContext from localStorage or this
       same media query, on first load) always overrides this. */
    @media (prefers-color-scheme: light) {
      :root:not([data-theme]) { ${paletteVars(lightPalette)} }
    }
    :root[data-theme="dark"] { ${paletteVars(darkPalette)} }
    :root[data-theme="light"] { ${paletteVars(lightPalette)} }

    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    html, body { background: var(--cs-bg) !important; transition: background ${transitions.base}; }
    ::placeholder { color: var(--cs-text-faint); }

    /* ---------- Scrollbars ---------- */
    .scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .scrollbar::-webkit-scrollbar-thumb { background: var(--cs-border); border-radius: 6px; }
    .scrollbar::-webkit-scrollbar-thumb:hover { background: var(--cs-border-strong); }

    /* ---------- Focus (keyboard) ---------- */
    a, button, input, select, textarea, [tabindex] { outline: none; }
    a:focus-visible, button:focus-visible, input:focus-visible,
    select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
      outline: 2px solid var(--cs-accent-blue);
      outline-offset: 2px;
      border-radius: var(--cs-radius-sm);
    }

    /* ---------- Motion ---------- */
    @keyframes cs-spin { to { transform: rotate(360deg); } }
    @keyframes cs-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cs-scale-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    @keyframes cs-slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes cs-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    .cs-animate-fade { animation: cs-fade-in ${transitions.base} both; }
    .cs-animate-scale { animation: cs-scale-in ${transitions.base} both; }
    .cs-animate-drawer { animation: cs-slide-in-right ${transitions.slow} both; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }

    /* ---------- Interactive hover states (can't be expressed as inline styles) ---------- */
    .cs-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
    .cs-btn-primary:active:not(:disabled) { filter: brightness(0.96); }
    .cs-btn-secondary:hover:not(:disabled) { background: var(--cs-card-hover); border-color: var(--cs-border-strong); }
    .cs-btn-ghost:hover:not(:disabled) { background: var(--cs-card); color: var(--cs-text); }
    .cs-btn-danger:hover:not(:disabled) { background: var(--cs-danger-border); }

    .cs-card-interactive { transition: border-color ${transitions.fast}, background ${transitions.fast}, transform ${transitions.fast}; }
    .cs-card-interactive:hover { border-color: var(--cs-border-strong); background: var(--cs-card-hover); }

    .cs-nav-item { transition: background ${transitions.fast}, color ${transitions.fast}; }
    .cs-nav-item:hover { background: var(--cs-surface-hover); color: var(--cs-text); }

    .cs-icon-btn { transition: background ${transitions.fast}, border-color ${transitions.fast}, color ${transitions.fast}; }
    .cs-icon-btn:hover { background: var(--cs-card-hover); border-color: var(--cs-border-strong); color: var(--cs-text); }

    .cs-input:focus { border-color: var(--cs-accent-blue) !important; box-shadow: 0 0 0 3px var(--cs-accent-blue-soft); }

    /* ---------- Mobile sidebar drawer ---------- */
    .cs-sidebar-backdrop {
      position: fixed; inset: 0; background: rgba(3,5,12,0.6);
      z-index: 54; display: none;
    }
    @media (max-width: 900px) {
      .cs-sidebar-backdrop.cs-open { display: block; }
    }
  `;
}
