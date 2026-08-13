import React from "react";
import {
  Home, CalendarIcon, Search, BarChart3, Wallet, TrendingUp, Menu,
  Eye, ThumbsUp, MessageCircle, Share2, Instagram, Facebook, Youtube,
} from "lucide-react";
import { LogoIcon } from "../Logo";
import { landing } from "./tokens";

// Deliberately mirrors the real app's Sidebar/Kanban/Analyzer/Insights
// structure and copy (see src/ContentStudio.jsx) rather than an unrelated
// generic dashboard — rendered as a live HTML/CSS mockup since this is a
// marketing surface, not an actual screenshot. Fictional demo data only.

const NAV_ITEMS = [
  { icon: Home, label: "الرئيسية" },
  { icon: CalendarIcon, label: "التقويم العام" },
  { icon: Search, label: "بحث في كل الأفكار" },
  { icon: BarChart3, label: "مقارنة البراندات" },
  { icon: Wallet, label: "الاشتراك والباقة" },
];

// Below 640px, these mockups switch from the desktop sidebar+grid
// composition to a simplified mobile product preview (compact header,
// stacked content) instead of shrinking the same layout until it's
// unreadable. Scoped to this file only — the real app's Sidebar/Kanban
// (ContentStudio.jsx) are untouched.
const MOCKUP_RESPONSIVE_CSS = `
  .cs-mockup-hamburger { display: none; }
  @media (max-width: 640px) {
    .cs-mockup-row { flex-direction: column; }
    .cs-mockup-sidebar {
      width: 100% !important; flex-direction: row !important; align-items: center;
      justify-content: space-between; padding: 10px 12px !important; gap: 0 !important;
      border-inline-end: none !important; border-bottom: 1px solid ${landing.darkBorder};
    }
    .cs-mockup-sidebar-nav, .cs-mockup-sidebar-brands { display: none !important; }
    .cs-mockup-hamburger { display: flex !important; }
    .cs-mockup-main { padding: 12px 14px !important; }
    .cs-mockup-kanban-row { grid-template-columns: 1fr !important; }
  }
`;

function Frame({ children }) {
  return (
    <div style={styles.frame}>
      <style>{MOCKUP_RESPONSIVE_CSS}</style>
      <div style={styles.frameBar}>
        <span style={{ ...styles.dot, background: "#FF5F57" }} />
        <span style={{ ...styles.dot, background: "#FEBC2E" }} />
        <span style={{ ...styles.dot, background: "#28C840" }} />
      </div>
      <div style={styles.frameBody}>{children}</div>
    </div>
  );
}

function MiniSidebar({ activeIndex = 0 }) {
  return (
    <div style={styles.sidebar} className="cs-mockup-sidebar">
      <div style={styles.sidebarBrand}>
        <LogoIcon size={22} />
        <span style={styles.sidebarBrandText}>ContentST</span>
      </div>
      <div style={styles.sidebarNav} className="cs-mockup-sidebar-nav">
        {NAV_ITEMS.map((it, i) => (
          <div key={it.label} style={{ ...styles.navItem, ...(i === activeIndex ? styles.navItemActive : {}) }}>
            <it.icon size={13} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div style={styles.sidebarBrands} className="cs-mockup-sidebar-brands">
        <div style={styles.brandChip}><span style={{ ...styles.brandDot, background: landing.orange }} />Nova Studio</div>
        <div style={styles.brandChip}><span style={{ ...styles.brandDot, background: "#5FA8D3" }} />Orbit Media</div>
      </div>
      <span className="cs-mockup-hamburger" style={styles.hamburger}><Menu size={15} /></span>
    </div>
  );
}

const KANBAN_COLUMNS = [
  { key: "idea", label: "فكرة جديدة", color: "#9AA3BF", items: ["Behind the Scenes", "Weekly Tips"] },
  { key: "ready", label: "جاهزة", color: "#5FA8D3", items: ["Educational Reel"] },
  { key: "scheduled", label: "مجدولة", color: "#E7A33E", items: ["Product Launch"] },
  { key: "done", label: "اتنشرت", color: "#4FB286", items: ["Summer Campaign"] },
];

export function KanbanMockup() {
  return (
    <Frame>
      <div style={styles.dashRow} className="cs-mockup-row">
        <MiniSidebar activeIndex={0} />
        <div style={styles.mainArea} className="cs-mockup-main">
          <div style={styles.mainHead}>لوحة أفكار — Nova Studio</div>
          <div style={styles.kanbanRow} className="cs-mockup-kanban-row">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.key} style={styles.kanbanCol}>
                <div style={styles.kanbanColHead}>
                  <span style={{ ...styles.dotSm, background: col.color }} />
                  <span>{col.label}</span>
                </div>
                {col.items.map((title) => (
                  <div key={title} style={styles.kanbanCard}>{title}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function AnalyzerMockup() {
  return (
    <Frame>
      <div style={styles.dashRow} className="cs-mockup-row">
        <MiniSidebar activeIndex={-1} />
        <div style={styles.mainArea} className="cs-mockup-main">
          <div style={styles.mainHead}>تحليل البراند — Nova Studio</div>
          <div style={styles.analyzerCard}>
            <div style={styles.analyzerTitle}>تحليل محتوى جديد</div>
            <div style={styles.analyzerInputRow}>
              <div style={styles.analyzerInput}>الصق رابط المحتوى هنا...</div>
              <div style={styles.analyzerBtn}>تحليل المحتوى</div>
            </div>
            <div style={styles.platformRow}>
              <span style={styles.platformChip}><Instagram size={11} /> Instagram</span>
              <span style={styles.platformChip}>TikTok</span>
              <span style={styles.platformChip}><Facebook size={11} /> Facebook</span>
              <span style={styles.platformChip}><Youtube size={11} /> YouTube</span>
            </div>
          </div>
          <div style={styles.resultCard}>
            <div style={styles.resultUrl}>instagram.com/reel/summer-campaign</div>
            <div style={styles.metricsRow}>
              <span style={styles.metric}><Eye size={11} /> 48.2K</span>
              <span style={styles.metric}><ThumbsUp size={11} /> 3.4K</span>
              <span style={styles.metric}><MessageCircle size={11} /> 186</span>
              <span style={styles.metric}><Share2 size={11} /> 420</span>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function InsightsMockup() {
  return (
    <Frame>
      <div style={styles.dashRow} className="cs-mockup-row">
        <MiniSidebar activeIndex={-1} />
        <div style={styles.mainArea} className="cs-mockup-main">
          <div style={styles.mainHead}>تحليل البراند — Nova Studio</div>
          <div style={styles.statRow}>
            <div style={styles.statCard}><div style={styles.statValue}>24</div><div style={styles.statLabel}>محتوى تم تحليله</div></div>
            <div style={styles.statCard}><div style={{ ...styles.statValue, color: "#7FB8FF" }}>248.6K</div><div style={styles.statLabel}>إجمالي المشاهدات</div></div>
            <div style={styles.statCard}><div style={{ ...styles.statValue, color: "#7FE0B0" }}>12.4K</div><div style={styles.statLabel}>إجمالي التفاعل</div></div>
          </div>
          <div style={styles.platformBreakdown}>
            {[
              { name: "Instagram", pct: 78, icon: Instagram },
              { name: "TikTok", pct: 56 },
              { name: "Facebook", pct: 34, icon: Facebook },
              { name: "YouTube", pct: 21, icon: Youtube },
            ].map((p) => (
              <div key={p.name} style={styles.barRow}>
                <span style={styles.barLabel}>{p.name}</span>
                <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${p.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

const styles = {
  frame: {
    width: "100%", borderRadius: 16, overflow: "hidden",
    boxShadow: "0 30px 80px rgba(8,11,20,0.35), 0 4px 14px rgba(8,11,20,0.2)",
    border: `1px solid ${landing.darkBorder}`,
  },
  frameBar: {
    display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
    background: landing.darkSurface, borderBottom: `1px solid ${landing.darkBorder}`,
  },
  dot: { width: 9, height: 9, borderRadius: "50%" },
  frameBody: { background: landing.dark },
  dashRow: { display: "flex", minHeight: 340 },
  sidebar: {
    width: 148, flexShrink: 0, background: landing.darkSurface,
    borderInlineEnd: `1px solid ${landing.darkBorder}`, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 14,
  },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 7, padding: "0 4px" },
  sidebarBrandText: { fontSize: 11.5, fontWeight: 800, color: landing.darkText },
  hamburger: {
    alignItems: "center", justifyContent: "center", width: 26, height: 26,
    borderRadius: 6, background: landing.darkCard, border: `1px solid ${landing.darkBorder}`,
    color: landing.darkTextDim, flexShrink: 0,
  },
  sidebarNav: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 7, padding: "6px 7px", borderRadius: 6, fontSize: 9.5, color: landing.darkTextDim },
  navItemActive: { background: "rgba(255,159,45,0.14)", color: landing.darkText, fontWeight: 700 },
  sidebarBrands: { display: "flex", flexDirection: "column", gap: 5, marginTop: "auto" },
  brandChip: { display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: landing.darkTextDim, background: landing.darkCard, borderRadius: 6, padding: "5px 7px" },
  brandDot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },
  mainArea: { flex: 1, padding: "16px 18px", minWidth: 0 },
  mainHead: { fontSize: 11.5, fontWeight: 800, color: landing.darkText, marginBottom: 12 },
  kanbanRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
  kanbanCol: { background: landing.darkSurface, borderRadius: 9, padding: 8, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
  kanbanColHead: { display: "flex", alignItems: "center", gap: 5, fontSize: 8.5, fontWeight: 700, color: landing.darkTextDim, marginBottom: 2 },
  dotSm: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },
  kanbanCard: { background: landing.darkCard, borderRadius: 6, padding: "7px 8px", fontSize: 8.5, color: landing.darkText, border: `1px solid ${landing.darkBorder}` },
  analyzerCard: { background: landing.darkCard, border: `1px solid ${landing.darkBorder}`, borderRadius: 10, padding: 14, marginBottom: 10 },
  analyzerTitle: { fontSize: 11, fontWeight: 800, color: landing.darkText, marginBottom: 8 },
  analyzerInputRow: { display: "flex", gap: 6 },
  analyzerInput: { flex: 1, background: landing.darkSurface, border: `1px solid ${landing.darkBorder}`, borderRadius: 7, padding: "7px 9px", fontSize: 9, color: landing.darkTextDim },
  analyzerBtn: { background: landing.gradient, color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 7, padding: "7px 12px", whiteSpace: "nowrap" },
  platformRow: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" },
  platformChip: { display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: landing.darkTextDim, background: landing.darkSurface, borderRadius: 999, padding: "3px 8px" },
  resultCard: { background: landing.darkCard, border: `1px solid ${landing.darkBorder}`, borderRadius: 10, padding: 12 },
  resultUrl: { fontSize: 8.5, color: landing.darkTextDim, marginBottom: 8, direction: "ltr", textAlign: "right" },
  metricsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  metric: { display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 700, color: landing.darkText },
  statRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 },
  statCard: { background: landing.darkCard, border: `1px solid ${landing.darkBorder}`, borderRadius: 10, padding: "12px 10px" },
  statValue: { fontSize: 17, fontWeight: 800, color: landing.darkText },
  statLabel: { fontSize: 8.5, color: landing.darkTextDim, marginTop: 3 },
  platformBreakdown: { display: "flex", flexDirection: "column", gap: 9 },
  barRow: { display: "flex", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 9, color: landing.darkTextDim, width: 54, flexShrink: 0 },
  barTrack: { flex: 1, height: 6, background: landing.darkSurface, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", background: landing.gradient, borderRadius: 4 },
};
