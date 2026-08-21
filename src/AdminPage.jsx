import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { colors, radius, spacing, shadows, typography } from "./theme";
import { Button, Badge, EmptyState } from "./components";
import { useLanguage } from "./LanguageContext";
import {
  Users, ShieldCheck, Hourglass, CheckCircle2, XCircle, Globe, ArrowRight,
  Mail, Search, ChevronDown, ChevronUp,
} from "lucide-react";

const USER_TYPE_LABELS = {
  creator: "صانع محتوى",
  smm: "Social Media Manager",
  agency: "وكالة / Agency",
  brand_owner: "صاحب Brand / Business",
  marketing_team: "فريق تسويق",
  other: "أخرى",
  skipped: "اتخطى",
};

const MARKETING_SOURCE_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google",
  referral: "صديق / ترشيح",
  ad: "إعلان",
  other: "أخرى",
  skipped: "اتخطى",
};

const PLAN_OPTIONS = [
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
  { key: "unlimited", label: "Unlimited" },
];

function fmtDateTime(iso, lang) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ar-EG-u-nu-latn", { year: "numeric", month: "short", day: "numeric" });
}

// حالة الاشتراك الحقيقية دلوقتي (مش مجرد status الخام) — نفس منطق
// checkSubscription جوا App.jsx بالظبط، عشان الأدمن يشوف نفس اللي
// المستخدم شايفه فعليًا.
function liveStatus(u) {
  const now = new Date();
  const trialEnd = u.trial_ends_at ? new Date(u.trial_ends_at) : null;
  const periodEnd = u.current_period_end ? new Date(u.current_period_end) : null;
  if (!u.status) return { key: "none", label: "من غير اشتراك", color: colors.textFaint };
  if (u.status === "active" && (!periodEnd || periodEnd > now)) return { key: "active", label: "فعّال", color: "#4FB286" };
  if (u.status === "trial" && trialEnd && trialEnd > now) return { key: "trial", label: "تجربة", color: "#E7A33E" };
  return { key: "expired", label: "منتهي", color: "#F2777A" };
}

export default function AdminPage() {
  const { dir, lang, toggleLang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rowMsg, setRowMsg] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("admin_get_overview");
      if (err) throw err;
      if (!data?.ok) throw new Error("not admin");
      setOverview(data);
    } catch (e) {
      setError(t("مفيش صلاحية تدخل الصفحة دي."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function confirmEmail(userId) {
    setBusyId(userId);
    try {
      const { error: err } = await supabase.rpc("admin_confirm_email", { p_user_id: userId });
      if (err) throw err;
      setRowMsg((m) => ({ ...m, [userId]: t("اتأكد الإيميل ✓") }));
      await load();
    } catch (e) {
      setRowMsg((m) => ({ ...m, [userId]: t("حصلت مشكلة، جرب تاني.") }));
    } finally {
      setBusyId(null);
    }
  }

  async function setSubscription(userId, status, plan, days) {
    setBusyId(userId);
    try {
      const { error: err } = await supabase.rpc("admin_set_subscription", {
        p_user_id: userId, p_status: status, p_plan: plan || null,
        p_days: days === "" || days === null ? null : Number(days),
      });
      if (err) throw err;
      setRowMsg((m) => ({ ...m, [userId]: t("اتحفظ ✓") }));
      await load();
    } catch (e) {
      setRowMsg((m) => ({ ...m, [userId]: t("حصلت مشكلة، جرب تاني.") }));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div style={styles.wrap} dir={dir}>
        <p style={styles.loadingText}>{t("بيحمّل...")}</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div style={styles.wrap} dir={dir}>
        <div style={styles.errorCard}>
          <ShieldCheck size={22} color={colors.danger} />
          <p style={styles.errorText}>{error || t("حصلت مشكلة، جرب تاني.")}</p>
          <Button variant="secondary" onClick={() => { window.location.href = "/"; }}>
            {t("رجوع للموقع")}
          </Button>
        </div>
      </div>
    );
  }

  const { totals, userTypeBreakdown, marketingSourceBreakdown, users } = overview;
  const filtered = query.trim()
    ? users.filter((u) => u.email?.toLowerCase().includes(query.trim().toLowerCase()))
    : users;

  return (
    <div style={styles.wrap} dir={dir}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.topBarTitle}>
            <ShieldCheck size={18} color={colors.accentBlue} /> {t("لوحة الأدمن")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="sm" icon={<Globe size={14} />} onClick={toggleLang}>
              {lang === "ar" ? "EN" : "AR"}
            </Button>
            <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={() => { window.location.href = "/"; }}>
              {t("رجوع للموقع")}
            </Button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <StatCard icon={<Users size={16} />} label={t("إجمالي المستخدمين")} value={totals.total_users} color={colors.accentBlue} />
          <StatCard icon={<Hourglass size={16} />} label={t("في التجربة")} value={totals.trialing} color="#E7A33E" />
          <StatCard icon={<CheckCircle2 size={16} />} label={t("مشتركين فعّالين")} value={totals.active} color="#4FB286" />
          <StatCard icon={<XCircle size={16} />} label={t("منتهيين")} value={totals.expired} color="#F2777A" />
        </div>

        <div style={styles.breakdownGrid}>
          <BreakdownCard title={t("نوع الاستخدام")} data={userTypeBreakdown} labels={USER_TYPE_LABELS} />
          <BreakdownCard title={t("مصدر التعارف")} data={marketingSourceBreakdown} labels={MARKETING_SOURCE_LABELS} />
        </div>

        <div style={styles.searchRow}>
          <Search size={14} color={colors.textFaint} />
          <input
            style={styles.searchInput}
            placeholder={t("دوّر بالإيميل...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span style={styles.searchCount}>{filtered.length}</span>
        </div>

        <div style={styles.list}>
          {filtered.length === 0 && <EmptyState icon={<Users size={18} />} description={t("مفيش نتائج.")} />}
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              u={u}
              t={t}
              lang={lang}
              expanded={expandedId === u.id}
              onToggle={() => setExpandedId(expandedId === u.id ? null : u.id)}
              busy={busyId === u.id}
              msg={rowMsg[u.id]}
              onConfirmEmail={() => confirmEmail(u.id)}
              onSetSubscription={(status, plan, days) => setSubscription(u.id, status, plan, days)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statIcon, color, background: `${color}1f` }}>{icon}</span>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function BreakdownCard({ title, data, labels }) {
  const { t } = useLanguage();
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div style={styles.breakdownCard}>
      <div style={styles.breakdownTitle}>{title}</div>
      {entries.length === 0 && <div style={styles.breakdownEmpty}>—</div>}
      {entries.map(([key, count]) => (
        <div key={key} style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>{t(labels[key] || key)}</span>
          <div style={styles.breakdownBarTrack}>
            <div style={{ ...styles.breakdownBarFill, width: `${(count / max) * 100}%` }} />
          </div>
          <span style={styles.breakdownCount}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function UserRow({ u, t, lang, expanded, onToggle, busy, msg, onConfirmEmail, onSetSubscription }) {
  const st = liveStatus(u);
  const [status, setStatus] = useState(st.key === "none" ? "trial" : st.key);
  const [plan, setPlan] = useState(u.plan || "pro");
  const [days, setDays] = useState(status === "trial" ? "7" : "30");

  return (
    <div style={styles.rowCol}>
      <div style={styles.row} onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.rowEmail}>
            {u.email}
            {!u.email_confirmed && <Badge tone="warning" style={{ marginRight: 6 }}>{t("مش مؤكد")}</Badge>}
          </div>
          <div style={styles.rowMeta}>
            {fmtDateTime(u.created_at, lang)} · {t(USER_TYPE_LABELS[u.user_type] || "لم يتم الاختيار")} · {u.brands_count} {t("براند")} · {u.items_count} {t("فكرة")}
          </div>
        </div>
        <Badge color={st.color}>{t(st.label)}</Badge>
        {expanded ? <ChevronUp size={15} color={colors.textFaint} /> : <ChevronDown size={15} color={colors.textFaint} />}
      </div>

      {expanded && (
        <div style={styles.rowPanel} onClick={(e) => e.stopPropagation()}>
          <div style={styles.panelGrid}>
            <div style={styles.panelField}>
              <label style={styles.panelLabel}>{t("الحالة")}</label>
              <select style={styles.panelSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="trial">{t("تجربة")}</option>
                <option value="active">{t("فعّال")}</option>
                <option value="expired">{t("منتهي")}</option>
              </select>
            </div>
            <div style={styles.panelField}>
              <label style={styles.panelLabel}>{t("الباقة")}</label>
              <select style={styles.panelSelect} value={plan} onChange={(e) => setPlan(e.target.value)}>
                {PLAN_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div style={styles.panelField}>
              <label style={styles.panelLabel}>{status === "active" ? t("عدد الأيام (فاضي = بلا نهاية)") : t("عدد الأيام")}</label>
              <input
                style={styles.panelSelect}
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder={status === "active" ? t("بلا نهاية") : "7"}
              />
            </div>
          </div>
          <div style={styles.panelActions}>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => onSetSubscription(status, plan, days)}>
              {busy ? t("بيحفظ...") : t("احفظ الاشتراك")}
            </Button>
            {!u.email_confirmed && (
              <Button variant="secondary" size="sm" icon={<Mail size={13} />} disabled={busy} onClick={onConfirmEmail}>
                {t("أكّد الإيميل يدوي")}
              </Button>
            )}
            {msg && <span style={styles.panelMsg}>{msg}</span>}
          </div>
          <div style={styles.panelRaw}>
            {t("تجربة لحد")}: {fmtDateTime(u.trial_ends_at, lang)} · {t("اشتراك لحد")}: {u.current_period_end ? fmtDateTime(u.current_period_end, lang) : t("بلا نهاية")} · {t("مصدر التعارف")}: {t(MARKETING_SOURCE_LABELS[u.marketing_source] || "لم يتم الاختيار")}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", background: colors.bg, padding: "24px 20px", display: "flex", justifyContent: "center" },
  loadingText: { color: colors.textDim, fontSize: 13.5, marginTop: 60 },
  errorCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.lg,
    padding: "32px 24px", maxWidth: 380, marginTop: 60, textAlign: "center",
  },
  errorText: { color: colors.textDim, fontSize: 13.5, margin: 0 },
  container: { width: "100%", maxWidth: 1080 },

  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
  topBarTitle: { display: "flex", alignItems: "center", gap: 8, color: colors.text, ...typography.scale.pageTitle, fontSize: 18 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    display: "flex", alignItems: "center", gap: 10, background: colors.card,
    border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "12px 14px",
  },
  statIcon: { width: 32, height: 32, borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: 800, lineHeight: 1.2 },
  statLabel: { color: colors.textFaint, fontSize: 11, fontWeight: 700, marginTop: 2 },

  breakdownGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: spacing.sm, marginBottom: spacing.lg },
  breakdownCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "14px 16px" },
  breakdownTitle: { color: colors.text, fontSize: 12.5, fontWeight: 800, marginBottom: 10 },
  breakdownEmpty: { color: colors.textFaint, fontSize: 12 },
  breakdownRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  breakdownLabel: { color: colors.textDim, fontSize: 11, width: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  breakdownBarTrack: { flex: 1, height: 6, borderRadius: radius.pill, background: colors.border, overflow: "hidden" },
  breakdownBarFill: { height: "100%", background: colors.accentGradient, borderRadius: radius.pill },
  breakdownCount: { color: colors.textFaint, fontSize: 11, width: 22, textAlign: "left", flexShrink: 0 },

  searchRow: {
    display: "flex", alignItems: "center", gap: 8, background: colors.card, border: `1px solid ${colors.border}`,
    borderRadius: radius.md, padding: "8px 12px", marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: colors.text, fontSize: 13, fontFamily: "inherit" },
  searchCount: { color: colors.textFaint, fontSize: 11, fontWeight: 700 },

  list: { display: "flex", flexDirection: "column", gap: spacing.xs, paddingBottom: 40 },
  rowCol: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden", boxShadow: shadows.sm },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" },
  rowEmail: { color: colors.text, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center" },
  rowMeta: { color: colors.textFaint, fontSize: 11, marginTop: 3 },

  rowPanel: { borderTop: `1px solid ${colors.border}`, padding: "12px 14px", background: colors.bg },
  panelGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 10 },
  panelField: { display: "flex", flexDirection: "column", gap: 4 },
  panelLabel: { color: colors.textFaint, fontSize: 10.5, fontWeight: 700 },
  panelSelect: {
    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.sm,
    color: colors.text, padding: "7px 9px", fontSize: 12.5, fontFamily: "inherit", outline: "none",
  },
  panelActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  panelMsg: { color: colors.good, fontSize: 11.5, fontWeight: 700 },
  panelRaw: { color: colors.textFaint, fontSize: 10.5, marginTop: 10, lineHeight: 1.7 },
};
