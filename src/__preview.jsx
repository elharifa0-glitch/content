// TEMPORARY — local visual QA harness only. Renders ContentStudio directly
// with a fake session so Sidebar/TopHeader/Dashboard can be checked in a
// browser without real Supabase credentials or a login flow. Not part of
// the real app entry (index.html/main.jsx), not linked from anywhere else,
// and removed before this step is considered done.
import React from "react";
import ReactDOM from "react-dom/client";
import ContentStudio from "./ContentStudio.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";

const fakeSession = { user: { id: "preview-user", email: "preview@example.com" } };

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <div style={{ minHeight: "100dvh", background: "var(--cs-bg)", padding: 16, display: "flex", flexDirection: "column" }}>
        <ContentStudio
          session={fakeSession}
          onSignOut={() => {}}
          plan="pro"
          isTrialing={false}
          trialEndsAt={null}
          currentPeriodEnd={null}
          hasSubRow={true}
          onSubscriptionRecheck={() => {}}
        />
      </div>
    </ThemeProvider>
  </React.StrictMode>
);
