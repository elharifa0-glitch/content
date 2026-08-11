import React from "react";
import { colors, radius, transitions, softBg, borderTint } from "../theme";

/**
 * Shared tab row. `items` is [{ key, label, icon }]. Used later by
 * BrandPage's five tabs (board/calendar/insights/payments/reference) and
 * anywhere else the app switches between a small fixed set of views.
 */
export default function Tabs({ items, activeKey, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className="cs-icon-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: active ? softBg.accent : "transparent",
              border: `1px solid ${active ? borderTint.accent : colors.border}`,
              color: active ? colors.text : colors.textDim,
              padding: "8px 14px",
              borderRadius: radius.sm,
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: `all ${transitions.fast}`,
            }}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
