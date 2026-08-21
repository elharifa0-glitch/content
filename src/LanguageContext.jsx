import React, { createContext, useCallback, useContext, useState } from "react";
import { translate } from "./translations";

const STORAGE_KEY = "cs-lang";
const LanguageContext = createContext(null);

function getInitialLang() {
  if (typeof window === "undefined") return "ar";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch (e) {
    // localStorage can throw in locked-down/private-browsing contexts
  }
  return "ar";
}

/**
 * App-wide language (Arabic/English) provider — same shape as ThemeContext
 * (localStorage-backed useState, a hook that throws outside the provider).
 * Unlike theme, switching language doesn't just flip a CSS attribute: it
 * also flips text direction (dir) and every visible string goes through
 * t(), which looks the Arabic source string up in translations.js and
 * falls back to the original Arabic when no translation exists yet — so a
 * string we haven't translated shows correct Arabic instead of breaking.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const changeLang = useCallback((next) => {
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // best-effort persistence only
    }
  }, []);

  const toggleLang = useCallback(() => {
    changeLang(lang === "ar" ? "en" : "ar");
  }, [lang, changeLang]);

  const t = useCallback((arabicText) => translate(arabicText, lang), [lang]);

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
