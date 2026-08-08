import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const PLANS = [
  { key: "starter", name: "Starter", brands: "لحد 3 براندات", price: "199 جنيه/شهر", annual: "1,990 جنيه/سنة" },
  { key: "pro", name: "Pro", brands: "لحد 10 براندات", price: "399 جنيه/شهر", annual: "3,990 جنيه/سنة", recommended: true },
  { key: "unlimited", name: "Unlimited", brands: "براندات غير محدودة", price: "699 جنيه/شهر", annual: "6,990 جنيه/سنة" },
];

export default function Paywall({ trialEndsAt, onSignOut, onRecheck }) {
  const whatsappNumber = "201148769364";
  const paymentNumber = "01273122625";
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemOk, setRedeemOk] = useState(false);

  const plan = PLANS.find((p) => p.key === selectedPlan);
  const whatsappMsg = encodeURIComponent(
    `أهلاً، عايز أشترك في باقة ${plan.name} في استوديو الشغل. ده إثبات الدفع:`
  );

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(paymentNumber);
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
      setRedeemMsg(data?.message || "حصلت مشكلة، جرب تاني.");
      if (data?.ok) {
        setTimeout(() => onRecheck(), 1200);
      }
    } catch (e) {
      setRedeemOk(false);
      setRedeemMsg("حصلت مشكلة في الاتصال، جرب تاني.");
    } finally {
      setRedeemLoading(false);
    }
  }

  return (
    <div dir="rtl" style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.logoDot} />
        <h1 style={styles.title}>خلصت فترة التجربة</h1>
        <p style={styles.subtitle}>
          {trialEndsAt
            ? `فترة التجربة المجانية انتهت بتاريخ ${new Date(trialEndsAt).toLocaleDateString("ar-EG")}.`
            : "فترة التجربة المجانية انتهت."}
          {" "}اختار باقة عشان تكمّل تستخدم استوديو الشغل.
        </p>

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
              {p.recommended && <div style={styles.recommendedBadge}>الأكتر اختيارًا</div>}
              <div style={styles.planName}>{p.name}</div>
              <div style={styles.planBrands}>{p.brands}</div>
              <div style={styles.planPrice}>{p.price}</div>
              <div style={styles.planAnnual}>أو {p.annual} (وفّر شهرين)</div>
            </button>
          ))}
        </div>
        <p style={styles.planNote}>كل الباقات فيها كل ميزات الأداة بدون استثناء — الفرق بس في عدد البراندات.</p>

        <div style={styles.paySection}>
          <div style={styles.payLabel}>للدفع من مصر (فودافون كاش / InstaPay):</div>
          <div style={styles.payRow}>
            <div style={styles.payValue}>{paymentNumber}</div>
            <button onClick={copyNumber} style={styles.copyBtn}>{copied ? "اتنسخ" : "نسخ"}</button>
          </div>
        </div>
        <div style={styles.paySection}>
          <div style={styles.payLabel}>للدفع من بره مصر:</div>
          <div style={styles.payValue}>غيّر ده للينك دفع دولي بتاعك (مثلاً Payoneer أو رابط Stripe)</div>
        </div>

        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.whatsappBtn}
        >
          ابعت إثبات الدفع على واتساب (باقة {plan.name})
        </a>

        <p style={styles.hint}>بعد ما تبعت الإثبات، بنفعّل حسابك خلال يوم عمل. تقدر تدوس الزرار تحت للتأكد بعد التفعيل.</p>

        <div style={styles.divider} />

        <div style={styles.redeemLabel}>عندك كود تفعيل أو خصم؟</div>
        <div style={styles.redeemRow}>
          <input
            style={styles.redeemInput}
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
            placeholder="اكتب الكود هنا"
          />
          <button onClick={handleRedeem} disabled={redeemLoading || !redeemCode.trim()} style={styles.redeemBtn}>
            {redeemLoading ? "بيتحقق..." : "فعّل"}
          </button>
        </div>
        {redeemMsg && <p style={{ ...styles.redeemMsg, color: redeemOk ? "#4FB286" : "#F0997B" }}>{redeemMsg}</p>}

        <div style={styles.footerRow}>
          <button onClick={onRecheck} style={styles.secondaryBtn}>اتفعّل حسابي، جرب تاني</button>
          <button onClick={onSignOut} style={styles.linkBtn}>تسجيل خروج</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", padding: 20 },
  card: { width: "100%", maxWidth: 480, background: "#161E23", border: "1px solid #2C383F", borderRadius: 16, padding: 28 },
  logoDot: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#E7A33E,#C97B5F)", marginBottom: 8 },
  title: { color: "#F2EEE4", fontSize: 20, fontWeight: 800, margin: 0 },
  subtitle: { color: "#8FA0A8", fontSize: 13, lineHeight: 1.8, margin: "6px 0 18px" },

  plansGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 8 },
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
  planNote: { color: "#657078", fontSize: 11, lineHeight: 1.6, margin: "0 0 16px", textAlign: "center" },

  paySection: { marginBottom: 10 },
  payLabel: { color: "#8FA0A8", fontSize: 11.5, fontWeight: 700 },
  payValue: { color: "#F2EEE4", fontSize: 13, marginTop: 2 },
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
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  secondaryBtn: { background: "transparent", border: "1px solid #2C383F", color: "#C7CDD1", padding: "9px 14px", borderRadius: 9, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" },
  linkBtn: { background: "transparent", border: "none", color: "#657078", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
};
