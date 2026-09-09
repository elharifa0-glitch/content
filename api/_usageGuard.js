// Shared helper for api/analyze-video.js and api/generate-caption.js — both
// call a metered third-party API (Refetcher / Gemini) and, before this
// file existed, had no authentication check at all: anyone on the internet
// could call either endpoint directly (curl, etc.) with no ContentST
// account, consuming the paid API budget. This adds two layers:
//   1. The caller must be a real signed-in ContentST user (their Supabase
//      access token, verified against Supabase Auth).
//   2. A simple per-user, per-day call cap via the check_and_increment_api_usage
//      Postgres function (see supabase-schema.sql), so one account can't
//      call an endpoint an unlimited number of times per day either.
//
// Files starting with "_" under /api are not turned into routes by Vercel,
// so this is safe to import from the two real endpoint files without
// becoming a public URL itself.
//
// IMPORTANT ASSUMPTION: the daily limits below are NOT based on actual
// Refetcher/Gemini pricing or rate limits — this codebase has no visibility
// into either provider's real cost per call. They're conservative,
// generous-for-normal-use placeholder numbers meant only to stop obvious,
// open-ended abuse. Tune them once real usage/cost data is available.
import { createClient } from "@supabase/supabase-js";

export const DAILY_LIMITS = {
  analyze_video: 40,
  generate_caption: 60,
};

export async function checkUsage(req, endpoint) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return { ok: false, status: 401, message: "لازم تكون مسجل دخول عشان تستخدم الميزة دي." };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase config missing on the server for some reason — fail open
    // rather than break the whole feature, mirroring the app's existing
    // fail-open philosophy for infra hiccups (see App.jsx's checkSubscription).
    console.error(`[${endpoint}] Supabase env vars missing on the server, skipping usage check`);
    return { ok: true };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, message: "الجلسة انتهت أو مش صحيحة، سجّل دخول تاني." };
  }

  const { data: usage, error: usageErr } = await supabase.rpc("check_and_increment_api_usage", {
    p_endpoint: endpoint,
    p_daily_limit: DAILY_LIMITS[endpoint],
  });

  if (usageErr) {
    // Most likely cause: the Supabase project hasn't run the latest
    // supabase-schema.sql yet, so check_and_increment_api_usage doesn't
    // exist. Fail open rather than break the feature for every user over a
    // missing migration — same reasoning as the brand-share "function not
    // found" handling elsewhere in this app.
    console.error(`[${endpoint}] usage RPC failed, failing open:`, usageErr.message);
    return { ok: true };
  }

  if (!usage?.ok) {
    return { ok: false, status: 429, message: usage?.message || "وصلت للحد الأقصى المسموح بيه اليوم." };
  }

  return { ok: true };
}
