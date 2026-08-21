import React from "react";
import { InsightsMockup } from "./DashboardMockup";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

export default function AnalyticsShowcase() {
  const { t } = useLanguage();
  return (
    <section style={styles.section}>
      <div style={styles.grid} className="landing-split-grid landing-split-grid-reverse">
        <div style={styles.visualCol}>
          <InsightsMockup />
        </div>
        <div style={styles.textCol}>
          <div style={styles.eyebrow}>Brand Insights</div>
          <h2 style={styles.title}>
            {t("مش بس تعرف المحتوى جاب كام.")}
            <br />
            <span style={styles.accent}>{t("اعرف ليه نجح.")}</span>
          </h2>
          <p style={styles.desc}>
            {t("ContentST يجمع أداء محتواك ويعرضه بطريقة تساعدك على اتخاذ قرارات أفضل.")}
          </p>
          <div style={styles.statsRow}>
            <div><div style={styles.statValue}>24</div><div style={styles.statLabel}>{t("محتوى تم تحليله")}</div></div>
            <div><div style={styles.statValue}>248.6K</div><div style={styles.statLabel}>{t("إجمالي المشاهدات")}</div></div>
            <div><div style={styles.statValue}>12.4K</div><div style={styles.statLabel}>{t("إجمالي التفاعل")}</div></div>
          </div>
          <p style={styles.demoNote}>{t("* بيانات براند تجريبي (Nova Studio) للتوضيح فقط")}</p>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  grid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "center" },
  textCol: {},
  eyebrow: { fontSize: 12.5, fontWeight: 800, color: landing.red, marginBottom: 12, direction: "ltr" },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0, lineHeight: 1.35, textWrap: "balance" },
  accent: {
    background: landing.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  },
  desc: { fontSize: 14.5, color: landing.textDim, lineHeight: 1.8, margin: "16px 0 24px", maxWidth: 420 },
  statsRow: { display: "flex", gap: 32 },
  statValue: { fontSize: 24, fontWeight: 800, color: landing.text },
  statLabel: { fontSize: 11.5, color: landing.textFaint, marginTop: 4 },
  demoNote: { fontSize: 11, color: landing.textFaint, marginTop: 20 },
  visualCol: {},
};
