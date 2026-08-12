import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../Logo";
import { landing } from "./tokens";

const LINKS = [
  { href: "#product", label: "المنتج" },
  { href: "#features", label: "المميزات" },
  { href: "#how-it-works", label: "كيف يعمل؟" },
  { href: "#pricing", label: "الأسعار" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <a href="/" style={styles.logoLink} aria-label="ContentST">
          <Logo height={24} variant="dark" />
        </a>

        <nav style={styles.nav} className="landing-nav-desktop">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} style={styles.navLink}>{l.label}</a>
          ))}
        </nav>

        <div style={styles.actions} className="landing-nav-desktop">
          <a href="/login" style={styles.loginLink}>تسجيل الدخول</a>
          <a href="/signup" style={styles.ctaBtn}>ابدأ مجانًا</a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          style={styles.menuBtn}
          className="landing-nav-mobile-btn"
          aria-label={open ? "اقفل القائمة" : "افتح القائمة"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={styles.mobilePanel} className="landing-nav-mobile-panel">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} style={styles.mobileLink} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div style={styles.mobileDivider} />
          <a href="/login" style={styles.mobileLink}>تسجيل الدخول</a>
          <a href="/signup" style={{ ...styles.ctaBtn, textAlign: "center", marginTop: 4 }}>ابدأ مجانًا</a>
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
