import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { colors, radius, spacing, shadows, typography } from "./theme";
import { Badge, EmptyState } from "./components";
import {
  Calendar as CalendarIcon, Clock, Eye, Heart, MessageCircle, Share2, Bookmark,
  CheckCircle2, Sparkles, Instagram, Facebook, Youtube, Link2,
} from "lucide-react";

function TiktokIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-.7-.77-1.09-1.76-1.1-2.82h-2.99v13.39a2.6 2.6 0 1 1-1.86-2.49v-3.05a5.6 5.6 0 1 0 4.85 5.55V9.4a7.05 7.05 0 0 0 4.1 1.31V7.68c-1.11 0-2.15-.36-2.99-1a4.62 4.62 0 0 1-.01-.86z" />
    </svg>
  );
}

const STATUS_DEFS = [
  { key: "idea", label: "فكرة جديدة", color: "#9AA3BF" },
  { key: "ready", label: "جاهزة", color: "#5FA8D3" },
  { key: "scheduled", label: "مجدولة", color: "#E7A33E" },
  { key: "done", label: "اتنشرت", color: "#4FB286" },
];

const PLATFORMS = {
  instagram: { label: "Instagram", Icon: Instagram, color: "#E1306C" },
  tiktok: { label: "TikTok", Icon: TiktokIcon, color: "#69C9D0" },
  facebook: { label: "Facebook", Icon: Facebook, color: "#1877F2" },
  youtube: { label: "YouTube", Icon: Youtube, color: "#FF0000" },
};

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function fmtMoney(n) {
  if (n === null || n === undefined) return null;
  return Number(n).toLocaleString("en-US");
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return `${dt.getDate()} ${MONTHS_AR[dt.getMonth()]}`;
}

function monthLabel(d) {
  const dt = new Date(d + "T00:00:00");
  return `${MONTHS_AR[dt.getMonth()]} ${dt.getFullYear()}`;
}

// بيجمع عناصر مرتبة زمنيًا في مجموعات شهرية متتالية — بيتستخدم لعرض "جاي
// قريب" على شكل أقسام بعنوان الشهر بدل قايمة واحدة طويلة من غير تقسيم،
// وده اللي كان بيخلي اللينك يحس إنه "كتلة" واحدة مملة لما فيه محتوى كتير.
function groupByMonth(list) {
  const groups = [];
  let current = null;
  for (const it of list) {
    const key = it.date.slice(0, 7);
    if (!current || current.key !== key) {
      current = { key, label: monthLabel(it.date), items: [] };
      groups.push(current);
    }
    current.items.push(it);
  }
  return groups;
}

export default function SharedBrandView({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState(null);
  const [items, setItems] = useState([]);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase.rpc("get_shared_brand", { p_token: token });
        if (err) throw err;
        if (!data?.ok) {
          setError(data?.message || "اللينك ده مش صحيح أو اتلغى.");
        } else {
          setBrand(data.brand);
          setItems(data.items || []);
          setAnalyses(data.analyses || []);
        }
      } catch (e) {
        setError("حصلت مشكلة في تحميل الصفحة، جرب تاني.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  function analysesForItem(itemId) {
    return analyses.filter((a) => a.ideaId === itemId);
  }

  if (loading) {
    return (
      <div style={styles.wrap} dir="rtl">
        <style>{importFont}</style>
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>بيحمّل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrap} dir="rtl">
        <style>{importFont}</style>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>🔒</div>
          <p style={styles.errorText}>{error}</p>
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
  const upcomingGroups = groupByMonth(upcoming);
  const totalViews = published.reduce((sum, it) => sum + (Number(it.views) || 0), 0)
    + analyses.reduce((sum, a) => sum + (Number(a.views) || 0), 0);

  return (
    <div style={styles.wrap} dir="rtl">
      <style>{importFont}</style>
      <div style={styles.container}>
        <div style={{ ...styles.headerCard, boxShadow: shadows.md }}>
          <div style={{ ...styles.headerStripe, background: brand.color || colors.accentBlue }} />
          <div style={styles.headerInner}>
            <span style={{ ...styles.avatar, background: `${brand.color || "#E7A33E"}22`, color: brand.color || "#E7A33E" }}>
              {brand.emoji || "🟠"}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={styles.brandName}>{brand.name}</div>
              <div style={styles.brandSub}><Link2 size={11} style={{ verticalAlign: -1 }} /> خطة المحتوى — لينك مشاركة للقراءة بس</div>
            </div>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.statCell}>
              <div style={styles.statValue}>{upcoming.length}</div>
              <div style={styles.statLabel}>جاي قريب</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={styles.statValue}>{published.length}</div>
              <div style={styles.statLabel}>اتنشر</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={styles.statValue}>{fmtMoney(totalViews)}</div>
              <div style={styles.statLabel}>إجمالي مشاهدات</div>
            </div>
          </div>
        </div>

        <div style={styles.sectionHead}>
          <CalendarIcon size={15} color={colors.textDim} />
          <h2 style={styles.sectionTitle}>جاي قريب</h2>
          {upcoming.length > 0 && <span style={styles.sectionCount}>{upcoming.length}</span>}
        </div>

        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarIcon size={18} />} description="مفيش حاجة مجدولة دلوقتي." />
        ) : (
          upcomingGroups.map((g) => (
            <div key={g.key} style={{ marginBottom: spacing.lg }}>
              <div style={styles.monthLabel}>{g.label}</div>
              <div style={styles.grid}>
                {g.items.map((it) => (
                  <ItemRow key={it.id} it={it} analyses={analysesForItem(it.id)} />
                ))}
              </div>
            </div>
          ))
        )}

        <div style={{ ...styles.sectionHead, marginTop: spacing.xl }}>
          <CheckCircle2 size={15} color={colors.textDim} />
          <h2 style={styles.sectionTitle}>اتنشر مؤخرًا</h2>
          {published.length > 0 && <span style={styles.sectionCount}>{published.length}</span>}
        </div>
        {published.length === 0 ? (
          <EmptyState icon={<Sparkles size={18} />} description="لسه مفيش حاجة اتنشرت." />
        ) : (
          <div style={styles.grid}>
            {published.slice(0, 10).map((it) => (
              <ItemRow key={it.id} it={it} analyses={analysesForItem(it.id)} published />
            ))}
          </div>
        )}

        <p style={styles.footer}>اللينك ده للقراءة بس — مقدمّلك من ContentST.</p>
      </div>
    </div>
  );
}

function ItemRow({ it, analyses, published }) {
  const sd = STATUS_DEFS.find((s) => s.key === it.status);
  return (
    <div style={{ ...styles.rowCol, boxShadow: shadows.sm }}>
      <div style={styles.row}>
        <div style={{ ...styles.rowStripe, background: sd?.color || colors.textFaint }} />
        <div style={{ flex: 1, minWidth: 0, padding: "11px 12px 11px 0" }}>
          <div style={styles.rowTitle}>{it.title}</div>
          <div style={styles.rowMeta}>
            {it.type}
            {it.date && (
              <>
                {" · "}<Clock size={10.5} style={{ verticalAlign: -1.5 }} /> {fmtDate(it.date)}
              </>
            )}
          </div>
        </div>
        <div style={{ padding: "11px 12px" }}>
          {published && it.views != null ? (
            <Badge tone="default" icon={<Eye size={11} />}>{fmtMoney(it.views)}</Badge>
          ) : (
            <Badge color={sd?.color}>{sd?.label}</Badge>
          )}
        </div>
      </div>
      <AnalyticsRows analyses={analyses} />
    </div>
  );
}

// صف تحليلات أداء المحتوى (Instagram/TikTok/Facebook/YouTube) الخاصة
// بفكرة واحدة — بيعرض كل منصة متحللة ليها بمقاييسها.
function AnalyticsRows({ analyses }) {
  if (!analyses || analyses.length === 0) return null;
  return (
    <div style={styles.analyticsWrap}>
      {analyses.map((a) => {
        const p = PLATFORMS[a.platform];
        const Icon = p?.Icon;
        return (
          <div key={a.id} style={styles.analyticsRow}>
            <span style={{ ...styles.analyticsPlatform, color: p?.color || colors.textDim }}>
              {Icon && <Icon size={12} />} {p?.label || a.platform || "—"}
            </span>
            <div style={styles.analyticsMetrics}>
              {a.views != null && <span><Eye size={11} style={{ verticalAlign: -2 }} /> {fmtMoney(a.views)}</span>}
              {a.likes != null && <span><Heart size={11} style={{ verticalAlign: -2 }} /> {fmtMoney(a.likes)}</span>}
              {a.comments != null && <span><MessageCircle size={11} style={{ verticalAlign: -2 }} /> {fmtMoney(a.comments)}</span>}
              {a.shares != null && <span><Share2 size={11} style={{ verticalAlign: -2 }} /> {fmtMoney(a.shares)}</span>}
              {a.saves != null && <span><Bookmark size={11} style={{ verticalAlign: -2 }} /> {fmtMoney(a.saves)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const importFont = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
  * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
  @keyframes cs-share-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  wrap: { minHeight: "100vh", background: colors.bg, padding: "32px 20px", display: "flex", justifyContent: "center" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 80 },
  spinner: {
    width: 26, height: 26, borderRadius: "50%", border: `3px solid ${colors.border}`,
    borderTopColor: colors.accentBlue, animation: "cs-share-spin 0.8s linear infinite",
  },
  loadingText: { color: colors.textDim, fontSize: 13.5 },
  errorCard: {
    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.lg,
    padding: "32px 24px", maxWidth: 380, marginTop: 60, textAlign: "center",
  },
  errorIcon: { fontSize: 26, marginBottom: 10 },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 1.7, margin: 0 },
  container: { width: "100%", maxWidth: 900 },

  headerCard: {
    position: "relative", background: colors.card, border: `1px solid ${colors.border}`,
    borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.xxl,
  },
  headerStripe: { height: 5, width: "100%" },
  headerInner: { display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 16px" },
  avatar: {
    width: 50, height: 50, borderRadius: radius.md, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 23, flexShrink: 0,
  },
  brandName: { color: colors.text, ...typography.scale.pageTitle, fontSize: 19 },
  brandSub: { color: colors.textFaint, fontSize: 12, marginTop: 3, display: "flex", alignItems: "center", gap: 4 },
  statsRow: {
    display: "flex", alignItems: "stretch", borderTop: `1px solid ${colors.border}`,
    background: colors.bg,
  },
  statCell: { flex: 1, textAlign: "center", padding: "12px 8px" },
  statValue: { color: colors.text, fontSize: 17, fontWeight: 800 },
  statLabel: { color: colors.textFaint, fontSize: 10.5, fontWeight: 700, marginTop: 2 },
  statDivider: { width: 1, background: colors.border },

  sectionHead: { display: "flex", alignItems: "center", gap: 7, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: 800, margin: 0 },
  sectionCount: {
    color: colors.textFaint, fontSize: 11, fontWeight: 700, background: colors.card,
    border: `1px solid ${colors.border}`, borderRadius: radius.pill, padding: "1px 8px",
  },
  monthLabel: { color: colors.textFaint, fontSize: 11.5, fontWeight: 700, margin: "0 0 8px 2px" },

  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: spacing.sm, alignItems: "start",
  },
  rowCol: {
    display: "flex", flexDirection: "column", background: colors.card,
    border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden",
  },
  row: { display: "flex", alignItems: "stretch" },
  rowStripe: { width: 3, flexShrink: 0 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowMeta: { color: colors.textFaint, fontSize: 10.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  analyticsWrap: { display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${colors.border}`, padding: "8px 10px" },
  analyticsRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  analyticsPlatform: { display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, flexShrink: 0 },
  analyticsMetrics: { display: "flex", alignItems: "center", gap: 7, color: colors.textDim, fontSize: 10, flexWrap: "wrap" },

  footer: { textAlign: "center", color: colors.textFaint, fontSize: 11, marginTop: spacing.xxxl, opacity: 0.8 },
};
