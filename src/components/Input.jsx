import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { colors, radius, transitions } from "../theme";

export const fieldBaseStyle = {
  width: "100%",
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  color: colors.text,
  padding: "10px 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
};

/**
 * Shared text-field primitive with an optional label / hint / error slot.
 * Select and Textarea reuse the same visual language via `fieldBaseStyle`
 * rather than being separate components.
 */
export default function Input({ label, hint, error, style, id, type, ...rest }) {
  const inputId = id || rest.name;
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} style={{ display: "block", fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          id={inputId}
          type={isPassword && reveal ? "text" : type}
          className="cs-input"
          style={{
            ...fieldBaseStyle,
            ...(isPassword ? { paddingInlineEnd: 38 } : {}),
            ...(error ? { borderColor: colors.danger } : {}),
            ...style,
          }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            tabIndex={-1}
            aria-label={reveal ? "إخفاء الباسورد" : "إظهار الباسورد"}
            style={{
              position: "absolute", insetInlineEnd: 6, top: "50%", transform: "translateY(-50%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, background: "transparent", border: "none",
              color: colors.textFaint, cursor: "pointer", padding: 0,
            }}
          >
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11.5, color: colors.danger, margin: "6px 0 0" }}>{error}</p>}
      {!error && hint && <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "6px 0 0" }}>{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, error, style, id, ...rest }) {
  const inputId = id || rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} style={{ display: "block", fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className="cs-input"
        style={{ ...fieldBaseStyle, minHeight: 80, resize: "vertical", ...(error ? { borderColor: colors.danger } : {}), ...style }}
        {...rest}
      />
      {error && <p style={{ fontSize: 11.5, color: colors.danger, margin: "6px 0 0" }}>{error}</p>}
      {!error && hint && <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "6px 0 0" }}>{hint}</p>}
    </div>
  );
}
