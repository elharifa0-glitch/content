// Single source of truth for plan definitions, brand limits, and feature
// gates. Imported by ContentStudio.jsx (entitlement checks), PlanPicker.jsx
// and the landing pricing section (display), and AdminPage.jsx (the manual
// plan editor) — so every part of the app agrees on the same numbers.
// Prices are in EGP.
import { colors } from "./theme";

// Trial accounts get a fixed, generous-but-bounded brand cap instead of the
// old unlimited count — this is the fix for the confirmed loophole where a
// trial user could create dozens of brands and keep them all forever after
// downgrading to the cheapest paid plan (existing downgrade behavior, kept
// as-is: brands over a plan's limit are never deleted or archived, only new
// brand creation is blocked).
export const TRIAL_BRAND_LIMIT = 3;

export const PLAN_ORDER = ["starter", "pro", "agency"];

export const PLANS = {
  starter: {
    key: "starter",
    name: "Starter",
    brandLimit: 2,
    priceMonthly: 199,
    priceAnnual: 1990,
    color: colors.info,
    features: { shareLinks: false, whiteLabel: false },
  },
  pro: {
    key: "pro",
    name: "Pro",
    brandLimit: 6,
    priceMonthly: 449,
    priceAnnual: 4490,
    color: colors.warning,
    recommended: true,
    features: { shareLinks: true, whiteLabel: true },
  },
  agency: {
    key: "agency",
    name: "Agency",
    brandLimit: Infinity,
    priceMonthly: 1499,
    priceAnnual: 14990,
    color: colors.good,
    features: { shareLinks: true, whiteLabel: true },
  },
};

// "unlimited" was the old key for the plan now called "agency". Accounts
// set before this rename (including via the admin panel, or stored in
// subscriptions.plan) may still carry that value — every lookup below
// resolves it to "agency" first instead of treating it as unrecognized.
const LEGACY_PLAN_ALIASES = { unlimited: "agency" };

export function normalizePlanKey(plan) {
  const key = (plan || "").toString().trim().toLowerCase();
  const resolved = LEGACY_PLAN_ALIASES[key] || key;
  return PLANS[resolved] ? resolved : null;
}

export function getPlanDef(plan) {
  const key = normalizePlanKey(plan);
  return key ? PLANS[key] : null;
}

// Brand cap for the account's current entitlement. An unrecognized/legacy
// plan value (e.g. a pre-subscription-system account with no real plan, or
// a stray value like "standard") fails OPEN to unlimited rather than
// locking out someone who may be a legitimate paying customer — this
// mirrors the exact behavior of the brand-limit check before this change.
export function getBrandLimit(plan, isTrialing) {
  if (isTrialing) return TRIAL_BRAND_LIMIT;
  const def = getPlanDef(plan);
  return def ? def.brandLimit : Infinity;
}

// Feature gates for Client Share Links and White-Label Branding. Trialing
// accounts always get full access so a prospective customer can evaluate
// every feature before paying. An unrecognized/legacy plan also fails
// open, for the same reason as getBrandLimit above. The two gated features
// also carry a matching server-side check for the parts that are
// externally visible (see supabase-schema.sql) — this client-side check is
// what drives the UI (buttons/upgrade prompts), not the only enforcement.
export function planHasFeature(plan, isTrialing, feature) {
  if (isTrialing) return true;
  const def = getPlanDef(plan);
  if (!def) return true;
  return !!def.features[feature];
}

export function planLabel(plan) {
  const def = getPlanDef(plan);
  return def ? def.name : (plan || "");
}

export function planColorFor(plan) {
  const def = getPlanDef(plan);
  return def ? def.color : colors.textFaint;
}
