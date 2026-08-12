import React from "react";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorks from "./HowItWorks";
import AnalyzerShowcase from "./AnalyzerShowcase";
import AnalyticsShowcase from "./AnalyticsShowcase";
import ContentShowcase from "./ContentShowcase";
import MultiBrandSection from "./MultiBrandSection";
import PricingSection from "./PricingSection";
import FAQSection from "./FAQSection";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";
import { landing } from "./tokens";

// Public marketing site — deliberately independent of ThemeContext (always
// light) and of ContentStudio.jsx (no auth/session required). Reachable at
// "/" for signed-out visitors; App.jsx renders the real dashboard instead
// once a session exists, so this never intercepts logged-in users.
export default function LandingPage() {
  return (
    <div dir="rtl" style={{ background: landing.bg, minHeight: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        .landing-root, .landing-root * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        .landing-root { min-width: 0; overflow-x: hidden; }

        @keyframes landing-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cs-animate-fade-up { animation: landing-fade-up 620ms cubic-bezier(.16,1,.3,1) both; }
        .cs-animate-fade-up-delay { animation: landing-fade-up 620ms cubic-bezier(.16,1,.3,1) 140ms both; }

        .landing-card-hover { }
        .landing-card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(21,26,36,0.08); }

        .landing-nav-mobile-btn { display: none; }
        .landing-nav-mobile-panel { display: none; }

        @media (max-width: 1024px) {
          .landing-nav-desktop { display: none !important; }
          .landing-nav-mobile-btn { display: flex !important; }
        }

        @media (max-width: 900px) {
          .landing-split-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .landing-split-grid-reverse > *:first-child { order: 2; }
          .landing-split-grid-reverse > *:last-child { order: 1; }
          .landing-steps-row { flex-direction: column !important; align-items: stretch !important; gap: 26px !important; }
          .landing-steps-arrow { display: none !important; }
          .landing-brands-grid { grid-template-columns: 1fr !important; }
          .landing-pricing-grid { grid-template-columns: 1fr !important; }
          .landing-features-grid { grid-template-columns: 1fr 1fr !important; }
        }

        @media (max-width: 640px) {
          .landing-benefits-grid { grid-template-columns: 1fr 1fr !important; }
          .landing-hero-headline { font-size: 32px !important; }
          .landing-features-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .landing-benefits-grid { grid-template-columns: 1fr !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-animate-fade-up, .cs-animate-fade-up-delay { animation: none !important; }
          .landing-card-hover:hover { transform: none !important; }
          * { transition-duration: 0.001ms !important; }
        }
      `}</style>

      <div className="landing-root">
        <LandingNavbar />
        <main>
          <HeroSection />
          <BenefitsSection />
          <HowItWorks />
          <AnalyzerShowcase />
          <AnalyticsShowcase />
          <ContentShowcase />
          <MultiBrandSection />
          <PricingSection />
          <FAQSection />
          <FinalCTA />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
