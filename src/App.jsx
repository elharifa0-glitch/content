import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import ContentStudio from "./ContentStudio";
import ResetPassword from "./ResetPassword";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
        }
        setSession(newSession);
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const hash = window.location.hash;
    if (
      hash.includes("access_token=") &&
      (hash.includes("type=recovery") || hash.includes("type%3Drecovery"))
    ) {
      setIsRecovery(true);
    }

    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsRecovery(false);
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

  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#11171B",
        color: "#8FA0A8", fontFamily: "sans-serif"
      }}>
        بيحمّل...
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <div style={{ minHeight: "100vh", background: "#11171B", padding: 16 }}>
      <ContentStudio session={session} onSignOut={handleSignOut} />
    </div>
  );
}
