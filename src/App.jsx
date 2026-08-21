import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import ContentStudio from "./ContentStudio";
import ResetPassword from "./ResetPassword";
import Paywall from "./Paywall";
import AccountConfirmed from "./AccountConfirmed";
import SharedBrandView from "./SharedBrandView";
import LandingPage from "./components/landing/LandingPage";
import { useLanguage } from "./LanguageContext";

export default function App() {
  const { dir, t } = useLanguage();
  const pathname = window.location.pathname;
  const shareMatch = pathname.match(/^\/share\/([a-zA-Z0-9]+)/);
  const isSignupPath = pathname === "/signup";
  const isLandingPath = pathname === "/" || pathname === "/landing";

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
    await supabase.auth.signOut();
    setIsRecovery(false);
  }

  // لينك مشاركة براند شغال لأي حد من غير تسجيل دخول خالص، ومن غير ما ينتظر
  // أي فحص جلسة أو اشتراك — بيتحقق من مساره الأول قبل أي حاجة تانية
  if (shareMatch) {
    return <SharedBrandView token={shareMatch[1]} />;
  }

  if (isRecovery) {
    return (
      <ResetPassword
        onDone={async () => {
          setIsRecovery(false);
          await supabase.auth.signOut();
        }}
      />
    );
  }

  if (justConfirmed) {
    return <AccountConfirmed onContinue={() => setJustConfirmed(false)} />;
  }

  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#11171B",
        color: "#8FA0A8", fontFamily: "sans-serif"
      }}>
        {t("بيحمّل...")}
      </div>
    );
  }

  if (!session) {
    if (isLandingPath) return <LandingPage />;
    if (isSignupPath) return <Auth initialMode="signup" />;
    return <Auth initialMode="login" />;
  }

  if (subStatus === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#11171B",
        color: "#8FA0A8", fontFamily: "sans-serif"
      }}>
        {t("بيحمّل...")}
      </div>
    );
  }

  if (subStatus === "blocked") {
    return (
      <Paywall
        trialEndsAt={trialEndsAt}
        onSignOut={handleSignOut}
        onRecheck={() => checkSubscription(session.user.id)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#11171B", padding: 16, display: "flex", flexDirection: "column" }}>
      {trialDaysLeft !== null && (
        <div style={{
          maxWidth: 1400, margin: "0 auto 10px", background: "#1B2328", border: "1px solid #E7A33E55",
          borderRadius: 10, padding: "8px 14px", color: "#E7A33E", fontSize: 12.5, fontWeight: 700,
          textAlign: "center", fontFamily: "'Tajawal', sans-serif", direction: dir,
        }}>
          {trialDaysLeft === 0
            ? t("آخر يوم في فترة التجربة المجانية")
            : (dir === "rtl" ? `باقي ${trialDaysLeft} يوم على انتهاء فترة التجربة المجانية` : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`)}
        </div>
      )}
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
    </div>
  );
}
