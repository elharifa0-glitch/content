import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function ResetPassword({ onDone }) {
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
      setError("كلمة المرور لازم تكون 6 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("تم تغيير كلمة المرور بنجاح.");

    setTimeout(() => {
      window.history.replaceState({}, "", "/");
      onDone?.();
    }, 1200);
  }

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#11171B", color: "#fff",
      fontFamily: "sans-serif", padding: 20
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 420, background: "#182126",
        padding: 28, borderRadius: 16, boxSizing: "border-box"
      }}>
        <h1 style={{ marginTop: 0 }}>تغيير كلمة المرور</h1>
        <p style={{ color: "#8FA0A8" }}>اكتب كلمة المرور الجديدة لحسابك.</p>

        <input
          type="password"
          placeholder="كلمة المرور الجديدة"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          style={{
            width: "100%", boxSizing: "border-box", padding: 14,
            marginBottom: 12, borderRadius: 10, border: "1px solid #35434B",
            background: "#11171B", color: "#fff"
          }}
        />

        <input
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          style={{
            width: "100%", boxSizing: "border-box", padding: 14,
            marginBottom: 16, borderRadius: 10, border: "1px solid #35434B",
            background: "#11171B", color: "#fff"
          }}
        />

        <button type="submit" disabled={loading} style={{
          display: "block", width: "100%", padding: "14px 18px",
          border: 0, borderRadius: 10, background: "#fff",
          color: "#11171B", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer"
        }}>
          {loading ? "جاري تغيير كلمة المرور..." : "تغيير كلمة المرور"}
        </button>

        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
        {message && <p style={{ color: "#6ee7b7" }}>{message}</p>}
      </form>
    </div>
  );
}
