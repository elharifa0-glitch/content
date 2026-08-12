import React from "react";
import { Instagram, Facebook, Youtube, Eye, ThumbsUp, MessageCircle, Share2, BookOpen } from "lucide-react";
import { Logo } from "./Logo";

// Dedicated, print-only rendering of a Brand Insights report — deliberately
// separate from the on-screen dashboard preview (which has a scrollable
// max-height box for on-screen browsing). This component has no max-height,
// no overflow, and no dependency on viewport/scroll state: it's mounted
// off-screen at a fixed width purely so html2canvas can capture the FULL
// content regardless of what the user was scrolled to when they clicked
// export. See downloadReportPdf() in ContentStudio.jsx.
//
// Reuses the same computed values as the on-screen BrandInsights screen
// (perfTotals, top5, byType, reportData, ...) passed in as props — this
// file holds no analytics logic of its own, only presentation.

const REPORT_WIDTH = 794; // ~A4 width at 96dpi, keeps output proportions predictable regardless of the caller's window size

function TiktokIcon({ size = 14, color = "#1A1A1A" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M16.6 5.82c-.7-.77-1.09-1.76-1.1-2.82h-2.99v13.39a2.6 2.6 0 1 1-1.86-2.49v-3.05a5.6 5.6 0 1 0 4.85 5.55V9.4a7.05 7.05 0 0 0 4.1 1.31V7.68c-1.11 0-2.15-.36-2.99-1a4.62 4.62 0 0 1-.01-.86z" />
    </svg>
  );
}

const PLATFORM_ICON = { instagram: Instagram, tiktok: TiktokIcon, facebook: Facebook, youtube: Youtube };

function fmt(n) {
  return (Number(n) || 0).toLocaleString("ar-EG");
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <h2 style={s.sectionTitle}>{title}</h2>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={s.statBox}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

export default function BrandReportPDF({
  brand, sections, reportDate,
  total, completionRate, overdue, statusCounts,
  byType, mixTargets,
  perfTotals, top5,
  financial, pageTracking,
}) {
  return (
    <div dir="rtl" style={s.page}>
      <div style={s.header}>
        <Logo height={30} variant="dark" />
        <div style={s.headerMeta}>
          <div style={s.reportKicker}>تقرير أداء البراند</div>
          <div style={s.brandName}>{brand.name}</div>
          <div style={s.reportDate}>بتاريخ {reportDate}</div>
        </div>
      </div>

      {sections.overview && (
        <Section title="نظرة عامة">
          {brand.agreementNotes && <p style={s.p}>الاتفاق مع البراند: {brand.agreementNotes}</p>}
          <div style={s.statRow}>
            <StatBox label="إجمالي الأفكار" value={total} />
            <StatBox label="نسبة الإنجاز" value={`${completionRate}%`} />
            <StatBox label="متأخرة عن معادها" value={overdue} />
          </div>
        </Section>
      )}

      {sections.status && (
        <Section title="حالة الأفكار">
          <div style={s.statRow}>
            {statusCounts.map((sc) => <StatBox key={sc.label} label={sc.label} value={sc.count} />)}
          </div>
        </Section>
      )}

      {sections.byType && (
        <Section title="حسب نوع المحتوى">
          {byType.length === 0 ? (
            <p style={s.pMuted}>لسه مفيش أفكار مسجلة.</p>
          ) : (
            <table style={s.table}>
              <tbody>
                {byType.map(([t, c]) => (
                  <tr key={t}>
                    <td style={s.tdLabel}>{t}</td>
                    <td style={s.tdValue}>{c}{mixTargets[t] !== undefined ? ` (مستهدف ${mixTargets[t]}%)` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {sections.performance && (
        <Section title="الأداء">
          <div style={s.statRow}>
            <StatBox label="محتوى تم تحليله" value={perfTotals.count} />
            <StatBox label="إجمالي المشاهدات" value={fmt(perfTotals.views)} />
            <StatBox label="إجمالي اللايكات" value={fmt(perfTotals.likes)} />
            <StatBox label="إجمالي الكومنتات" value={fmt(perfTotals.comments)} />
            <StatBox label="إجمالي المشاركات" value={fmt(perfTotals.shares)} />
            <StatBox label="إجمالي الحفظ" value={fmt(perfTotals.saves)} />
          </div>
          <p style={s.pMuted}>مشاهدات الشهر ده: {fmt(perfTotals.monthViews)} | لايكات الشهر ده: {fmt(perfTotals.monthLikes)} | كومنتات الشهر ده: {fmt(perfTotals.monthComments)}</p>
        </Section>
      )}

      {sections.top5 && (
        <Section title="أفضل 5 محتوى">
          {top5.length === 0 ? (
            <p style={s.pMuted}>لسه مفيش محتوى محلل بأرقام مشاهدات.</p>
          ) : (
            <div style={s.top5List}>
              {top5.map((it, idx) => (
                <div key={it.id} style={s.top5Row}>
                  <div style={s.top5Rank}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.top5Title}>{it.title}</div>
                    {it.successNote && <div style={s.top5Note}>"{it.successNote}"</div>}
                    {it.platforms.length > 1 && (
                      <div style={s.platformRow}>
                        {it.platforms.map((p, pi) => {
                          const Icon = PLATFORM_ICON[p.key];
                          return (
                            <span key={`${p.key || "?"}-${pi}`} style={s.platformChip}>
                              {Icon && <Icon size={11} color="#5B6472" />} {p.label}: {fmt(p.views)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={s.top5Total}>
                    <Eye size={13} color="#B5790A" style={{ verticalAlign: -2 }} /> {fmt(it.views)}
                    {it.likes ? <span style={s.top5TotalSub}> · {fmt(it.likes)} <ThumbsUp size={11} style={{ verticalAlign: -1 }} /></span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {sections.financial && (
        <Section title="الوضع المالي">
          {financial.paymentTotal ? (
            <div style={s.statRow}>
              <StatBox label="الإجمالي المتفق عليه" value={fmt(financial.paymentTotal)} />
              <StatBox label="المستلم" value={fmt(financial.receivedTotal)} />
              <StatBox label="المتبقي" value={fmt(financial.remainingTotal)} />
            </div>
          ) : (
            <p style={s.pMuted}>مفيش إجمالي متفق عليه مسجل.</p>
          )}
        </Section>
      )}

      {sections.pageTracking && (
        <Section title="تتبع نمو الصفحة">
          {pageTracking.lastSnapshot ? (
            <>
              <p style={s.p}>آخر قياس: {pageTracking.lastSnapshot.followers ?? "؟"} متابع، {pageTracking.lastSnapshot.posts ?? "؟"} بوست بتاريخ {pageTracking.lastSnapshot.date}</p>
              {pageTracking.firstSnapshot && pageTracking.firstSnapshot.id !== pageTracking.lastSnapshot.id && (
                <p style={s.p}>أول قياس مسجل: {pageTracking.firstSnapshot.followers ?? "؟"} متابع بتاريخ {pageTracking.firstSnapshot.date}</p>
              )}
            </>
          ) : (
            <p style={s.pMuted}>مفيش قياسات مسجلة لصفحة البراند لسه.</p>
          )}
        </Section>
      )}

      <div style={s.footer}>تقرير تم إنشاؤه بواسطة ContentST — {reportDate}</div>
    </div>
  );
}

const s = {
  page: {
    width: REPORT_WIDTH, background: "#FFFFFF", color: "#1A1A1A",
    fontFamily: "'Tajawal', sans-serif", padding: "36px 44px 28px", boxSizing: "border-box",
  },
  header: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    paddingBottom: 20, marginBottom: 18, borderBottom: "2px solid #FF6A3D",
  },
  headerMeta: { textAlign: "left" },
  reportKicker: { fontSize: 11, fontWeight: 700, color: "#B5790A", letterSpacing: "0.03em" },
  brandName: { fontSize: 22, fontWeight: 800, color: "#151A24", marginTop: 4 },
  reportDate: { fontSize: 11.5, color: "#5B6472", marginTop: 2 },

  section: { marginBottom: 22, breakInside: "avoid" },
  sectionTitle: {
    fontSize: 14, fontWeight: 800, color: "#151A24", margin: "0 0 10px",
    paddingBottom: 6, borderBottom: "1px solid #E4E7EE",
  },
  sectionBody: {},
  p: { fontSize: 12.5, color: "#1A1A1A", lineHeight: 1.8, margin: "0 0 6px" },
  pMuted: { fontSize: 12, color: "#8A93A1", lineHeight: 1.7, margin: 0 },

  statRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  statBox: {
    minWidth: 110, flex: "1 1 110px", background: "#F7F8FB", border: "1px solid #E4E7EE",
    borderRadius: 8, padding: "10px 12px", textAlign: "center",
  },
  statValue: { fontSize: 17, fontWeight: 800, color: "#151A24" },
  statLabel: { fontSize: 10.5, color: "#5B6472", marginTop: 3 },

  table: { width: "100%", borderCollapse: "collapse" },
  tdLabel: { fontSize: 12.5, color: "#1A1A1A", padding: "6px 0", borderBottom: "1px solid #F0F1F5", fontWeight: 700 },
  tdValue: { fontSize: 12.5, color: "#5B6472", padding: "6px 0", borderBottom: "1px solid #F0F1F5", textAlign: "left" },

  top5List: { display: "flex", flexDirection: "column", gap: 8 },
  top5Row: {
    display: "flex", alignItems: "flex-start", gap: 10, background: "#F7F8FB",
    border: "1px solid #E4E7EE", borderRadius: 8, padding: "10px 12px",
  },
  top5Rank: {
    width: 20, height: 20, borderRadius: 6, background: "#FFFFFF", border: "1px solid #E4E7EE",
    color: "#B5790A", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  top5Title: { fontSize: 13, fontWeight: 700, color: "#151A24" },
  top5Note: { fontSize: 10.5, color: "#8A93A1", marginTop: 2, fontStyle: "italic" },
  platformRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
  platformChip: {
    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600,
    color: "#5B6472", background: "#FFFFFF", border: "1px solid #E4E7EE", borderRadius: 999, padding: "2px 8px",
  },
  top5Total: { fontSize: 12.5, fontWeight: 800, color: "#151A24", whiteSpace: "nowrap", flexShrink: 0 },
  top5TotalSub: { fontSize: 11, fontWeight: 600, color: "#5B6472" },

  footer: { marginTop: 26, paddingTop: 14, borderTop: "1px solid #E4E7EE", fontSize: 10.5, color: "#8A93A1", textAlign: "center" },
};
