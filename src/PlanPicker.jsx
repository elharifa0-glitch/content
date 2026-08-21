import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Check } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export const PLANS = [
  { key: "starter", name: "Starter", brands: "لحد 2 براند", price: "199 جنيه/شهر", annual: "1,990 جنيه/سنة" },
  { key: "pro", name: "Pro", brands: "لحد 5 براندات", price: "399 جنيه/شهر", annual: "3,990 جنيه/سنة", recommended: true },
  { key: "unlimited", name: "Unlimited", brands: "براندات غير محدودة", price: "699 جنيه/شهر", annual: "6,990 جنيه/سنة" },
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
              <Check size={13} style={{ color: "#4FB286", flexShrink: 0 }} />
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
        <div style={{ ...styles.payValue, color: "#8FA0A8", display: "flex", alignItems: "center", gap: 6 }}>
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
      {redeemMsg && <p style={{ ...styles.redeemMsg, color: redeemOk ? "#4FB286" : "#F0997B" }}>{redeemMsg}</p>}
    </div>
  );
}

const styles = {
  plansGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 14 },
  planCard: {
    position: "relative", background: "#1B2328", border: "1.5px solid #222C31", borderRadius: 12,
    padding: "14px 8px", cursor: "pointer", fontFamily: "inherit", textAlign: "center",
    display: "flex", flexDirection: "column", gap: 3, minWidth: 0,
  },
  planCardActive: { borderColor: "#E7A33E", background: "#E7A33E14" },
  recommendedBadge: {
    position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)",
    background: "#E7A33E", color: "#161E23", fontSize: 8.5, fontWeight: 800,
    padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap",
  },
  planName: { color: "#F2EEE4", fontSize: 13, fontWeight: 800, marginTop: 4 },
  planBrands: { color: "#8FA0A8", fontSize: 9.5, lineHeight: 1.4 },
  planPrice: { color: "#E7A33E", fontSize: 13, fontWeight: 800, marginTop: 4 },
  planAnnual: { color: "#657078", fontSize: 8.5, lineHeight: 1.4 },

  featuresBox: { background: "#1B2328", border: "1px solid #222C31", borderRadius: 12, padding: 14, marginBottom: 16 },
  featuresTitle: { color: "#8FA0A8", fontSize: 11.5, fontWeight: 700, marginBottom: 10, lineHeight: 1.6 },
  featuresGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  featureRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#D8D3C6" },

  paySection: { marginBottom: 10 },
  payLabel: { color: "#8FA0A8", fontSize: 11.5, fontWeight: 700 },
  payValue: { color: "#F2EEE4", fontSize: 13, marginTop: 2 },
  comingSoonDot: { width: 6, height: 6, borderRadius: "50%", background: "#E7A33E", flexShrink: 0 },
  payRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  copyBtn: { background: "#1B2328", border: "1px solid #2C383F", color: "#C7CDD1", padding: "4px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit" },
  whatsappBtn: {
    display: "block", textAlign: "center", marginTop: 14, background: "#4FB286", color: "#0C1210",
    padding: "12px", borderRadius: 10, fontSize: 13.5, fontWeight: 800, textDecoration: "none",
  },
  hint: { fontSize: 11.5, color: "#657078", lineHeight: 1.7, margin: "12px 0 0" },
  divider: { height: 1, background: "#222C31", margin: "18px 0 14px" },
  redeemLabel: { color: "#8FA0A8", fontSize: 12, fontWeight: 700, marginBottom: 8 },
  redeemRow: { display: "flex", gap: 8 },
  redeemInput: { flex: 1, background: "#1B2328", border: "1px solid #2C383F", borderRadius: 9, color: "#F2EEE4", padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" },
  redeemBtn: { background: "#E7A33E", border: "none", color: "#161E23", padding: "0 16px", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  redeemMsg: { fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" },
};
