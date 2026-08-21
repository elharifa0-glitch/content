import React from "react";
import { Lightbulb, Rocket, LineChart, TrendingUp, ArrowLeft } from "lucide-react";
import { landing } from "./tokens";
import { useLanguage } from "../../LanguageContext";

const STEPS = [
  { n: "01", icon: Lightbulb, title: "خطط", desc: "نظّم أفكارك وحوّلها إلى محتوى واضح." },
  { n: "02", icon: Rocket, title: "انشر", desc: "تابع المحتوى من التخطيط حتى النشر." },
  { n: "03", icon: LineChart, title: "حلّل", desc: "حلل أداء الـReels والPosts والفيديوهات بالأرقام الحقيقية." },
  { n: "04", icon: TrendingUp, title: "طوّر", desc: "استخدم البيانات لمعرفة ما يستحق التكرار والتحسين." },
];

export default function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section id="how-it-works" style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>{t("كيف يعمل ContentST؟")}</h2>
        <p style={styles.sub}>{t("من الفكرة إلى نتائج قابلة للقياس في 4 خطوات.")}</p>
      </div>

      <div style={styles.stepsRow} className="landing-steps-row">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={styles.step}>
              <div style={styles.stepNum}>{s.n}</div>
              <div style={styles.stepIcon}><s.icon size={18} color={landing.red} /></div>
              <div style={styles.stepTitle}>{t(s.title)}</div>
              <div style={styles.stepDesc}>{t(s.desc)}</div>
            </div>
            {i < STEPS.length - 1 && <ArrowLeft size={16} color={landing.borderStrong} style={styles.arrow} className="landing-steps-arrow" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 1160, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 44 },
  title: { fontSize: 28, fontWeight: 800, color: landing.text, margin: 0 },
  sub: { fontSize: 14.5, color: landing.textDim, margin: "10px 0 0" },
  stepsRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  step: { flex: 1, minWidth: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  stepNum: { fontSize: 12, fontWeight: 800, color: landing.textFaint, marginBottom: 10, direction: "ltr" },
  stepIcon: {
    width: 46, height: 46, borderRadius: "50%", background: landing.gradientSoft,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  stepTitle: { fontSize: 15.5, fontWeight: 800, color: landing.text, marginBottom: 6 },
  stepDesc: { fontSize: 12.5, color: landing.textDim, lineHeight: 1.7, maxWidth: 200 },
  arrow: { flexShrink: 0, marginTop: 12 },
};
