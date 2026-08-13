import React, { useRef } from "react";

// Single source of truth for the ContentST mark, mirrored in the standalone
// assets at /public/brand/contentst-icon.svg and contentst-logo.svg (used for
// the favicon and any context outside React). Inline SVG here — rather than
// <img src="..."> — so gradient ids stay unique per instance and the wordmark
// color can be set explicitly per background (SVGs loaded via <img> render in
// an isolated document and can't inherit page CSS).
let gradientSeq = 0;

function useGradientId(prefix) {
  const ref = useRef(null);
  if (!ref.current) {
    gradientSeq += 1;
    ref.current = `${prefix}-${gradientSeq}`;
  }
  return ref.current;
}

/** Standalone "ST" badge — favicon, avatar, small UI logo. */
export function LogoIcon({ size = 32, style, className }) {
  const gradId = useGradientId("cst-icon-grad");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="ContentST" style={style} className={className}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="10" x2="88" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9F2D" />
          <stop offset="1" stopColor="#FF4D3D" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="88" height="88" rx="23" fill={`url(#${gradId})`} />
      <path d="M42,28 L18,28 L18,50 L42,50 L42,72 L18,72" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50,28 L82,28 M66,28 L66,72" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Full wordmark — CONTENT [ST]. `variant` picks the CONTENT text color for the background it sits on. */
export function Logo({ height = 28, variant = "dark", style, className }) {
  const gradId = useGradientId("cst-logo-grad");
  const textColor = variant === "light" ? "#FFFFFF" : "#151A24";
  const width = Math.round((420 / 120) * height);
  return (
    <svg width={width} height={height} viewBox="0 0 420 120" role="img" aria-label="ContentST — Content Studio" style={style} className={className}>
      <defs>
        <linearGradient id={gradId} x1="316" y1="14" x2="392" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9F2D" />
          <stop offset="1" stopColor="#FF4D3D" />
        </linearGradient>
      </defs>
      <text
        x="2" y="61"
        fontFamily="Arial, 'Helvetica Neue', Helvetica, sans-serif"
        fontSize="50" fontWeight="800" letterSpacing="0.5"
        dominantBaseline="central" fill={textColor}
        direction="ltr"
        style={{ direction: "ltr", fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        CONTENT
      </text>
      <g transform="translate(304,10)">
        <rect x="6" y="6" width="88" height="88" rx="23" fill={`url(#${gradId})`} />
        <path d="M42,28 L18,28 L18,50 L42,50 L42,72 L18,72" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,28 L82,28 M66,28 L66,72" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
