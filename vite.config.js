import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      // التسجيل بقى بيتم يدويًا جوه React عن طريق useRegisterSW (src/UpdatePrompt.jsx)
      // عشان نقدر نعرض بانر "تحديث متاح" ونتحكم في وقت الـ reload، فمفيش داعي
      // للـ <script> التلقائي اللي كان بيسجل الـ Service Worker من غير ما نتحكم فيه.
      injectRegister: false,
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "ContentST",
        short_name: "ContentST",
        description: "نظام إدارة براندات ومحتوى وتقويم نشر",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        display: "standalone",
        background_color: "#080B14",
        theme_color: "#080B14",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // كاش أساسي للملفات الثابتة عشان الفتح يبقى سريع؛ البيانات نفسها بتيجي من Supabase أونلاين
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
    }),
  ],
});
