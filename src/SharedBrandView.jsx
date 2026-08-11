import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const STATUS_DEFS = [
  { key: "idea", label: "فكرة جديدة", color: "#8FA0A8" },
  { key: "ready", label: "جاهزة", color: "#5FA8D3" },
  { key: "scheduled", label: "مجدولة", color: "#E7A33E" },
  { key: "done", label: "اتنشرت", color: "#4FB286" },
];

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${dt.getDate()} ${months[dt.getMonth()]}`;
}

export default function SharedBrandView({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase.rpc("get_shared_brand", { p_token: token });
        if (err) throw err;
        if (!data?.ok) {
          setError(data?.message || "اللينك ده مش شغال.");
        } else {
          setBrand(data.brand);
          setItems(data.items || []);
        }
      } catch (e) {
        setError("حصلت مشكلة في تحميل الصفحة، جرب تاني.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div style={styles.wrap} dir="rtl">
        <style>{importFont}</style>
        <p style={styles.loadingText}>بيحمّل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrap} dir="rtl">
        <style>{importFont}</style>
        <div style={styles.card}>
          <p style={{ color: "#F0997B", fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  const upcoming = items
    .filter((it) => it.date && it.status !== "done")
    .sort((a, b) => a.date.localeCompare(b.date));
  const published = items
    .filter((it) => it.status === "done")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div style={styles.wrap} dir="rtl">
      <style>{importFont}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={{ ...styles.avatar, background: (brand.color || "#E7A33E") + "26", color: brand.color || "#E7A33E" }}>
            {brand.emoji || "🟠"}
          </span>
          <div>
            <div style={styles.brandName}>{brand.name}</div>
            <div style={styles.brandSub}>خطة المحتوى — لينك مشاركة (للقراءة بس)</div>
          </div>
        </div>

        <h2 style={styles.sectionTitle}>جاي قريب</h2>
        <div style={styles.list}>
          {upcoming.length === 0 && <div style={styles.empty}>مفيش حاجة مجدولة دلوقتي.</div>}
          {upcoming.map((it) => {
            const sd = STATUS_DEFS.find((s) => s.key === it.status);
            return (
              <div key={it.id} style={styles.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowTitle}>{it.title}</div>
                  <div style={styles.rowMeta}>{it.type}{it.date ? ` · ${fmtDate(it.date)}` : ""}</div>
                </div>
                <span style={{ ...styles.badge, color: sd?.color, background: (sd?.color || "#8FA0A8") + "22" }}>{sd?.label}</span>
              </div>
            );
          })}
        </div>

        <h2 style={{ ...styles.sectionTitle, marginTop: 26 }}>اتنشر مؤخرًا</h2>
        <div style={styles.list}>
          {published.length === 0 && <div style={styles.empty}>لسه مفيش حاجة اتنشرت.</div>}
          {published.slice(0, 10).map((it) => (
            <div key={it.id} style={styles.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.rowTitle}>{it.title}</div>
                <div style={styles.rowMeta}>{it.type}{it.date ? ` · ${fmtDate(it.date)}` : ""}</div>
              </div>
              {it.views != null && <span style={styles.viewsBadge}>👁 {it.views}</span>}
            </div>
          ))}
        </div>

        <p style={styles.footer}>اللينك ده للقراءة بس — مقدمّلك من استوديو الشغل.</p>
      </div>
    </div>
  );
}

const importFont = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
  * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
`;

const styles = {
  wrap: { minHeight: "100vh", background: "#11171B", padding: 20, display: "flex", justifyContent: "center" },
  loadingText: { color: "#8FA0A8", fontSize: 14, marginTop: 60 },
  card: { background: "#161E23", border: "1px solid #2C383F", borderRadius: 14, padding: 24, maxWidth: 380, marginTop: 40 },
  container: { width: "100%", maxWidth: 640 },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28, marginTop: 16 },
  avatar: { width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 },
  brandName: { color: "#F2EEE4", fontSize: 19, fontWeight: 800 },
  brandSub: { color: "#657078", fontSize: 12, marginTop: 2 },
  sectionTitle: { color: "#D8D3C6", fontSize: 14, fontWeight: 700, margin: "0 0 10px" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: { color: "#657078", fontSize: 12.5, padding: "10px 2px" },
  row: { display: "flex", alignItems: "center", gap: 10, background: "#1B2328", border: "1px solid #222C31", borderRadius: 10, padding: "10px 12px" },
  rowTitle: { color: "#F2EEE4", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowMeta: { color: "#657078", fontSize: 11, marginTop: 2 },
  badge: { fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, flexShrink: 0 },
  viewsBadge: { fontSize: 11, color: "#8FA0A8", flexShrink: 0 },
  footer: { textAlign: "center", color: "#4E585F", fontSize: 11, marginTop: 32 },
};
