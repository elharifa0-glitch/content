import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("اتسجل حسابك. لو الإيميل محتاج تأكيد هتلاقي رسالة في بريدك — افتحها وبعدين رجع سجّل دخول.");
      }
    } catch (err) {
      setError(err.message || "حصلت مشكلة، جرب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
      `}</style>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logoDot} />
        <h1 style={styles.title}>استوديو الشغل</h1>
        <p style={styles.subtitle}>{mode === "login" ? "سجّل دخول عشان تكمّل شغلك" : "اعمل حساب جديد"}</p>

        <label style={styles.label}>الإيميل</label>
        <input
          style={styles.input}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label style={styles.label}>الباسورد</label>
        <input
          style={styles.input}
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="على الأقل 6 حروف/أرقام"
        />

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? "بيحمّل..." : mode === "login" ? "سجّل دخول" : "اعمل حساب"}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
          style={styles.switchBtn}
        >
          {mode === "login" ? "لسه معملتش حساب؟ اعمل واحد" : "عندك حساب بالفعل؟ سجّل دخول"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", padding: 20 },
  card: { width: "100%", maxWidth: 380, background: "#161E23", border: "1px solid #2C383F", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 4 },
  logoDot: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#E7A33E,#C97B5F)", marginBottom: 8 },
  title: { color: "#F2EEE4", fontSize: 20, fontWeight: 800, margin: 0 },
  subtitle: { color: "#8FA0A8", fontSize: 13, margin: "4px 0 18px" },
  label: { fontSize: 12, color: "#8FA0A8", fontWeight: 600, marginBottom: 6, marginTop: 10 },
  input: { width: "100%", background: "#1B2328", border: "1px solid #2C383F", borderRadius: 9, color: "#F2EEE4", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" },
  error: { fontSize: 12.5, color: "#F0997B", margin: "10px 0 0" },
  message: { fontSize: 12.5, color: "#4FB286", margin: "10px 0 0", lineHeight: 1.6 },
  submitBtn: { marginTop: 18, background: "#E7A33E", border: "none", color: "#161E23", padding: "11px", borderRadius: 9, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  switchBtn: { marginTop: 12, background: "transparent", border: "none", color: "#8FA0A8", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
};
