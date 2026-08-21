import React from "react";
import { LayoutGrid, BarChart3, Wallet } from "lucide-react";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

const BRANDS = [
  { name: "Nova Studio", emoji: "🟠", ideas: 18, views: "248.6K" },
  { name: "Orbit Media", emoji: "🔵", ideas: 11, views: "96.2K" },
  { name: "Acme Brand", emoji: "🟢", ideas: 7, views: "41.8K" },
];

const FEATURES = [
  { icon: LayoutGrid, label: "أفكاره ومحتواه الخاص" },
  { icon: BarChart3, label: "تحليله وأداءه المستقل" },
  { icon: Wallet, label: "مدفوعاته ومصاريفه" },
];

export default function MultiBrandSection() {
  const { t } = useLanguage();
  return (
    <section style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>{t("براند واحد ولا عشرة، إدارتها من مكان واحد.")}</h2>
        <p style={styles.sub}>{t("لكل براند أفكاره ومحتواه وتحليله الخاص، من غير ما يتلخبط مع البراندات التانية.")}</p>
      </div>

      <div style={styles.cardsRow} className="landing-brands-grid">
        {BRANDS.map((b) => (
          <div key={b.name} style={styles.brandCard} className="landing-card-hover">
            <div style={styles.brandHead}>
              <span style={styles.brandEmoji}>{b.emoji}</span>
              <span style={styles.brandName}>{b.name}</span>
            </div>
            <div style={styles.brandStats}>
              <div><div style={styles.brandStatVal}>{b.ideas}</div><div style={styles.brandStatLabel}>{t("فكرة")}</div></div>
              <div><div style={styles.brandStatVal}>{b.views}</div><div style={styles.brandStatLabel}>{t("مشاهدة")}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.featuresRow}>
        {FEATURES.map((f) => (
          <div key={f.label} style={styles.featureChip}>
            <f.icon size={14} color={landing.red} /> {t(f.label)}
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 40 },
  title: { fontSize: 26, fontWeight: 800, color: landing.text, margin: 0, textWrap: "balance" },
  sub: { fontSize: 14, color: landing.textDim, margin: "10px auto 0", maxWidth: 460, lineHeight: 1.7 },
  cardsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 },
  brandCard: {
    background: landing.surface, border: `1px solid ${landing.border}`, borderRadius: 14, padding: 20,
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  brandHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  brandEmoji: { fontSize: 20 },
  brandName: { fontSize: 14.5, fontWeight: 800, color: landing.text },
  brandStats: { display: "flex", gap: 24 },
  brandStatVal: { fontSize: 18, fontWeight: 800, color: landing.text },
  brandStatLabel: { fontSize: 11, color: landing.textFaint, marginTop: 2 },
  featuresRow: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  featureChip: {
    display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: landing.textDim,
    background: landing.gradientSoft, borderRadius: 999, padding: "8px 16px",
  },
};
