// قاموس ترجمة واحد للتطبيق كله — المفتاح هو النص العربي الأصلي زي ما هو
// مكتوب في الكود، والقيمة هي الترجمة الإنجليزية. اختيار النص العربي نفسه
// كمفتاح (بدل اختراع مفاتيح زي "nav.home") يخلي لف أي سطر بـ t("...") تغيير
// ميكانيكي بسيط من غير خطر اختلاف بين المفتاح وتعريفه، ولو نص متترجمش لسه
// بيرجع عربي صح تلقائي بدل ما يبوّظ الصفحة.
export const translations = {
  en: {
    // ===== Sidebar =====
    "ContentST": "ContentST",
    "بيحفظ...": "Saving...",
    "متزامن": "Synced",
    "اقفل القائمة": "Close menu",
    "فعّل تنبيهات الديدلاين": "Enable deadline alerts",
    "الرئيسية": "Dashboard",
    "التقويم العام": "Global calendar",
    "بحث في كل الأفكار": "Search all ideas",
    "مقارنة البراندات": "Compare brands",
    "الاشتراك والباقة": "Subscription & plan",
    "اشترك دلوقتي": "Subscribe now",
    "رقّي باقتك": "Upgrade your plan",
    "البراندات": "Brands",
    "مفيش باقة مسجلة": "No plan on file",
    "ضيف براند": "Add brand",
    "لسه مفيش براندات. دوس + عشان تضيف أول واحد.": "No brands yet. Tap + to add your first one.",
    "امسح البراند": "Delete brand",
    "تسجيل خروج": "Sign out",

    // ===== Top header =====
    "افتح القائمة الجانبية": "Open sidebar",
    "تبديل المظهر": "Toggle theme",
    "يحتاج انتباهك": "Needs your attention",
    "تجربة مجانية": "Free trial",
    "باقة": "Plan",
    "مفيش حاجة مستعجلة دلوقتي 👍": "Nothing urgent right now 👍",
    "تبديل اللغة": "Switch language",
    "مستخدم": "User",

    // ===== Status labels (STATUS_DEFS) =====
    "فكرة جديدة": "New idea",
    "جاهزة": "Ready",
    "مجدولة": "Scheduled",
    "اتنشرت": "Published",

    // ===== Common action words (reused everywhere) =====
    "حفظ": "Save",
    "احفظ": "Save",
    "إلغاء": "Cancel",
    "تعديل": "Edit",
    "حذف": "Delete",
    "إضافة": "Add",
    "تأكيد": "Confirm",
    "بحث": "Search",
    "تحميل...": "Loading...",
    "جاري الحفظ...": "Saving...",
    "بيحمّل...": "Loading...",
    "آخر يوم في فترة التجربة المجانية": "Last day of your free trial",
    "بيحمّل الاستوديو...": "Loading your workspace...",

    // ===== Auth (login / signup / forgot password) =====
    "اسم المستخدم لازم يكون من 3 لـ 30 حرف، وحروف إنجليزي صغيرة أو أرقام أو _ بس (من غير مسافات).":
      "Username must be 3-30 characters, lowercase letters/numbers/underscores only (no spaces).",
    "كلمة المرور وتأكيدها مش متطابقين.": "Password and confirmation don't match.",
    "تم إرسال رابط تغيير كلمة المرور على الإيميل. افتح أحدث رسالة واضغط على الرابط.":
      "A password reset link has been sent to your email. Open the latest message and click the link.",
    "اتسجل حسابك. لو الإيميل محتاج تأكيد هتلاقي رسالة في بريدك — افتحها وبعدين رجع سجّل دخول.":
      "Your account has been created. If email confirmation is required, check your inbox — then come back and log in.",
    "حصلت مشكلة، جرب تاني.": "Something went wrong, please try again.",
    "سجّل دخول عشان تكمّل شغلك": "Log in to continue your work",
    "اعمل حساب جديد": "Create a new account",
    "استرجع حسابك": "Recover your account",
    "اسم المستخدم": "Username",
    "اسم مستخدم فريد (حروف إنجليزي وأرقام و_)": "A unique username (letters, numbers, _)",
    "الإيميل": "Email",
    "الباسورد": "Password",
    "على الأقل 6 حروف/أرقام": "At least 6 characters",
    "تأكيد الباسورد": "Confirm password",
    "اكتب الباسورد تاني": "Re-enter your password",
    "سجّل دخول": "Log in",
    "اعمل حساب": "Create account",
    "ابعت رابط تغيير الباسورد": "Send password reset link",
    "نسيت كلمة المرور؟": "Forgot your password?",
    "رجوع لتسجيل الدخول": "Back to login",
    "لسه معملتش حساب؟ اعمل واحد": "Don't have an account yet? Create one",
    "عندك حساب بالفعل؟ سجّل دخول": "Already have an account? Log in",

    // ===== Landing navbar =====
    "المنتج": "Product",
    "المميزات": "Features",
    "كيف يعمل؟": "How it works",
    "الأسعار": "Pricing",
    "تسجيل الدخول": "Log in",
    "ابدأ مجانًا": "Start for free",
    "اقفل القائمة": "Close menu",
    "افتح القائمة": "Open menu",
  },
};

export function translate(arabicText, lang) {
  if (lang !== "en") return arabicText;
  const dict = translations.en;
  if (arabicText in dict) return dict[arabicText];
  return arabicText;
}
