// Vercel Serverless Function — بيشتغل على السيرفر بس، مش في المتصفح
// عشان مفتاح Refetcher يفضل مخفي وميقدرش حد يشوفه أو يسرقه من الموقع

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

  try {
    const refetcherRes = await fetch("https://api.refetcher.com/", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    const data = await refetcherRes.json();

    if (!refetcherRes.ok) {
      return res.status(refetcherRes.status).json({
        ok: false,
        message: data?.message || "معرفناش نجيب بيانات المنشور ده — تأكد إن اللينك صحيح وعام.",
      });
    }

    const metrics = data?.metrics || {};
    return res.status(200).json({
      ok: true,
      platform: data?.platform || null,
      views: metrics.views ?? null,
      likes: metrics.likes ?? null,
      comments: metrics.comments ?? null,
      shares: metrics.shares ?? null,
      saves: metrics.saves ?? null,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "حصلت مشكلة في الاتصال بالخدمة، جرب تاني." });
  }
}
