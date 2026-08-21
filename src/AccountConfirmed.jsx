import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function AccountConfirmed({ onContinue }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  return (
    <div dir={dir} style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
        <div style={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#161E23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.title}>{t("تم تفعيل حسابك بنجاح!")}</h1>
        <p style={styles.subtitle}>
          {t("الإيميل بتاعك اتأكد وحسابك بقى جاهز. تقدر دلوقتي تبدأ تستخدم ContentST — معاك تجربة مجانية 7 أيام.")}
        </p>
        <button onClick={onContinue} style={styles.continueBtn}>{t("يلا نبدأ")}</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", padding: 20 },
  card: { width: "100%", maxWidth: 380, background: "#161E23", border: "1px solid #2C383F", borderRadius: 16, padding: 28, textAlign: "center" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
  langBtn: { display: "flex", alignItems: "center", gap: 5, background: "#1B2328", border: "1px solid #2C383F", color: "#C7CDD1", fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" },
  iconWrap: {
    width: 56, height: 56, borderRadius: "50%", background: "#4FB286", display: "flex",
    alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  title: { color: "#F2EEE4", fontSize: 19, fontWeight: 800, margin: 0 },
  subtitle: { color: "#8FA0A8", fontSize: 13, lineHeight: 1.8, margin: "10px 0 22px" },
  continueBtn: { width: "100%", background: "#E7A33E", border: "none", color: "#161E23", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
};
