import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { Button } from "./components";
import { colors, radius } from "./theme";

export default function AccountConfirmed({ onContinue }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  return (
    <div dir={dir} style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
        <div style={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.title}>{t("تم تفعيل حسابك بنجاح!")}</h1>
        <p style={styles.subtitle}>
          {t("الإيميل بتاعك اتأكد وحسابك بقى جاهز. تقدر دلوقتي تبدأ تستخدم ContentST — معاك تجربة مجانية 7 أيام بكل الميزات، لحد 2 براند.")}
        </p>
        <Button variant="primary" fullWidth onClick={onContinue}>{t("يلا نبدأ")}</Button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, padding: 20 },
  card: { width: "100%", maxWidth: 380, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 28, textAlign: "center" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
  langBtn: { display: "flex", alignItems: "center", gap: 5, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" },
  iconWrap: {
    width: 56, height: 56, borderRadius: "50%", background: colors.good, display: "flex",
    alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  title: { color: colors.text, fontSize: 19, fontWeight: 800, margin: 0 },
  subtitle: { color: colors.textDim, fontSize: 13, lineHeight: 1.8, margin: "10px 0 22px" },
};
