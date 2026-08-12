import React from "react";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { AnalyzerMockup } from "./DashboardMockup";
import { landing } from "./tokens";

function TiktokIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82c-.7-.77-1.09-1.76-1.1-2.82h-2.99v13.39a2.6 2.6 0 1 1-1.86-2.49v-3.05a5.6 5.6 0 1 0 4.85 5.55V9.4a7.05 7.05 0 0 0 4.1 1.31V7.68c-1.11 0-2.15-.36-2.99-1a4.62 4.62 0 0 1-.01-.86z" />
    </svg>
  );
}

const PLATFORMS = [
  { icon: Instagram, label: "Instagram" },
  { icon: TiktokIcon, label: "TikTok" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
];

export default function AnalyzerShowcase() {
  return (
    <section id="features" style={styles.section}>
      <div style={styles.grid} className="landing-split-grid">
        <div style={styles.textCol}>
          <div style={styles.eyebrow}>Social Analyzer</div>
          <h2 style={styles.title}>حلّل أي محتوى في ثواني.</h2>
          <p style={styles.desc}>
            الصق رابط الـReel أو الـPost أو الـVideo وشوف أرقام الأداء في مكان واحد.
          </p>
          <div style={styles.platformsRow}>
            {PLATFORMS.map((p) => (
              <span key={p.label} style={styles.platformChip}><p.icon size={14} /> {p.label}</span>
            ))}
          </div>
          <a href="/signup" style={styles.cta}>تحليل المحتوى</a>
          <p style={styles.demoNote}>* أرقام تجريبية للتوضيح فقط</p>
        </div>
        <div style={styles.visualCol}>
          <AnalyzerMockup />
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 56, alignItems: "center" },
  textCol: {},
  eyebrow: { fontSize: 12.5, fontWeight: 800, color: landing.red, marginBottom: 12, direction: "ltr" },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0, textWrap: "balance" },
  desc: { fontSize: 14.5, color: landing.textDim, lineHeight: 1.8, margin: "16px 0 20px", maxWidth: 420 },
  platformsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 },
  platformChip: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: landing.textDim,
    background: landing.surface, border: `1px solid ${landing.border}`, borderRadius: 999, padding: "6px 13px",
  },
  cta: {
    display: "inline-block", background: landing.gradient, color: "#fff", fontSize: 14, fontWeight: 800,
    padding: "12px 24px", borderRadius: 11, textDecoration: "none", boxShadow: "0 8px 22px rgba(255,77,61,0.28)",
  },
  demoNote: { fontSize: 11, color: landing.textFaint, marginTop: 12 },
  visualCol: {},
};
