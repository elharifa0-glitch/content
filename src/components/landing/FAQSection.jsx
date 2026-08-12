import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { landing } from "./tokens";

const FAQS = [
  { q: "هل أحتاج بطاقة ائتمانية؟", a: "لأ، تقدر تبدأ تجربتك المجانية وتستخدم ContentST بالكامل من غير ما تدخل أي بيانات دفع." },
  { q: "ما المنصات التي يدعمها ContentST؟", a: "بيدعم تحليل المحتوى من Instagram وTikTok وFacebook وYouTube." },
  { q: "هل أستطيع إدارة أكثر من براند؟", a: "أيوه، تقدر تضيف أكتر من براند وكل براند بيبقى له أفكاره ومحتواه وتحليله الخاص، منفصل تمامًا عن باقي البراندات." },
  { q: "هل يمكنني تحليل محتوى منشور بالفعل؟", a: "أيوه، تقدر تلصق رابط أي Reel أو Post أو Video منشور بالفعل وتحلل أداءه بالأرقام الحقيقية." },
  { q: "هل التحليل مرتبط بالأفكار؟", a: "الربط اختياري — تقدر تحلل أي رابط بشكل مستقل، أو تربطه بفكرة موجودة عندك لو حابب تتابع أداء فكرة معينة." },
  { q: "هل يمكنني حذف أو تحديث التحليل؟", a: "أيوه، تقدر تغيّر الفكرة المرتبطة بالتحليل، تلغي الربط، أو تمسح التحليل نهائيًا في أي وقت." },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" style={styles.section}>
      <div style={styles.head}>
        <h2 style={styles.title}>أسئلة شائعة</h2>
      </div>

      <div style={styles.list}>
        {FAQS.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={f.q} style={styles.item}>
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                style={styles.question}
                aria-expanded={isOpen}
              >
                <span>{f.q}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0 }} />
              </button>
              {isOpen && <p style={styles.answer}>{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  section: { maxWidth: 760, margin: "0 auto", padding: "64px 24px" },
  head: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 800, color: landing.text, margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  item: { background: landing.surface, border: `1px solid ${landing.border}`, borderRadius: 12, overflow: "hidden" },
  question: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    background: "transparent", border: "none", padding: "16px 18px", fontSize: 14, fontWeight: 700,
    color: landing.text, cursor: "pointer", textAlign: "right", fontFamily: "inherit",
  },
  answer: { fontSize: 13, color: landing.textDim, lineHeight: 1.8, margin: 0, padding: "0 18px 18px" },
};
