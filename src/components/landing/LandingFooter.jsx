import React from "react";
import { Logo } from "../Logo";
import { landing } from "./tokens";

const COLUMNS = [
  { title: "المنتج", links: [{ label: "المميزات", href: "#features" }, { label: "كيف يعمل؟", href: "#how-it-works" }, { label: "الأسعار", href: "#pricing" }] },
  { title: "الدعم", links: [{ label: "الأسئلة الشائعة", href: "#faq" }, { label: "تسجيل الدخول", href: "/login" }] },
  { title: "قانوني", links: [{ label: "الخصوصية", href: "#" }, { label: "الشروط", href: "#" }] },
];

export default function LandingFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.top}>
          <div style={styles.brandCol}>
            <Logo height={22} variant="dark" />
            <p style={styles.tagline}>خطط، أنشئ، حلّل، وطوّر محتواك من مكان واحد.</p>
          </div>
          <div style={styles.linksGrid}>
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div style={styles.colTitle}>{col.title}</div>
                <div style={styles.colLinks}>
                  {col.links.map((l) => (
                    <a key={l.label} href={l.href} style={styles.link}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.bottom}>
          <span>© {new Date().getFullYear()} ContentST — كل الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: { borderTop: `1px solid ${landing.border}`, background: landing.surface },
  inner: { maxWidth: 1160, margin: "0 auto", padding: "48px 24px 28px" },
  top: { display: "flex", justifyContent: "space-between", gap: 40, flexWrap: "wrap" },
  brandCol: { maxWidth: 260 },
  tagline: { fontSize: 12.5, color: landing.textDim, lineHeight: 1.7, margin: "14px 0 0" },
  linksGrid: { display: "flex", gap: 48, flexWrap: "wrap" },
  colTitle: { fontSize: 12, fontWeight: 800, color: landing.text, marginBottom: 12 },
  colLinks: { display: "flex", flexDirection: "column", gap: 9 },
  link: { fontSize: 12.5, color: landing.textDim, textDecoration: "none" },
  bottom: {
    marginTop: 40, paddingTop: 20, borderTop: `1px solid ${landing.border}`,
    fontSize: 11.5, color: landing.textFaint, textAlign: "center",
  },
};
