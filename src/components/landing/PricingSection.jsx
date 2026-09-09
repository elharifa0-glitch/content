import React from "react";
import { Check } from "lucide-react";
import { PLANS, INCLUDED_FEATURES, PLAN_ONLY_FEATURES } from "../../PlanPicker";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

// كل باقة ليها سطر وضع/موضع واحد بيشرح فرق القيمة الحقيقي — مش بس عدد
// البراندات — قبل ما نعرض ليستة الميزات المشتركة وبعدها ميزات الباقة نفسها.
const PLAN_POSITIONING = {
  starter: "كل حاجة محتاجها عشان تخطط لمحتواك وتثبت إنه شغال.",
  pro: "كل حاجة في Starter، وكمان اللي محتاجه عشان تشتغل مع عملاء حقيقيين.",
  agency: "كل حاجة في Pro، من غير حد لعدد البراندات.",
};

export default function PricingSection() {
  const { t } = useLanguage();
  return (
    <section id="pricing" style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>{t("باقات بسيطة، بدون مفاجآت.")}</h2>
        <p style={styles.sub}>{t("ابدأ بلوحدك، وارقّي لما تحتاج تدير عملاء حقيقيين أو براندات أكتر.")}</p>
        <p style={styles.trialNote}>{t("🎁 تجربة مجانية 7 أيام — كل الميزات — لحد 3 براندات — من غير بطاقة ائتمانية")}</p>
      </div>

      <div style={styles.cardsRow} className="landing-pricing-grid">
        {PLANS.map((p) => (
          <div key={p.key} style={{ ...styles.card, ...(p.recommended ? styles.cardRecommended : {}) }}>
            {p.recommended && <div style={styles.badge}>{t("الأكتر اختيارًا")}</div>}
            <div style={styles.planName}>{p.name}</div>
            <div style={styles.planBrands}>{t(p.brands)}</div>
            <div style={styles.priceRow}>
              <span style={styles.price}>{t(p.price)}</span>
            </div>
            <div style={styles.annual}>{t("أو")} {t(p.annual)} {t("(وفّر شهرين)")}</div>
            <p style={styles.planPositioning}>{t(PLAN_POSITIONING[p.key])}</p>
            <div style={styles.planFeatureList}>
              {INCLUDED_FEATURES.map((f) => (
                <div key={f} style={styles.featureRow}>
                  <Check size={13} color={landing.good} style={{ flexShrink: 0 }} />
                  <span>{t(f)}</span>
                </div>
              ))}
              {(PLAN_ONLY_FEATURES[p.key] || []).map((f) => (
                <div key={f} style={styles.featureRow}>
                  <Check size={13} color={landing.red} style={{ flexShrink: 0 }} />
                  <span>{t(f)}</span>
                </div>
              ))}
            </div>
            <a href="/signup" style={p.recommended ? styles.ctaPrimary : styles.ctaSecondary}>{t("ابدأ مجانًا")}</a>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0 },
  sub: { fontSize: 14, color: landing.textDim, margin: "10px 0 0" },
  trialNote: { fontSize: 12.5, color: landing.textDim, margin: "10px 0 0", fontWeight: 700 },
  cardsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" },
  card: {
    position: "relative", background: landing.surface, border: `1px solid ${landing.border}`,
    borderRadius: 16, padding: "26px 22px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4,
  },
  cardRecommended: { border: `2px solid ${landing.red}`, boxShadow: "0 12px 32px rgba(255,77,61,0.14)" },
  badge: {
    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
    background: landing.gradient, color: "#fff", fontSize: 10.5, fontWeight: 800,
    padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap",
  },
  planName: { fontSize: 16, fontWeight: 800, color: landing.text, marginTop: 8 },
  planBrands: { fontSize: 12, color: landing.textDim },
  priceRow: { marginTop: 10 },
  price: { fontSize: 22, fontWeight: 800, color: landing.text },
  annual: { fontSize: 11.5, color: landing.textFaint },
  planPositioning: { fontSize: 12.5, color: landing.textDim, lineHeight: 1.6, margin: "8px 0 4px" },
  planFeatureList: { display: "flex", flexDirection: "column", gap: 8, textAlign: "start", margin: "8px 0 4px" },
  ctaPrimary: {
    marginTop: "auto", background: landing.gradient, color: "#fff", fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none",
  },
  ctaSecondary: {
    marginTop: "auto", background: landing.bg, color: landing.text, fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none", border: `1px solid ${landing.border}`,
  },
  featureRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: landing.text },
};
