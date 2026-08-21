import React from "react";
import { Check } from "lucide-react";
import { KanbanMockup } from "./DashboardMockup";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

const POINTS = [
  "لوحة أفكار (Kanban) لكل مراحل المحتوى",
  "تقويم نشر يجمع كل البراندات في مكان واحد",
  "تتبّع حالة كل فكرة من التخطيط للنشر",
  "بحث ومقارنة عبر كل المحتوى بضغطة واحدة",
];

export default function ContentShowcase() {
  const { t } = useLanguage();
  return (
    <section style={styles.section}>
      <div style={styles.grid} className="landing-split-grid">
        <div style={styles.textCol}>
          <div style={styles.eyebrow}>Content Pipeline</div>
          <h2 style={styles.title}>{t("من الفكرة لجدول النشر، من غير فوضى.")}</h2>
          <p style={styles.desc}>
            {t("نظّم كل أفكار المحتوى بتاعتك في لوحة واحدة واضحة، وتابع كل فكرة من أول ما تتولد لحد ما تتنشر.")}
          </p>
          <ul style={styles.list}>
            {POINTS.map((p) => (
              <li key={p} style={styles.listItem}>
                <span style={styles.checkWrap}><Check size={12} color="#fff" /></span>
                {t(p)}
              </li>
            ))}
          </ul>
        </div>
        <div style={styles.visualCol}>
          <KanbanMockup />
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 56, alignItems: "center" },
  textCol: {},
  eyebrow: { fontSize: 12.5, fontWeight: 800, color: landing.red, marginBottom: 12, direction: "ltr" },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0, textWrap: "balance" },
  desc: { fontSize: 14.5, color: landing.textDim, lineHeight: 1.8, margin: "16px 0 22px", maxWidth: 440 },
  list: { display: "flex", flexDirection: "column", gap: 12, margin: 0, padding: 0, listStyle: "none" },
  listItem: { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: landing.text, fontWeight: 600 },
  checkWrap: {
    width: 20, height: 20, borderRadius: "50%", background: landing.gradient, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  visualCol: {},
};
