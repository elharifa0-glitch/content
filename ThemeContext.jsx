import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { buildGlobalStyles } from "./globalStyles";

const STORAGE_KEY = "cs-theme";
const ThemeContext = createContext(null);

function getInitialMode() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch (e) {
    // localStorage can throw in locked-down/private-browsing contexts
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

/**
 * App-wide theme (light/dark) provider. Owns the one global stylesheet
 * (font, CSS variables for both palettes, focus rings, keyframes) and
 * flips the `data-theme` attribute on <html> — everything reading color
 * tokens from theme.js's `colors` is a CSS variable reference, so it
 * repaints instantly with no further wiring per component.
 */
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // best-effort persistence only
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <style>{buildGlobalStyles()}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
