import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Check } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { colors, radius, softBg } from "./theme";

export const PLANS = [
  { key: "starter", name: "Starter", brands: "لحد 2 براند", price: "199 جنيه/شهر", annual: "1,990 جنيه/سنة" },
  { key: "pro", name: "Pro", brands: "لحد 5 براندات", price: "399 جنيه/شهر", annual: "3,990 جنيه/سنة", recommended: true },
  { key: "unlimited", name: "Unlimited", brands: "براندات غير محدودة", price: "1200 جنيه/شهر", annual: "12,000 جنيه/سنة" },
];

export const INCLUDED_FEATURES = [
  "لوحة أفكار وتقويم نشر لكل براند",
  "تتبع مدفوعات ومصاريف وربح صافي حقيقي",
  "تحليل وتقارير كاملة لكل براند",
  "تذكيرات ديدلاين وإشعارات متصفح",
  "بحث ومقارنة عبر كل البراندات",
  "تعمل من أي جهاز أو موبايل",
];

const WHATSAPP_NUMBER = "201148769364";
const PAYMENT_NUMBER = "01273122625";

// مكوّن مشترك لاختيار/تغيير باقة، مستخدم في شاشة الاشتراك (Paywall) وفي صفحة "الاشتراك" جوا الحساب.
export default function PlanPicker({ onRecheck, defaultPlan = "pro" }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemOk, setRedeemOk] = useState(false);

  const plan = PLANS.find((p) => p.key === selectedPlan) || PLANS.find((p) => p.recommended) || PLANS[0];
  const whatsappMsg = encodeURIComponent(
    `${t("أهلاً، عايز أشترك في باقة")} ${plan.name} ${t("في ContentST. ده إثبات الدفع:")}`
  );

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  }

  async function handleRedeem() {
    const code = redeemCode.trim();
    if (!code) return;
    setRedeemLoading(true);
    setRedeemMsg("");
    try {
      const { data, error } = await supabase.rpc("redeem_subscription_code", { p_code: code });
      if (error) throw error;
      setRedeemOk(!!data?.ok);
      setRedeemMsg(data?.message || t("حصلت مشكلة، جرب تاني."));
      if (data?.ok && onRecheck) {
        setTimeout(() => onRecheck(), 1200);
      }
    } catch (e) {
      setRedeemOk(false);
      setRedeemMsg(t("حصلت مشكلة في الاتصال، جرب تاني."));
    } finally {
      setRedeemLoading(false);
    }
  }

  return (
    <div>
      <div style={styles.plansGrid}>
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelectedPlan(p.key)}
            style={{
              ...styles.planCard,
              ...(selectedPlan === p.key ? styles.planCardActive : {}),
            }}
          >
            {p.recommended && <div style={styles.recommendedBadge}>{t("الأكتر اختيارًا")}</div>}
            <div style={styles.planName}>{p.name}</div>
            <div style={styles.planBrands}>{t(p.brands)}</div>
            <div style={styles.planPrice}>{t(p.price)}</div>
            <div style={styles.planAnnual}>{t("أو")} {t(p.annual)} {t("(وفّر شهرين)")}</div>
          </button>
        ))}
      </div>

      <div style={styles.featuresBox}>
        <div style={styles.featuresTitle}>{t("كل الباقات بتديك بالظبط نفس الميزات — الفرق بس في عدد البراندات:")}</div>
        <div style={styles.featuresGrid}>
          {INCLUDED_FEATURES.map((f) => (
            <div key={f} style={styles.featureRow}>
              <Check size={13} style={{ color: colors.good, flexShrink: 0 }} />
              <span>{t(f)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.paySection}>
        <div style={styles.payLabel}>{t("للدفع من مصر (فودافون كاش / InstaPay):")}</div>
        <div style={styles.payRow}>
          <div style={styles.payValue}>{PAYMENT_NUMBER}</div>
          <button onClick={copyNumber} style={styles.copyBtn}>{copied ? t("اتنسخ") : t("نسخ")}</button>
        </div>
      </div>
      <div style={styles.paySection}>
        <div style={styles.payLabel}>{t("للدفع من بره مصر:")}</div>
        <div style={{ ...styles.payValue, color: colors.textDim, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={styles.comingSoonDot} />
          {t("الدفع الدولي تحت الإنشاء حاليًا — قريبًا")}
        </div>
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.whatsappBtn}
      >
        {t("ابعت إثبات الدفع على واتساب (باقة")} {plan.name})
      </a>

      <p style={styles.hint}>{t("بعد ما تبعت الإثبات، بنفعّل الترقية خلال يوم عمل.")}</p>

      <div style={styles.divider} />

      <div style={styles.redeemLabel}>{t("عندك كود تفعيل أو خصم؟")}</div>
      <div style={styles.redeemRow}>
        <input
          style={styles.redeemInput}
          value={redeemCode}
          onChange={(e) => setRedeemCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
          placeholder={t("اكتب الكود هنا")}
        />
        <button onClick={handleRedeem} disabled={redeemLoading || !redeemCode.trim()} style={styles.redeemBtn}>
          {redeemLoading ? t("بيتحقق...") : t("فعّل")}
        </button>
      </div>
      {redeemMsg && <p style={{ ...styles.redeemMsg, color: redeemOk ? colors.good : colors.danger }}>{redeemMsg}</p>}
    </div>
  );
}

const styles = {
  plansGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 14 },
  planCard: {
    position: "relative", background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: radius.md,
    padding: "14px 8px", cursor: "pointer", fontFamily: "inherit", textAlign: "center",
    display: "flex", flexDirection: "column", gap: 3, minWidth: 0,
  },
  planCardActive: { borderColor: colors.accentBlue, background: softBg.accentBlue },
  recommendedBadge: {
    position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)",
    background: colors.accentGradient, color: colors.onAccent, fontSize: 8.5, fontWeight: 800,
    padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap",
  },
  planName: { color: colors.text, fontSize: 13, fontWeight: 800, marginTop: 4 },
  planBrands: { color: colors.textDim, fontSize: 9.5, lineHeight: 1.4 },
  planPrice: { color: colors.accentBlue, fontSize: 13, fontWeight: 800, marginTop: 4 },
  planAnnual: { color: colors.textFaint, fontSize: 8.5, lineHeight: 1.4 },

  featuresBox: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 14, marginBottom: 16 },
  featuresTitle: { color: colors.textDim, fontSize: 11.5, fontWeight: 700, marginBottom: 10, lineHeight: 1.6 },
  featuresGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  featureRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: colors.text },

  paySection: { marginBottom: 10 },
  payLabel: { color: colors.textDim, fontSize: 11.5, fontWeight: 700 },
  payValue: { color: colors.text, fontSize: 13, marginTop: 2 },
  comingSoonDot: { width: 6, height: 6, borderRadius: "50%", background: colors.accentBlue, flexShrink: 0 },
  payRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  copyBtn: { background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textDim, padding: "4px 10px", borderRadius: radius.sm, fontSize: 11, cursor: "pointer", fontFamily: "inherit" },
  whatsappBtn: {
    display: "block", textAlign: "center", marginTop: 14, background: colors.good, color: colors.onAccent,
    padding: "12px", borderRadius: radius.md, fontSize: 13.5, fontWeight: 800, textDecoration: "none",
  },
  hint: { fontSize: 11.5, color: colors.textFaint, lineHeight: 1.7, margin: "12px 0 0" },
  divider: { height: 1, background: colors.border, margin: "18px 0 14px" },
  redeemLabel: { color: colors.textDim, fontSize: 12, fontWeight: 700, marginBottom: 8 },
  redeemRow: { display: "flex", gap: 8 },
  redeemInput: { flex: 1, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.text, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" },
  redeemBtn: { background: colors.accentGradient, border: "none", color: colors.onAccent, padding: "0 16px", borderRadius: radius.sm, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  redeemMsg: { fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" },
};
