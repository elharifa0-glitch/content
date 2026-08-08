import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "مفيش VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY متعرفين. " +
    "لازم تحطهم في ملف .env (شوف .env.example) قبل ما تشغل المشروع."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
