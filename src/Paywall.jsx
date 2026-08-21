import React from "react";
import { Globe } from "lucide-react";
import PlanPicker from "./PlanPicker";
import { Logo } from "./components";
import { useLanguage } from "./LanguageContext";

export default function Paywall({ trialEndsAt, onSignOut, onRecheck }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  return (
    <div dir={dir} style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <Logo height={24} variant="light" />
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
        <h1 style={styles.title}>{t("خلصت فترة التجربة")}</h1>
        <p style={styles.subtitle}>
          {trialEndsAt
            ? `${t("فترة التجربة المجانية انتهت بتاريخ")} ${new Date(trialEndsAt).toLocaleDateString("ar-EG-u-nu-latn")}.`
            : t("فترة التجربة المجانية انتهت.")}
          {" "}{t("اختار باقة عشان تكمّل تستخدم ContentST.")}
        </p>

        <PlanPicker onRecheck={onRecheck} />

        <div style={styles.footerRow}>
          <button onClick={onRecheck} style={styles.secondaryBtn}>{t("اتفعّل حسابي، جرب تاني")}</button>
          <button onClick={onSignOut} style={styles.linkBtn}>{t("تسجيل خروج")}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", padding: 20 },
  card: { width: "100%", maxWidth: 480, background: "#161E23", border: "1px solid #2C383F", borderRadius: 16, padding: 28 },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  langBtn: { display: "flex", alignItems: "center", gap: 5, background: "#1B2328", border: "1px solid #2C383F", color: "#C7CDD1", fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" },
  title: { color: "#F2EEE4", fontSize: 20, fontWeight: 800, margin: 0 },
  subtitle: { color: "#8FA0A8", fontSize: 13, lineHeight: 1.8, margin: "6px 0 18px" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  secondaryBtn: { background: "transparent", border: "1px solid #2C383F", color: "#C7CDD1", padding: "9px 14px", borderRadius: 9, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" },
  linkBtn: { background: "transparent", border: "none", color: "#657078", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
};
