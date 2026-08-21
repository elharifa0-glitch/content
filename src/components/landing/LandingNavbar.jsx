import React, { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Logo } from "../Logo";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

const LINKS = [
  { href: "#product", label: "المنتج" },
  { href: "#features", label: "المميزات" },
  { href: "#how-it-works", label: "كيف يعمل؟" },
  { href: "#pricing", label: "الأسعار" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <a href="/" style={styles.logoLink} aria-label="ContentST">
          <Logo height={24} variant="dark" />
        </a>

        <nav style={styles.nav} className="landing-nav-desktop">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} style={styles.navLink}>{t(l.label)}</a>
          ))}
        </nav>

        <div style={styles.actions} className="landing-nav-desktop">
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
          <a href="/login" style={styles.loginLink}>{t("تسجيل الدخول")}</a>
          <a href="/signup" style={styles.ctaBtn}>{t("ابدأ مجانًا")}</a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          style={styles.menuBtn}
          className="landing-nav-mobile-btn"
          aria-label={open ? t("اقفل القائمة") : t("افتح القائمة")}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={styles.mobilePanel} className="landing-nav-mobile-panel">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} style={styles.mobileLink} onClick={() => setOpen(false)}>{t(l.label)}</a>
          ))}
          <div style={styles.mobileDivider} />
          <button type="button" onClick={toggleLang} style={{ ...styles.langBtn, alignSelf: "flex-start" }}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
          <a href="/login" style={styles.mobileLink}>{t("تسجيل الدخول")}</a>
          <a href="/signup" style={{ ...styles.ctaBtn, textAlign: "center", marginTop: 4 }}>{t("ابدأ مجانًا")}</a>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    position: "sticky", top: 0, zIndex: 40,
    background: "rgba(247,248,251,0.85)", backdropFilter: "blur(10px)",
    borderBottom: `1px solid ${landing.border}`,
  },
  inner: {
    maxWidth: 1160, margin: "0 auto", padding: "14px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
  },
  logoLink: { display: "flex", alignItems: "center", textDecoration: "none" },
  nav: { display: "flex", alignItems: "center", gap: 28 },
  navLink: { color: landing.textDim, fontSize: 13.5, fontWeight: 700, textDecoration: "none" },
  actions: { display: "flex", alignItems: "center", gap: 14 },
  langBtn: {
    display: "flex", alignItems: "center", gap: 5, background: landing.surface,
    border: `1px solid ${landing.border}`, color: landing.text, fontSize: 12, fontWeight: 800,
    borderRadius: 999, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit",
  },
  loginLink: { color: landing.text, fontSize: 13.5, fontWeight: 700, textDecoration: "none" },
  ctaBtn: {
    background: landing.gradient, color: "#fff", fontSize: 13.5, fontWeight: 800,
    padding: "10px 20px", borderRadius: 10, textDecoration: "none",
    boxShadow: "0 6px 18px rgba(255,77,61,0.28)",
  },
  menuBtn: {
    display: "none", background: landing.surface, border: `1px solid ${landing.border}`,
    borderRadius: 9, width: 38, height: 38, alignItems: "center", justifyContent: "center",
    color: landing.text, cursor: "pointer",
  },
  mobilePanel: {
    display: "flex", flexDirection: "column", gap: 4, padding: "8px 24px 18px",
    borderTop: `1px solid ${landing.border}`,
  },
  mobileLink: { color: landing.text, fontSize: 14.5, fontWeight: 700, textDecoration: "none", padding: "10px 4px" },
  mobileDivider: { height: 1, background: landing.border, margin: "6px 0" },
};
