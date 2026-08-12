// Landing page is a fixed light-mode marketing surface, deliberately not
// wired to ThemeContext — it must look the same regardless of what theme
// the visitor last used inside the dashboard. Values mirror the brand
// palette (theme.js darkPalette.bg for the "dark product UI" mockups).
export const landing = {
  bg: "#F7F8FB",
  surface: "#FFFFFF",
  surfaceAlt: "#FBFAF8",
  border: "#E4E7EE",
  borderStrong: "#D3D8E3",
  text: "#151A24",
  textDim: "#5B6472",
  textFaint: "#8A93A1",

  dark: "#080B14",
  darkSurface: "#0F1424",
  darkCard: "#121729",
  darkBorder: "#1E2740",
  darkText: "#F3F5FA",
  darkTextDim: "#9AA3BF",

  orange: "#FF9F2D",
  red: "#FF4D3D",
  gradient: "linear-gradient(135deg, #FF9F2D 0%, #FF4D3D 100%)",
  gradientSoft: "linear-gradient(135deg, rgba(255,159,45,0.12) 0%, rgba(255,77,61,0.12) 100%)",

  good: "#1F9D63",
  info: "#2E7DAE",
};

export const PLATFORM_COLORS = {
  Instagram: "#D94F9A",
  TikTok: "#151A24",
  Facebook: "#3D5FE0",
  YouTube: "#E0423D",
};
