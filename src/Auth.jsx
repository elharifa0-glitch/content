import React, { useState } from "react";
import { Globe } from "lucide-react";
import { supabase } from "./supabaseClient";
import { Logo } from "./components";
import { useLanguage } from "./LanguageContext";

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.topRow}>
          <Logo height={26} variant="light" />
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
          <>
            <label style={styles.label}>{t("اسم المستخدم")}</label>
            <input
              style={styles.input}
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("اسم مستخدم فريد (حروف إنجليزي وأرقام و_)")}
              autoComplete="username"
              dir="ltr"
            />
          </>
        )}

        <label style={styles.label}>{t("الإيميل")}</label>
        <input
          style={styles.input}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        {mode !== "forgot" && (
          <>
            <label style={styles.label}>{t("الباسورد")}</label>
            <input
              style={styles.input}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("على الأقل 6 حروف/أرقام")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </>
        )}

        {mode === "signup" && (
          <>
            <label style={styles.label}>{t("تأكيد الباسورد")}</label>
            <input
              style={styles.input}
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("اكتب الباسورد تاني")}
              autoComplete="new-password"
            />
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading
            ? t("بيحمّل...")
            : mode === "login"
            ? t("سجّل دخول")
            : mode === "signup"
            ? t("اعمل حساب")
            : t("ابعت رابط تغيير الباسورد")}
        </button>

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
    background: "#11171B",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#161E23",
    border: "1px solid #2C383F",
    borderRadius: 16,
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
    background: "#1B2328",
    border: "1px solid #2C383F",
    color: "#C7CDD1",
    fontSize: 11.5,
    fontWeight: 800,
    borderRadius: 999,
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  title: {
    color: "#F2EEE4",
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    color: "#8FA0A8",
    fontSize: 13,
    margin: "4px 0 18px",
  },
  label: {
    fontSize: 12,
    color: "#8FA0A8",
    fontWeight: 600,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: "100%",
    background: "#1B2328",
    border: "1px solid #2C383F",
    borderRadius: 9,
    color: "#F2EEE4",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  error: {
    fontSize: 12.5,
    color: "#F0997B",
    margin: "10px 0 0",
  },
  message: {
    fontSize: 12.5,
    color: "#4FB286",
    margin: "10px 0 0",
    lineHeight: 1.6,
  },
  submitBtn: {
    marginTop: 18,
    background: "#E7A33E",
    border: "none",
    color: "#161E23",
    padding: "11px",
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  forgotBtn: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: "#E7A33E",
    fontSize: 12.5,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  switchBtn: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: "#8FA0A8",
    fontSize: 12.5,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
  },
};
