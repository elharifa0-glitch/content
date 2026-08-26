import React from "react";
import { Globe } from "lucide-react";
import PlanPicker from "./PlanPicker";
import { Logo } from "./components";
import { useLanguage } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import { colors, radius } from "./theme";

export default function Paywall({ trialEndsAt, onSignOut, onRecheck }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  const { mode: themeMode } = useTheme();
  return (
    <div dir={dir} style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <Logo height={24} variant={themeMode === "light" ? "dark" : "light"} />
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
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, padding: 20 },
  card: { width: "100%", maxWidth: 480, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 28 },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  langBtn: { display: "flex", alignItems: "center", gap: 5, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" },
  title: { color: colors.text, fontSize: 20, fontWeight: 800, margin: 0 },
  subtitle: { color: colors.textDim, fontSize: 13, lineHeight: 1.8, margin: "6px 0 18px" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  secondaryBtn: { background: "transparent", border: `1px solid ${colors.border}`, color: colors.textDim, padding: "9px 14px", borderRadius: radius.sm, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" },
  linkBtn: { background: "transparent", border: "none", color: colors.textFaint, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
};
