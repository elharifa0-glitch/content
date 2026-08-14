import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { colors, radius, shadows } from "./theme";

// بانر صغير وغير مزعج بيظهر بس لما نسخة جديدة من الأداة تكون جاهزة على
// السيرفر (Service Worker جديد نزل واستنى). ما بيعملش أي حاجة لوحده —
// المستخدم هو اللي بيضغط "تحديث"، فمفيش reload غير متوقع ممكن يضيع حاجة
// المستخدم لسه بيكتبها. لحد ما يضغط، الأداة شغالة عادي بالنسخة القديمة.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // التابات المفتوحة لفترة طويلة (خصوصًا في وضع PWA المثبت) ممكن متعملش
      // تنقل بين الصفحات أبدًا، وده الوقت اللي المتصفح بيفحص فيه نسخة جديدة
      // من الـ Service Worker. الفحص الدوري ده بيضمن إن حتى تاب فاضل مفتوح
      // ساعات هيكتشف تحديث جديد لوحده، من غير ما يحتاج المستخدم يقفل ويفتح.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={styles.wrap} dir="rtl">
      <span style={styles.text}>يتوفر إصدار جديد من ContentST</span>
      <button style={styles.btn} onClick={() => updateServiceWorker(true)}>
        تحديث
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 18,
    insetInlineStart: 18,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: colors.card,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: radius.md,
    padding: "10px 12px 10px 16px",
    boxShadow: shadows.lg,
    fontFamily: "'Tajawal', sans-serif",
    maxWidth: "calc(100vw - 36px)",
  },
  text: {
    fontSize: 12.5,
    fontWeight: 700,
    color: colors.text,
    whiteSpace: "nowrap",
  },
  btn: {
    flexShrink: 0,
    background: colors.warning,
    border: "none",
    color: colors.onAccent,
    fontSize: 12.5,
    fontWeight: 800,
    borderRadius: radius.sm,
    padding: "7px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
