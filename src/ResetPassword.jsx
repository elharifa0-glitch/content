import React, { useState } from "react";
import { Globe } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext";
import { Button, Input } from "./components";
import { colors, radius, spacing } from "./theme";

export default function ResetPassword({ onDone }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError(t("كلمة المرور لازم تكون 6 أحرف على الأقل."));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين."));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(t("تم تغيير كلمة المرور بنجاح."));

    setTimeout(() => {
      window.history.replaceState({}, "", "/");
      onDone?.();
    }, 1200);
  }

  return (
    <div dir={dir} style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.topRow}>
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>

        <h1 style={styles.title}>{t("تغيير كلمة المرور")}</h1>
        <p style={styles.subtitle}>{t("اكتب كلمة المرور الجديدة لحسابك.")}</p>

        <div style={styles.field}>
          <Input
            type="password"
            label={t("كلمة المرور الجديدة")}
            placeholder={t("كلمة المرور الجديدة")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div style={styles.field}>
          <Input
            type="password"
            label={t("تأكيد كلمة المرور")}
            placeholder={t("تأكيد كلمة المرور")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: spacing.lg }}>
          {loading ? t("جاري تغيير كلمة المرور...") : t("تغيير كلمة المرور")}
        </Button>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: colors.bg, padding: 20,
  },
  card: {
    width: "100%", maxWidth: 420, background: colors.card,
    border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 28,
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
  langBtn: {
    display: "flex", alignItems: "center", gap: 5,
    background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textDim,
    fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "5px 10px",
    cursor: "pointer", fontFamily: "inherit",
  },
  title: { color: colors.text, fontSize: 20, fontWeight: 800, margin: 0 },
  subtitle: { color: colors.textDim, fontSize: 13, margin: "4px 0 18px" },
  field: { marginTop: 10 },
  error: { fontSize: 12.5, color: colors.danger, margin: "10px 0 0" },
  message: { fontSize: 12.5, color: colors.good, margin: "10px 0 0", lineHeight: 1.6 },
};
