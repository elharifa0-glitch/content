import React from "react";
import PlanPicker from "./PlanPicker";

export default function Paywall({ trialEndsAt, onSignOut, onRecheck }) {
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

        <PlanPicker onRecheck={onRecheck} />

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
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  secondaryBtn: { background: "transparent", border: "1px solid #2C383F", color: "#C7CDD1", padding: "9px 14px", borderRadius: 9, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" },
  linkBtn: { background: "transparent", border: "none", color: "#657078", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
};
