import React from "react";
import { Check } from "lucide-react";
import { PLANS, INCLUDED_FEATURES } from "../../PlanPicker";
import { landing } from "./tokens";

export default function PricingSection() {
  return (
    <section id="pricing" style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>باقات بسيطة، بدون مفاجآت.</h2>
        <p style={styles.sub}>كل الباقات فيها نفس الميزات بالظبط — الفرق بس في عدد البراندات.</p>
      </div>

      <div style={styles.cardsRow} className="landing-pricing-grid">
        {PLANS.map((p) => (
          <div key={p.key} style={{ ...styles.card, ...(p.recommended ? styles.cardRecommended : {}) }}>
            {p.recommended && <div style={styles.badge}>الأكتر اختيارًا</div>}
            <div style={styles.planName}>{p.name}</div>
            <div style={styles.planBrands}>{p.brands}</div>
            <div style={styles.priceRow}>
              <span style={styles.price}>{p.price}</span>
            </div>
            <div style={styles.annual}>أو {p.annual} (وفّر شهرين)</div>
            <a href="/signup" style={p.recommended ? styles.ctaPrimary : styles.ctaSecondary}>ابدأ مجانًا</a>
          </div>
        ))}
      </div>

      <div style={styles.featuresBox}>
        <div style={styles.featuresGrid} className="landing-features-grid">
          {INCLUDED_FEATURES.map((f) => (
            <div key={f} style={styles.featureRow}>
              <Check size={14} color={landing.good} style={{ flexShrink: 0 }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0 },
  sub: { fontSize: 14, color: landing.textDim, margin: "10px 0 0" },
  cardsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 },
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
  ctaPrimary: {
    marginTop: 16, background: landing.gradient, color: "#fff", fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none",
  },
  ctaSecondary: {
    marginTop: 16, background: landing.bg, color: landing.text, fontSize: 13.5, fontWeight: 800,
    padding: "11px", borderRadius: 10, textDecoration: "none", border: `1px solid ${landing.border}`,
  },
  featuresBox: { background: landing.surface, border: `1px solid ${landing.border}`, borderRadius: 16, padding: 24 },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px 20px" },
  featureRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: landing.text },
};
