import React from "react";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

// Shared chrome for the two legal pages (privacy/terms) — same navbar/footer
// and font-loading as LandingPage so they feel like part of the same site,
// reachable at "/privacy" and "/terms" regardless of session state (App.jsx
// routes to these before any auth/subscription gate).
export default function LegalLayout({ title, updatedAt, children }) {
  const { dir, t } = useLanguage();
  return (
    <div dir={dir} style={{ background: landing.bg, minHeight: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        .landing-root, .landing-root * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        .landing-root { min-width: 0; overflow-x: hidden; }
        .legal-content h2 { font-size: 16px; font-weight: 800; color: ${landing.text}; margin: 30px 0 10px; }
        .legal-content p, .legal-content li { font-size: 13.5px; color: ${landing.textDim}; line-height: 1.9; margin: 0 0 10px; }
        .legal-content ul { margin: 0 0 14px; padding-inline-start: 20px; display: flex; flex-direction: column; gap: 6px; }
        .legal-content a { color: ${landing.info}; }
      `}</style>
      <div className="landing-root">
        <LandingNavbar />
        <main style={styles.main}>
          <h1 style={styles.h1}>{t(title)}</h1>
          <p style={styles.updated}>{t("آخر تحديث")}: {updatedAt}</p>
          <div className="legal-content">{children}</div>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

const styles = {
  main: { maxWidth: 760, margin: "0 auto", padding: "48px 24px 72px" },
  h1: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0 },
  updated: { fontSize: 12.5, color: landing.textFaint, margin: "8px 0 32px" },
};
