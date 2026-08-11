import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { colors, radius, shadows, zIndex } from "../theme";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 size={15} color={colors.good} />,
  error: <AlertTriangle size={15} color={colors.danger} />,
  info: <Info size={15} color={colors.status.ready} />,
};

/**
 * Lightweight toast system (provider + hook). Not wired into any save/error
 * flow yet — introduced here so later steps (Dashboard, Auth, forms) have a
 * consistent feedback primitive to adopt instead of the ad hoc inline
 * <p> success/error text used throughout today.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, { tone = "info", duration = 3200 } = {}) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        style={{
          position: "fixed", bottom: 20, insetInlineEnd: 20, zIndex: zIndex.toast,
          display: "flex", flexDirection: "column", gap: 8, width: 300, maxWidth: "calc(100vw - 40px)",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="cs-animate-fade"
            style={{
              display: "flex", alignItems: "flex-start", gap: 9,
              background: colors.surface, border: `1px solid ${colors.borderStrong}`,
              borderRadius: radius.md, padding: "11px 12px", boxShadow: shadows.lg,
              fontSize: 12.5, color: colors.text, lineHeight: 1.6,
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[t.tone] || ICONS.info}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="إغلاق"
              style={{ background: "transparent", border: "none", color: colors.textFaint, cursor: "pointer", padding: 2, flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
