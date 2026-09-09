import React from "react";
import { Check } from "lucide-react";
import { PLANS } from "../../PlanPicker";
import { PLANS as PLAN_DEFS } from "../../plans";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

// Presentation-only content for the landing pricing section. Prices, brand
// limits, and which plan has which gated feature all still come from
// src/plans.js (via PLAN_DEFS below and the pre-formatted PLANS array from
// PlanPicker.jsx) — nothing here re-defines a number that already exists
// there, this only supplies the Arabic copy and the layout.

// Shown once, above the three cards, instead of being repeated inside every
// card — these are identical across all paid plans.
const CORE_FEATURES = [
  "لوحة المحتوى وتقويم النشر",
  "Social Analyzer",
  "Brand Insights وتحليل الأداء",
  "تتبع المدفوعات والمصاريف",
  "PDF Reports",
];

const PLAN_SUBTITLE = {
  starter: "لإدارة محتوى لحد 2 براند",
  pro: "لإدارة العملاء وتقديم تقارير احترافية",
  agency: "لإدارة عدد غير محدود من البراندات",
};

const PRO_HIGHLIGHTS = [
  { title: "Client Share & Approval", desc: "شارك المحتوى مع العميل وخليه يوافق أو يطلب تعديل بدون تسجيل دخول" },
  { title: "White-label Reports & Branding", desc: "تقارير باسم ولوجو شركتك" },
];

// Only the brand-count number comes from plans.js (PLAN_DEFS[key].brandLimit)
// — the surrounding phrase is fixed copy per the "حتى" wording used
// throughout this section, matching the exact plural used elsewhere in the
// app for 2 vs. more brands.
function brandCountBullet(brandLimit) {
  if (brandLimit === Infinity) return "براندات غير محدودة";
  return brandLimit === 2 ? "حتى 2 براند" : `حتى ${brandLimit} براندات`;
}

function FeatureRow({ text, sub, t }) {
  return (
    <div style={styles.featureRow}>
      <Check size={14} color={landing.good} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div>{t(text)}</div>
        {sub && <div style={styles.featureSub}>{t(sub)}</div>}
      </div>
    </div>
  );
}

export default function PricingSection() {
  const { t } = useLanguage();
  return (
    <section id="pricing" style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>{t("باقات بسيطة، بدون مفاجآت.")}</h2>
        <p style={styles.sub}>{t("ابدأ بلوحدك، وارقّي لما تحتاج تدير عملاء حقيقيين أو براندات أكتر.")}</p>
        <p style={styles.trialNote}>{t("🎁 تجربة مجانية 7 أيام — كل الميزات — لحد 3 براندات — من غير بطاقة ائتمانية")}</p>
      </div>

      <div style={styles.coreBand}>
        <div style={styles.coreBandTitle}>{t("كل الباقات تشمل")}</div>
        <div style={styles.coreBandRow}>
          {CORE_FEATURES.map((f) => (
            <div key={f} style={styles.coreItem}>
              <Check size={13} color={landing.good} style={{ flexShrink: 0 }} />
              <span>{t(f)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.cardsRow} className="landing-pricing-grid">
        {PLANS.map((p) => {
          const def = PLAN_DEFS[p.key];
          return (
            <div key={p.key} style={{ ...styles.card, ...(p.recommended ? styles.cardRecommended : {}) }}>
              {p.recommended && <div style={styles.badge}>{t("الأكتر اختيارًا")}</div>}
              <div style={styles.planName}>{p.name}</div>
              <div style={styles.planSubtitle}>{t(PLAN_SUBTITLE[p.key])}</div>
              <div style={styles.priceRow}>
                <span style={styles.price}>{t(p.price)}</span>
              </div>
              <div style={styles.annual}>{t("أو")} {t(p.annual)} {t("(وفّر شهرين)")}</div>

              <div style={styles.includedList}>
                {p.key === "starter" && (
                  <>
                    <FeatureRow t={t} text={brandCountBullet(def.brandLimit)} />
                    <FeatureRow t={t} text="كل المميزات الأساسية" />
                    <FeatureRow t={t} text="PDF Reports" sub="بتصميم ContentST" />
                  </>
                )}
                {p.key === "pro" && (
                  <>
                    <FeatureRow t={t} text="كل مميزات Starter" />
                    <FeatureRow t={t} text={brandCountBullet(def.brandLimit)} />
                  </>
                )}
                {p.key === "agency" && (
                  <>
                    <FeatureRow t={t} text="كل مميزات Pro" />
                    <FeatureRow t={t} text={brandCountBullet(def.brandLimit)} />
                  </>
                )}
              </div>

              {p.key === "starter" && (
                <div style={styles.notIncludedBox}>
                  <div style={styles.notIncludedHeader}>{t("غير متاح في Starter:")}</div>
                  <div style={styles.notIncludedRow}>— {t("مشاركة وموافقة العميل")}</div>
                  <div style={styles.notIncludedRow}>— {t("التقارير والهوية White-label")}</div>
                </div>
              )}

              {p.key === "pro" && (
                <>
                  <div style={styles.highlightBox}>
                    {PRO_HIGHLIGHTS.map((h) => (
                      <div key={h.title} style={styles.highlightItem}>
                        <div style={styles.highlightTitle}>{h.title}</div>
                        <div style={styles.highlightDesc}>{t(h.desc)}</div>
                      </div>
                    ))}
                  </div>
                  <p style={styles.valueLine}>{t("كل اللي تحتاجه عشان تشتغل مع عملاء بشكل احترافي.")}</p>
                </>
              )}

              {p.key === "agency" && (
                <p style={styles.calloutLine}>{t("بدون حد لعدد البراندات")}</p>
              )}

              <a href="/signup" style={p.recommended ? styles.ctaPrimary : styles.ctaSecondary}>{t("ابدأ مجانًا")}</a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0 },
  sub: { fontSize: 14, color: landing.textDim, margin: "10px 0 0" },
  trialNote: { fontSize: 12.5, color: landing.textDim, margin: "10px 0 0", fontWeight: 700 },

  coreBand: {
    background: landing.surfaceAlt, border: `1px solid ${landing.border}`, borderRadius: 14,
    padding: "16px 20px", marginBottom: 28, textAlign: "center",
  },
  coreBandTitle: { fontSize: 12.5, fontWeight: 800, color: landing.textDim, marginBottom: 12, letterSpacing: 0.2 },
  coreBandRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 22px" },
  coreItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: landing.text },

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
  planName: { fontSize: 17, fontWeight: 800, color: landing.text, marginTop: 8 },
  planSubtitle: { fontSize: 12, color: landing.textDim, lineHeight: 1.5, minHeight: 32 },
  priceRow: { marginTop: 12 },
  price: { fontSize: 23, fontWeight: 800, color: landing.text },
  annual: { fontSize: 11.5, color: landing.textFaint },

  includedList: { display: "flex", flexDirection: "column", gap: 10, textAlign: "start", margin: "16px 0 0" },
  featureRow: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, fontWeight: 600, color: landing.text },
  featureSub: { fontSize: 11, fontWeight: 500, color: landing.textFaint, marginTop: 1 },

  notIncludedBox: { textAlign: "start", margin: "14px 0 0", paddingTop: 12, borderTop: `1px dashed ${landing.border}` },
  notIncludedHeader: { fontSize: 11.5, fontWeight: 700, color: landing.textFaint, marginBottom: 6 },
  notIncludedRow: { fontSize: 12, color: landing.textFaint, lineHeight: 1.8 },

  highlightBox: {
    textAlign: "start", margin: "16px 0 0", padding: "14px 14px", borderRadius: 12,
    background: landing.gradientSoft, display: "flex", flexDirection: "column", gap: 12,
  },
  highlightItem: {},
  highlightTitle: { fontSize: 12.5, fontWeight: 800, color: landing.text },
  highlightDesc: { fontSize: 11.5, color: landing.textDim, lineHeight: 1.6, marginTop: 2 },

  valueLine: { fontSize: 12.5, fontWeight: 700, color: landing.text, lineHeight: 1.6, margin: "14px 0 0" },
  calloutLine: {
    fontSize: 12.5, fontWeight: 700, color: landing.text, lineHeight: 1.6, margin: "16px 0 0",
    background: landing.gradientSoft, borderRadius: 10, padding: "10px 12px",
  },

  ctaPrimary: {
    marginTop: "auto", background: landing.gradient, color: "#fff", fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none",
  },
  ctaSecondary: {
    marginTop: "auto", background: landing.bg, color: landing.text, fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none", border: `1px solid ${landing.border}`,
  },
};
