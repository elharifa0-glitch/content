import React from "react";
import { ListChecks, BarChart3, Clock, Sparkles } from "lucide-react";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

const BENEFITS = [
  { icon: ListChecks, title: "نظّم أفكارك", desc: "تابع كل محتواك من مكان واحد." },
  { icon: BarChart3, title: "حلّل الأداء", desc: "أرقام حقيقية من منصاتك." },
  { icon: Clock, title: "وفّر وقتك", desc: "قلل العمل اليدوي المتكرر." },
  { icon: Sparkles, title: "قرارات أذكى", desc: "اعتمد على البيانات بدل التخمين." },
];

export default function BenefitsSection() {
  const { t } = useLanguage();
  return (
    <section id="product" style={styles.section}>
      <div style={styles.grid} className="landing-benefits-grid">
        {BENEFITS.map((b) => (
          <div key={b.title} style={styles.card} className="landing-card-hover">
            <div style={styles.iconWrap}><b.icon size={20} color={landing.red} /></div>
            <div style={styles.cardTitle}>{t(b.title)}</div>
            <div style={styles.cardDesc}>{t(b.desc)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "20px 24px 64px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  card: {
    background: landing.surface, border: `1px solid ${landing.border}`, borderRadius: 16,
    padding: "26px 22px", transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12, background: landing.gradientSoft,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  cardTitle: { fontSize: 15.5, fontWeight: 800, color: landing.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: landing.textDim, lineHeight: 1.7 },
};
