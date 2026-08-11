// Vercel Serverless Function — بيشتغل على السيرفر بس، مش في المتصفح
// عشان مفتاح Refetcher يفضل مخفي وميقدرش حد يشوفه أو يسرقه من الموقع

// Refetcher's real response envelope wraps every target in a `results[]`
// array (not a flat top-level object), and different platforms use
// different metric field names for the same concept. This is the one
// place that gap is bridged — everything downstream (frontend state,
// TicketCard/ItemModal) keeps receiving the same flat
// { ok, platform, views, likes, comments, shares, saves } shape as before.
//
// Confirmed against Refetcher's published docs (refetcher.com/docs.html):
//   {
//     success, requestId, summary: {...},
//     results: [{
//       url, platform, success,
//       metrics: { views, plays, likes, reactions, comments, topLevelComments, shares, saves, ... },
//       metricAvailability: {...},
//       error: { category, message }   // present when success === false
//     }],
//     totalMs
//   }
// A metric that's genuinely unsupported for that platform/content type is
// `null` in Refetcher's own response — we pass that through as `null`,
// never as 0.
function normalizeSocialMetrics(result) {
  const m = result?.metrics || {};
  return {
    platform: result?.platform ?? null,
    // Facebook video content sometimes reports the play count as `plays`
    // instead of `views` (views is `null`/"not_applicable" for that case).
    views: m.views ?? m.plays ?? null,
    // Facebook's total reaction count (`reactions`) is the closest
    // equivalent to "likes" when the platform doesn't expose `likes`
    // directly (Facebook does expose both — prefer the explicit one).
    likes: m.likes ?? m.reactions ?? null,
    comments: m.comments ?? m.topLevelComments ?? null,
    shares: m.shares ?? null,
    saves: m.saves ?? null,
  };
}

const ERROR_MESSAGES = {
  bad_url: "اللينك ده مش صحيح، تأكد إنه لينك حقيقي لمنشور أو فيديو.",
  private_or_removed: "المنشور ده خاص أو اتمسح، مقدرناش نوصله.",
  missing_metrics: "المنشور ده موجود بس مفيش إحصائيات متاحة له.",
  rate_limited: "الخدمة مشغولة دلوقتي، جرب تاني بعد شوية.",
  timeout: "الطلب خد وقت طويل قوي، جرب تاني.",
  upstream_error: "حصلت مشكلة من عند مزوّد البيانات، جرب تاني.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "طريقة الطلب مش مدعومة." });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ ok: false, message: "لازم تبعت لينك صحيح." });
  }

  const apiKey = process.env.REFETCHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      message: "مفيش مفتاح Refetcher متظبط على السيرفر. راجع Environment Variables في Vercel.",
    });
  }

  let data;
  try {
    const refetcherRes = await fetch("https://api.refetcher.com/", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    data = await refetcherRes.json();

    if (!refetcherRes.ok) {
      return res.status(refetcherRes.status).json({
        ok: false,
        message: data?.message || "معرفناش نجيب بيانات المنشور ده — تأكد إن اللينك صحيح وعام.",
      });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, message: "حصلت مشكلة في الاتصال بالخدمة، جرب تاني." });
  }

  // Normalization happens outside the network try/catch on purpose: a
  // thrown error here means the *shape* of a successful HTTP response
  // didn't match what we expect, not a network failure — worth its own
  // message and its own server-side log, never silently shown as success.
  try {
    const result = Array.isArray(data?.results) ? data.results[0] : null;

    if (!result) {
      console.error("[analyze-video] unexpected Refetcher response shape:", JSON.stringify(data)?.slice(0, 500));
      return res.status(502).json({
        ok: false,
        message: "تم الحصول على البيانات ولكن تعذر قراءة الإحصائيات.",
      });
    }

    if (result.success === false) {
      const category = result.error?.category;
      return res.status(200).json({
        ok: false,
        message: ERROR_MESSAGES[category] || result.error?.message || "معرفناش نجيب بيانات المنشور ده.",
      });
    }

    const normalized = normalizeSocialMetrics(result);
    return res.status(200).json({ ok: true, ...normalized });
  } catch (e) {
    console.error("[analyze-video] normalization failed:", e?.message);
    return res.status(502).json({
      ok: false,
      message: "تم الحصول على البيانات ولكن تعذر قراءة الإحصائيات.",
    });
  }
}
