import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Logo } from "./components";

// حروف إنجليزي صغيرة/أرقام/_ بس، من 3 لـ 30 حرف — بيتطبّع lowercase قبل
// الفحص عشان "Ahmed" و"ahmed" يتحسبوا نفس اسم المستخدم.
function normalizeUsername(raw) {
  return (raw || "").trim().toLowerCase();
}
function isValidUsername(u) {
  return /^[a-z0-9_]{3,30}$/.test(u);
}

export default function Auth({ initialMode = "login" }) {
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
        setError("اسم المستخدم لازم يكون من 3 لـ 30 حرف، وحروف إنجليزي صغيرة أو أرقام أو _ بس (من غير مسافات).");
        return;
      }
      if (password !== confirmPassword) {
        setError("كلمة المرور وتأكيدها مش متطابقين.");
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

        setMessage("تم إرسال رابط تغيير كلمة المرور على الإيميل. افتح أحدث رسالة واضغط على الرابط.");
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
          "اتسجل حسابك. لو الإيميل محتاج تأكيد هتلاقي رسالة في بريدك — افتحها وبعدين رجع سجّل دخول."
        );
      }
    } catch (err) {
      setError(err.message || "حصلت مشكلة، جرب تاني.");
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
    <div style={styles.wrap} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>

      <form onSubmit={handleSubmit} style={styles.card}>
        <Logo height={26} variant="light" style={{ marginBottom: 14 }} />

        <h1 style={styles.title}>ContentST</h1>

        <p style={styles.subtitle}>
          {mode === "login"
            ? "سجّل دخول عشان تكمّل شغلك"
            : mode === "signup"
            ? "اعمل حساب جديد"
            : "استرجع حسابك"}
        </p>

        {mode === "signup" && (
          <>
            <label style={styles.label}>اسم المستخدم</label>
            <input
              style={styles.input}
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم مستخدم فريد (حروف إنجليزي وأرقام و_)"
              autoComplete="username"
              dir="ltr"
            />
          </>
        )}

        <label style={styles.label}>الإيميل</label>
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
            <label style={styles.label}>الباسورد</label>
            <input
              style={styles.input}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="على الأقل 6 حروف/أرقام"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </>
        )}

        {mode === "signup" && (
          <>
            <label style={styles.label}>تأكيد الباسورد</label>
            <input
              style={styles.input}
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="اكتب الباسورد تاني"
              autoComplete="new-password"
            />
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading
            ? "بيحمّل..."
            : mode === "login"
            ? "سجّل دخول"
            : mode === "signup"
            ? "اعمل حساب"
            : "ابعت رابط تغيير الباسورد"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            style={styles.forgotBtn}
          >
            نسيت كلمة المرور؟
          </button>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={styles.switchBtn}
          >
            رجوع لتسجيل الدخول
          </button>
        )}

        {mode !== "forgot" && (
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={styles.switchBtn}
          >
            {mode === "login"
              ? "لسه معملتش حساب؟ اعمل واحد"
              : "عندك حساب بالفعل؟ سجّل دخول"}
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
