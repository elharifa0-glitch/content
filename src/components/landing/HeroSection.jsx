import React from "react";
import { ArrowLeft, PlayCircle, ShieldCheck } from "lucide-react";
import { KanbanMockup } from "./DashboardMockup";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <section style={styles.section} className="cs-animate-fade-up">
      <div style={styles.inner}>
        <div style={styles.eyebrow}>Plan. Create. Analyze. Improve.</div>
        <h1 style={styles.headline} className="landing-hero-headline">
          {t("كل محتواك.")}
          <br />
          <span style={styles.headlineAccent}>{t("من الفكرة للأداء.")}</span>
          <br />
          {t("في مكان واحد.")}
        </h1>
        <p style={styles.sub}>
          {t("خطط، أنشئ، تابع، وحلل أداء محتواك على منصات السوشيال من Dashboard واحد.")}
        </p>

        <div style={styles.ctaRow}>
          <a href="/signup" style={styles.primaryCta}>
            {t("ابدأ مجانًا")} <ArrowLeft size={16} />
          </a>
          <a href="#how-it-works" style={styles.secondaryCta}>
            <PlayCircle size={16} /> {t("شاهد كيف يعمل")}
          </a>
        </div>

        <div style={styles.reassure}>
          <ShieldCheck size={13} /> {t("بدون بطاقة ائتمانية")}
        </div>
      </div>

      <div style={styles.visualWrap} className="cs-animate-fade-up-delay">
        <div style={styles.visualGlow} />
        <div style={styles.visualInner}>
          <KanbanMockup />
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    maxWidth: 1160, margin: "0 auto", padding: "64px 24px 40px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
  },
  inner: { maxWidth: 720, display: "flex", flexDirection: "column", alignItems: "center" },
  eyebrow: {
    direction: "ltr", fontSize: 12.5, fontWeight: 800, letterSpacing: "0.08em",
    color: landing.red, marginBottom: 18, textTransform: "uppercase",
  },
  headline: {
    fontSize: 44, fontWeight: 800, lineHeight: 1.28, color: landing.text, margin: 0,
    textWrap: "balance",
  },
  headlineAccent: {
    background: landing.gradient, WebkitBackgroundClip: "text", backgroundClip: "text",
    color: "transparent",
  },
  sub: {
    fontSize: 16, color: landing.textDim, lineHeight: 1.8, margin: "22px 0 0", maxWidth: 520,
  },
  ctaRow: { display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" },
  primaryCta: {
    display: "flex", alignItems: "center", gap: 8, background: landing.gradient, color: "#fff",
    fontSize: 15, fontWeight: 800, padding: "14px 28px", borderRadius: 12, textDecoration: "none",
    boxShadow: "0 10px 28px rgba(255,77,61,0.32)",
  },
  secondaryCta: {
    display: "flex", alignItems: "center", gap: 8, background: landing.surface, color: landing.text,
    fontSize: 15, fontWeight: 700, padding: "14px 24px", borderRadius: 12, textDecoration: "none",
    border: `1px solid ${landing.border}`,
  },
  reassure: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: landing.textFaint, marginTop: 18,
  },
  visualWrap: { position: "relative", width: "100%", maxWidth: 940, marginTop: 56 },
  visualGlow: {
    position: "absolute", inset: "-10% -6% 10%", background: landing.gradient,
    opacity: 0.18, filter: "blur(80px)", zIndex: 0, borderRadius: 40,
  },
  visualInner: { position: "relative", zIndex: 1 },
};
