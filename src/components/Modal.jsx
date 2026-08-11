import React, { useEffect } from "react";
import { X } from "lucide-react";
import { colors, radius, zIndex, shadows } from "../theme";

/**
 * Shared modal shell — same visual footprint as the app's existing
 * ModalShell, plus Escape-to-close and a titled header slot. Existing
 * modal bodies (BrandModal, ItemModal, etc.) can adopt this incrementally;
 * it does not change what any of them do.
 */
export default function Modal({ onClose, title, wide, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="cs-animate-fade"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3,5,12,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex.modal,
        padding: 20,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="scrollbar cs-animate-scale"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: wide ? 520 : 420,
          maxHeight: "85vh",
          overflowY: "auto",
          background: colors.surface,
          border: `1px solid ${colors.borderStrong}`,
          borderRadius: radius.lg,
          padding: 20,
          boxShadow: shadows.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: colors.text }}>{title}</span>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="cs-icon-btn"
              style={{
                width: 28, height: 28, borderRadius: radius.sm, background: colors.card,
                border: `1px solid ${colors.border}`, color: colors.textDim, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
