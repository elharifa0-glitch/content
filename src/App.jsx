import React, { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import LandingPage from "./components/landing/LandingPage";
import PrivacyPolicyPage from "./components/landing/PrivacyPolicyPage";
import TermsPage from "./components/landing/TermsPage";
import { useLanguage } from "./LanguageContext";
import { colors, radius, softBg } from "./theme";

// كسول (مش import عادي) عشان زوار اللاندينج بيدج أو شاشة الدخول (أكتر
// حركة مرور فعلية قبل أي تسجيل دخول) ميحملوش كود الداشبورد التقيل معاهم —
// ContentStudio لوحده بيسحب jsPDF وhtml2canvas وrecharts، وده كان السبب
// الرئيسي في حجم الـ bundle الأولي (~1.6 ميجا) اللي بيتحمّل حتى لو الزائر
// لسه ما سجّلش دخول أو بيتصفح اللاندينج بيدج بس.
const ContentStudio = lazy(() => import("./ContentStudio"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const Paywall = lazy(() => import("./Paywall"));
const AccountConfirmed = lazy(() => import("./AccountConfirmed"));
const SharedBrandView = lazy(() => import("./SharedBrandView"));
const AdminPage = lazy(() => import("./AdminPage"));

function LoadingScreen({ label }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: colors.bg,
      color: colors.textDim, fontFamily: "inherit"
    }}>
      {label}
    </div>
  );
}

export default function App() {
  const { dir, t } = useLanguage();
  const pathname = window.location.pathname;
  const shareMatch = pathname.match(/^\/share\/([a-zA-Z0-9]+)/);
  const isSignupPath = pathname === "/signup";
  const isLandingPath = pathname === "/" || pathname === "/landing";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPrivacyPath = pathname === "/privacy";
  const isTermsPath = pathname === "/terms";

  const [session, setSession] = useState(undefined);
  const [isRecovery, setIsRecovery] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [subStatus, setSubStatus] = useState(undefined); // undefined = checking, "allowed" | "blocked"
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isTrialing, setIsTrialing] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
  const [hasSubRow, setHasSubRow] = useState(true);

  useEffect(() => {
    // onAuthStateChange بيبعت أول event بتاعه (INITIAL_SESSION) بالجلسة
    // الحقيقية المتخزنة أول ما الـ client يخلص تهيئته — ده المصدر الوحيد
    // اللي بنعتمد عليه لتحديد حالة الدخول. استدعاء getSession() منفصل هنا
    // كان بيسبب race: لو رجعت null قبل ما onAuthStateChange يوصل (زي وقت
    // تجديد التوكن)، الشاشة كانت بتعرض تسجيل الدخول غلط لحظة الـ refresh،
    // حتى لو الجلسة الحقيقية سليمة وهتوصل بعد شوية.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
        }
        setSession(newSession);
      }
    );

    const hash = window.location.hash;
    if (
      hash.includes("access_token=") &&
      (hash.includes("type=recovery") || hash.includes("type%3Drecovery"))
    ) {
      setIsRecovery(true);
    } else if (
      hash.includes("access_token=") &&
      (hash.includes("type=signup") || hash.includes("type%3Dsignup") ||
       hash.includes("type=email_change") || hash.includes("type%3Demail_change"))
    ) {
      setJustConfirmed(true);
      // نمسح الـ hash من الرابط عشان لو المستخدم عمل refresh متتكررش الشاشة دي
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function checkSubscription(userId) {
    setSubStatus(undefined);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at, current_period_end, plan")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // مفيش سجل اشتراك لسه (مثلاً حساب اتعمل قبل ما نظام الاشتراك يتفعّل)
        // نسمحله يدخل عشان محدش يتقفل بره حسابه بالغلط
        setHasSubRow(false);
        setSubStatus("allowed");
        return;
      }

      setHasSubRow(true);
      const now = new Date();
      const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;

      const isActive = data.status === "active" && (!periodEnd || periodEnd > now);
      const trialing = data.status === "trial" && trialEnd && trialEnd > now;

      setTrialEndsAt(data.trial_ends_at);
      setCurrentPeriodEnd(data.current_period_end || null);
      setTrialDaysLeft(trialing ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : null);
      setPlan(data.plan || null);
      setIsTrialing(trialing);
      setSubStatus(isActive || trialing ? "allowed" : "blocked");
    } catch (e) {
      console.error("تعذر التحقق من الاشتراك", e);
      // في حالة أي مشكلة اتصال، نسمح بالدخول بدل ما نقفل حساب حقيقي بالغلط
      setSubStatus("allowed");
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      checkSubscription(session.user.id);
    }
  }, [session?.user?.id]);

  async function handleSignOut() {
    // بنغيّر المسار لـ "/" الأول قبل الـ signOut عشان لما session تبقى null
    // وال component يعمل re-render، isLandingPath يبقى true ويوديه على
    // اللاندينج بيدج مباشرة بدل ما يرجع على شاشة تسجيل الدخول.
    window.history.replaceState(null, "", "/");
    await supabase.auth.signOut();
    setIsRecovery(false);
  }

  // لينك مشاركة براند شغال لأي حد من غير تسجيل دخول خالص، ومن غير ما ينتظر
  // أي فحص جلسة أو اشتراك — بيتحقق من مساره الأول قبل أي حاجة تانية
  if (shareMatch) {
    return (
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <SharedBrandView token={shareMatch[1]} />
      </Suspense>
    );
  }

  // صفحات قانونية ثابتة، متاحة سواء المستخدم داخل جلسة أو لأ — مفيش داعي
  // نستنى فحص session/subscription عشانها.
  if (isPrivacyPath) return <PrivacyPolicyPage />;
  if (isTermsPath) return <TermsPage />;

  if (isRecovery) {
    return (
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <ResetPassword
          onDone={async () => {
            setIsRecovery(false);
            await supabase.auth.signOut();
          }}
        />
      </Suspense>
    );
  }

  if (justConfirmed) {
    return (
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <AccountConfirmed onContinue={() => setJustConfirmed(false)} />
      </Suspense>
    );
  }

  if (session === undefined) {
    return <LoadingScreen label={t("بيحمّل...")} />;
  }

  if (!session) {
    if (isLandingPath) return <LandingPage />;
    if (isSignupPath) return <Auth initialMode="signup" />;
    return <Auth initialMode="login" />;
  }

  // صفحة الأدمن بتتفتح بمجرد ما فيه جلسة حقيقية، من غير ما تستنى فحص
  // الاشتراك أو تتقفل بالـ Paywall — التحقق الحقيقي إن الشخص أدمن فعلاً
  // بيحصل جوا AdminPage نفسها (عن طريق admin_get_overview اللي بترفض أي
  // حد مش مدرج في admin_users على مستوى قاعدة البيانات).
  if (isAdminPath) {
    return (
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <AdminPage />
      </Suspense>
    );
  }

  if (subStatus === undefined) {
    return <LoadingScreen label={t("بيحمّل...")} />;
  }

  if (subStatus === "blocked") {
    return (
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <Paywall
          trialEndsAt={trialEndsAt}
          onSignOut={handleSignOut}
          onRecheck={() => checkSubscription(session.user.id)}
        />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: colors.bg, padding: 16, display: "flex", flexDirection: "column" }}>
      {trialDaysLeft !== null && (
        <div style={{
          maxWidth: 1400, margin: "0 auto 10px", background: softBg.accentBlue, border: `1px solid ${colors.accentBlue}`,
          borderRadius: radius.sm, padding: "8px 14px", color: colors.accentBlue, fontSize: 12.5, fontWeight: 700,
          textAlign: "center", fontFamily: "inherit", direction: dir,
        }}>
          {trialDaysLeft === 0
            ? t("آخر يوم في فترة التجربة المجانية")
            : (dir === "rtl" ? `باقي ${trialDaysLeft} يوم على انتهاء فترة التجربة المجانية` : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`)}
        </div>
      )}
      <Suspense fallback={<LoadingScreen label={t("بيحمّل...")} />}>
        <ContentStudio
          session={session}
          onSignOut={handleSignOut}
          plan={plan}
          isTrialing={isTrialing}
          trialEndsAt={trialEndsAt}
          currentPeriodEnd={currentPeriodEnd}
          hasSubRow={hasSubRow}
          onSubscriptionRecheck={() => checkSubscription(session.user.id)}
        />
      </Suspense>
    </div>
  );
}
