import React from "react";
import { ArrowLeft } from "lucide-react";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

export default function FinalCTA() {
  const { t } = useLanguage();
  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2 style={styles.title}>{t("ابدأ بتنظيم محتواك اليوم.")}</h2>
        <p style={styles.sub}>{t("خطط أفضل. بيانات أوضح. قرارات أذكى.")}</p>
        <a href="/signup" style={styles.cta}>
          {t("ابدأ مجانًا")} <ArrowLeft size={16} />
        </a>
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "24px 24px 80px" },
  card: {
    background: landing.dark, borderRadius: 24, padding: "56px 24px", textAlign: "center",
    position: "relative", overflow: "hidden",
  },
  title: { fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, position: "relative", zIndex: 1 },
  sub: { fontSize: 14.5, color: "#9AA3BF", margin: "12px 0 28px", position: "relative", zIndex: 1 },
  cta: {
    display: "inline-flex", alignItems: "center", gap: 8, background: landing.gradient, color: "#fff",
    fontSize: 15, fontWeight: 800, padding: "14px 30px", borderRadius: 12, textDecoration: "none",
    position: "relative", zIndex: 1, boxShadow: "0 10px 28px rgba(255,77,61,0.35)",
  },
};
