import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import ContentStudio from "./ContentStudio";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#11171B", color: "#8FA0A8", fontFamily: "sans-serif" }}>
        بيحمّل...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#11171B", padding: 16 }}>
      <ContentStudio session={session} onSignOut={handleSignOut} />
    </div>
  );
}
