import React from "react";
import { colors } from "../theme";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
        padding: "32px 16px",
        color: colors.textFaint,
      }}
    >
      {icon && (
        <div
          style={{
            width: 40, height: 40, borderRadius: 12, background: colors.card,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.textDim, marginBottom: 6,
          }}
        >
          {icon}
        </div>
      )}
      {title && <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textDim }}>{title}</div>}
      {description && <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 320 }}>{description}</div>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}
