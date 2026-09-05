// Vercel Serverless Function — بيشتغل على السيرفر بس، نفس فكرة
// api/analyze-video.js بالظبط، عشان مفتاح Gemini يفضل مخفي وميوصلش
// للمتصفح أبدًا.

const GEMINI_MODEL = "gemini-2.0-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "طريقة الطلب مش مدعومة." });
  }

  const { brandName, type, title, notes, existingHashtags } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, message: "محتاج عنوان الفكرة الأول." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      message: "مفيش مفتاح Gemini متظبط على السيرفر. راجع Environment Variables في Vercel.",
    });
  }

  const prompt = [
    `إنت مساعد كتابة محتوى سوشيال ميديا لبراند اسمه "${(brandName || "البراند").toString().trim()}".`,
    `اكتب كابشن جذاب باللهجة المصرية العامية (مش فصحى) لمحتوى نوعه "${(type || "بوست").toString().trim()}" بعنوان: "${title.trim()}".`,
    notes && notes.trim() ? `ملاحظات إضافية عن الفكرة: ${notes.trim()}` : "",
    existingHashtags && existingHashtags.trim() ? `هاشتاجات البراند التلقائية (ضيف اللي مناسب منها): ${existingHashtags.trim()}` : "",
    "",
    "رجّع النتيجة كـ JSON بالشكل ده بالظبط، من غير أي نص زيادة قبله أو بعده:",
    `{"caption": "نص الكابشن هنا", "hashtags": ["#هاشتاج1", "#هاشتاج2"]}`,
    "الكابشن يكون قصير وجذاب (سطرين لـ 4 أسطر)، وعدد الهاشتاجات من 5 لـ 8 هاشتاجات متعلقة بالموضوع.",
  ].filter(Boolean).join("\n");

  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
        }),
      }
    );

    const data = await aiRes.json();

    if (!aiRes.ok) {
      return res.status(aiRes.status).json({
        ok: false,
        message: data?.error?.message || "حصلت مشكلة في الاتصال بخدمة الذكاء الاصطناعي، جرب تاني.",
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("[generate-caption] non-JSON response:", raw?.slice?.(0, 300));
      return res.status(502).json({ ok: false, message: "تعذّر قراءة رد الذكاء الاصطناعي، جرب تاني." });
    }

    if (!parsed?.caption) {
      return res.status(502).json({ ok: false, message: "معرفناش نجيب كابشن، جرب تاني." });
    }

    return res.status(200).json({
      ok: true,
      caption: String(parsed.caption).trim(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h) => String(h)).slice(0, 10) : [],
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "حصلت مشكلة في الاتصال، جرب تاني." });
  }
}
