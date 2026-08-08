import React from "react";

export default function AccountConfirmed({ onContinue }) {
  return (
    <div dir="rtl" style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#161E23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.title}>تم تفعيل حسابك بنجاح!</h1>
        <p style={styles.subtitle}>
          الإيميل بتاعك اتأكد وحسابك بقى جاهز. تقدر دلوقتي تبدأ تستخدم استوديو الشغل — معاك تجربة مجانية 14 يوم.
        </p>
        <button onClick={onContinue} style={styles.continueBtn}>يلا نبدأ</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", padding: 20 },
  card: { width: "100%", maxWidth: 380, background: "#161E23", border: "1px solid #2C383F", borderRadius: 16, padding: 28, textAlign: "center" },
  iconWrap: {
    width: 56, height: 56, borderRadius: "50%", background: "#4FB286", display: "flex",
    alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  title: { color: "#F2EEE4", fontSize: 19, fontWeight: 800, margin: 0 },
  subtitle: { color: "#8FA0A8", fontSize: 13, lineHeight: 1.8, margin: "10px 0 22px" },
  continueBtn: { width: "100%", background: "#E7A33E", border: "none", color: "#161E23", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
};
