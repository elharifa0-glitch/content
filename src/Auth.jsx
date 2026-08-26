import React, { useState } from "react";
import { Globe } from "lucide-react";
import { supabase } from "./supabaseClient";
import { Logo, Button, Input } from "./components";
import { useLanguage } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import { colors, radius, spacing } from "./theme";

// حروف إنجليزي صغيرة/أرقام/_ بس، من 3 لـ 30 حرف — بيتطبّع lowercase قبل
// الفحص عشان "Ahmed" و"ahmed" يتحسبوا نفس اسم المستخدم.
function normalizeUsername(raw) {
  return (raw || "").trim().toLowerCase();
}
function isValidUsername(u) {
  return /^[a-z0-9_]{3,30}$/.test(u);
}

export default function Auth({ initialMode = "login" }) {
  const { dir, lang, toggleLang, t } = useLanguage();
  const { mode: themeMode } = useTheme();
  const [mode, setMode] = useState(initialMode); // login | signup | forgot
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedUsername = normalizeUsername(username);
    if (mode === "signup") {
      if (!isValidUsername(normalizedUsername)) {
        setError(t("اسم المستخدم لازم يكون من 3 لـ 30 حرف، وحروف إنجليزي صغيرة أو أرقام أو _ بس (من غير مسافات)."));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("كلمة المرور وتأكيدها مش متطابقين."));
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (err) throw err;

        setMessage(t("تم إرسال رابط تغيير كلمة المرور على الإيميل. افتح أحدث رسالة واضغط على الرابط."));
        return;
      }

      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else {
        // اسم المستخدم بيتخزن في user_metadata بتاع Supabase Auth نفسه —
        // ده "account metadata" الموجود بالفعل، مفيش داعي لجدول أو صف جديد
        // عشانه، وهو متاح فورًا كجزء من الـ session من غير أي طلب إضافي.
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: normalizedUsername } },
        });
        if (err) throw err;

        setMessage(
          t("اتسجل حسابك. لو الإيميل محتاج تأكيد هتلاقي رسالة في بريدك — افتحها وبعدين رجع سجّل دخول.")
        );
      }
    } catch (err) {
      setError(err.message || t("حصلت مشكلة، جرب تاني."));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div style={styles.wrap} dir={dir}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.topRow}>
          <Logo height={26} variant={themeMode === "light" ? "dark" : "light"} />
          <button type="button" onClick={toggleLang} style={styles.langBtn} aria-label={t("تبديل اللغة")}>
            <Globe size={13} /> {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>

        <h1 style={styles.title}>ContentST</h1>

        <p style={styles.subtitle}>
          {mode === "login"
            ? t("سجّل دخول عشان تكمّل شغلك")
            : mode === "signup"
            ? t("اعمل حساب جديد")
            : t("استرجع حسابك")}
        </p>

        {mode === "signup" && (
          <div style={styles.field}>
            <Input
              label={t("اسم المستخدم")}
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("اسم مستخدم فريد (حروف إنجليزي وأرقام و_)")}
              autoComplete="username"
              dir="ltr"
            />
          </div>
        )}

        <div style={styles.field}>
          <Input
            label={t("الإيميل")}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {mode !== "forgot" && (
          <div style={styles.field}>
            <Input
              label={t("الباسورد")}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("على الأقل 6 حروف/أرقام")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
        )}

        {mode === "signup" && (
          <div style={styles.field}>
            <Input
              label={t("تأكيد الباسورد")}
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("اكتب الباسورد تاني")}
              autoComplete="new-password"
            />
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: spacing.lg }}>
          {loading
            ? t("بيحمّل...")
            : mode === "login"
            ? t("سجّل دخول")
            : mode === "signup"
            ? t("اعمل حساب")
            : t("ابعت رابط تغيير الباسورد")}
        </Button>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            style={styles.forgotBtn}
          >
            {t("نسيت كلمة المرور؟")}
          </button>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={styles.switchBtn}
          >
            {t("رجوع لتسجيل الدخول")}
          </button>
        )}

        {mode !== "forgot" && (
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={styles.switchBtn}
          >
            {mode === "login"
              ? t("لسه معملتش حساب؟ اعمل واحد")
              : t("عندك حساب بالفعل؟ سجّل دخول")}
          </button>
        )}
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.bg,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  langBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textDim,
    fontSize: 11.5,
    fontWeight: 800,
    borderRadius: 999,
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 13,
    margin: "4px 0 18px",
  },
  field: {
    marginTop: 10,
  },
  error: {
    fontSize: 12.5,
    color: colors.danger,
    margin: "10px 0 0",
  },
  message: {
    fontSize: 12.5,
    color: colors.good,
    margin: "10px 0 0",
    lineHeight: 1.6,
  },
  forgotBtn: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: colors.accentBlue,
    fontSize: 12.5,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  switchBtn: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: colors.textDim,
    fontSize: 12.5,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
  },
};
