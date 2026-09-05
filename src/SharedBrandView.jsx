import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { colors, radius, spacing, shadows, typography } from "./theme";
import { Badge, EmptyState } from "./components";
import {
  Calendar as CalendarIcon, Clock, Eye, Heart, MessageCircle, Share2, Bookmark,
  CheckCircle2, Sparkles, Instagram, Facebook, Youtube, Link2, ThumbsUp, ThumbsDown, Send,
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
  const [feedback, setFeedback] = useState([]);
  const [agency, setAgency] = useState(null);

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
          setFeedback(data.feedback || []);
          setAgency(data.agency || null);
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

  function feedbackForItem(itemId) {
    return feedback.filter((f) => f.itemId === itemId);
  }

  function onFeedbackAdded(entry) {
    setFeedback((prev) => [...prev, entry]);
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
        {(agency?.logoUrl || agency?.name) && (
          <div style={styles.agencyBar}>
            {agency.logoUrl ? <img src={agency.logoUrl} alt={agency.name || ""} style={styles.agencyLogo} /> : null}
            {agency.name && <span>{agency.name}</span>}
          </div>
        )}
        <div style={{ ...styles.headerCard, boxShadow: shadows.md }}>
          <div style={{ ...styles.headerStripe, background: brand.color || colors.accentBlue }} />
          <div style={styles.headerInner}>
            <span style={{ ...styles.avatar, background: `${brand.color || "#E7A33E"}22`, color: brand.color || "#E7A33E" }}>
              {brand.emoji || "🟠"}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={styles.brandName}>{brand.name}</div>
              <div style={styles.brandSub}><Link2 size={11} style={{ verticalAlign: -1 }} /> خطة المحتوى — تقدر تسيب ملاحظاتك وتوافق على أي فكرة</div>
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
                  <ItemRow
                    key={it.id}
                    it={it}
                    analyses={analysesForItem(it.id)}
                    token={token}
                    feedback={feedbackForItem(it.id)}
                    onFeedbackAdded={onFeedbackAdded}
                  />
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
              <ItemRow
                key={it.id}
                it={it}
                analyses={analysesForItem(it.id)}
                published
                token={token}
                feedback={feedbackForItem(it.id)}
                onFeedbackAdded={onFeedbackAdded}
              />
            ))}
          </div>
        )}

        <p style={styles.footer}>
          {agency?.name ? `مقدمّلك من ${agency.name}.` : "مقدمّلك من ContentST."}
        </p>
      </div>
    </div>
  );
}

function ItemRow({ it, analyses, published, token, feedback, onFeedbackAdded }) {
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
      {token && <ItemFeedback token={token} itemId={it.id} feedback={feedback || []} onAdded={onFeedbackAdded} />}
    </div>
  );
}

const FEEDBACK_KIND_LABELS = {
  approved: { label: "موافق", color: colors.good, Icon: ThumbsUp },
  changes_requested: { label: "محتاج تعديل", color: colors.warning, Icon: ThumbsDown },
  comment: { label: "ملاحظة", color: colors.info, Icon: MessageCircle },
};

// ملاحظات وموافقة العميل على فكرة معينة — بيتبعت بدون تسجيل دخول عن
// طريق add_share_feedback (RPC)، وصاحب اللينك بيشوفهم من لوحته العادية
// (زرار "لينك مشاركة مع العميل" في صفحة البراند).
function ItemFeedback({ token, itemId, feedback, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => {
    try { return localStorage.getItem("cs-share-author-name") || ""; } catch (e) { return ""; }
  });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");

  async function submit(kind) {
    if (kind === "comment" && !message.trim()) return;
    setSending(true);
    setSentMsg("");
    try {
      const { data, error } = await supabase.rpc("add_share_feedback", {
        p_token: token, p_item_id: itemId, p_author_name: name.trim() || null, p_message: message.trim() || null, p_kind: kind,
      });
      if (error || !data?.ok) throw new Error(data?.message || "حصلت مشكلة، جرب تاني.");
      try { localStorage.setItem("cs-share-author-name", name.trim()); } catch (e) {}
      onAdded({
        id: `local-${Date.now()}`, itemId, authorName: name.trim() || null,
        message: message.trim() || null, kind, createdAt: new Date().toISOString(),
      });
      setMessage("");
      setSentMsg(kind === "approved" ? "تم إرسال موافقتك ✅" : kind === "changes_requested" ? "تم إرسال طلبك ✏️" : "تم إرسال ملاحظتك");
      setTimeout(() => setSentMsg(""), 3000);
    } catch (e) {
      setSentMsg(e.message || "حصلت مشكلة، جرب تاني.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={styles.feedbackWrap}>
      {feedback.length > 0 && (
        <div style={styles.feedbackList}>
          {feedback.map((f) => {
            const k = FEEDBACK_KIND_LABELS[f.kind] || FEEDBACK_KIND_LABELS.comment;
            const Icon = k.Icon;
            return (
              <div key={f.id} style={styles.feedbackItem}>
                <span style={{ ...styles.feedbackKind, color: k.color }}><Icon size={11} /> {k.label}</span>
                {f.message && <span style={styles.feedbackMsg}>{f.message}</span>}
                {f.authorName && <span style={styles.feedbackAuthor}>— {f.authorName}</span>}
              </div>
            );
          })}
        </div>
      )}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={styles.feedbackToggle}>
          <MessageCircle size={11} /> سيب ملاحظة أو وافق
        </button>
      ) : (
        <div style={styles.feedbackForm}>
          <input
            style={styles.feedbackNameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك (اختياري)"
          />
          <textarea
            style={styles.feedbackTextarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب ملاحظتك هنا..."
          />
          <div style={styles.feedbackActions}>
            <button type="button" disabled={sending} onClick={() => submit("approved")} style={{ ...styles.feedbackBtn, color: colors.good, borderColor: colors.good }}>
              <ThumbsUp size={12} /> موافق
            </button>
            <button type="button" disabled={sending} onClick={() => submit("changes_requested")} style={{ ...styles.feedbackBtn, color: colors.warning, borderColor: colors.warning }}>
              <ThumbsDown size={12} /> محتاج تعديل
            </button>
            <button type="button" disabled={sending || !message.trim()} onClick={() => submit("comment")} style={{ ...styles.feedbackBtn, color: colors.info, borderColor: colors.info }}>
              <Send size={12} /> ابعت ملاحظة
            </button>
          </div>
          {sentMsg && <p style={styles.feedbackSent}>{sentMsg}</p>}
        </div>
      )}
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

  agencyBar: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.md,
    color: colors.textDim, fontSize: 12.5, fontWeight: 700,
  },
  agencyLogo: { height: 22, maxWidth: 120, objectFit: "contain" },

  feedbackWrap: { borderTop: `1px solid ${colors.border}`, padding: "8px 10px" },
  feedbackList: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 6 },
  feedbackItem: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 10.5 },
  feedbackKind: { display: "flex", alignItems: "center", gap: 3, fontWeight: 800, flexShrink: 0 },
  feedbackMsg: { color: colors.textDim },
  feedbackAuthor: { color: colors.textFaint, fontStyle: "italic" },
  feedbackToggle: {
    display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none",
    color: colors.accentBlue, fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit",
  },
  feedbackForm: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
  feedbackNameInput: {
    background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: radius.sm,
    color: colors.text, padding: "6px 9px", fontSize: 11, fontFamily: "inherit", outline: "none",
  },
  feedbackTextarea: {
    background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: radius.sm,
    color: colors.text, padding: "6px 9px", fontSize: 11, fontFamily: "inherit", outline: "none",
    minHeight: 44, resize: "vertical",
  },
  feedbackActions: { display: "flex", gap: 6, flexWrap: "wrap" },
  feedbackBtn: {
    display: "flex", alignItems: "center", gap: 4, background: "transparent",
    border: "1px solid", borderRadius: radius.pill, padding: "4px 9px",
    fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  feedbackSent: { fontSize: 10.5, color: colors.good, margin: 0 },
};
