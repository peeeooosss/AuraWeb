// Subscription tier definitions and feature-flag matrix.
// Source of truth: PRD "Subscription Feature Tiers" table.
// Every gated component should check flags via `hasFeature(tier, flagKey)`
// rather than hardcoding tier names, so pricing/config can change in one place.

const isTestMode = import.meta.env.VITE_TEST_MODE === "true";
const isLiveMode = import.meta.env.VITE_LIVE_MODE === "true";

// In live mode: use real prices. In test mode: ₹1 for all plans.
const starterPrice = isLiveMode ? 599 : (isTestMode ? 1 : 599);
const ecosystemPrice = isLiveMode ? 1499 : (isTestMode ? 1 : 1499);
const growthPrice = isLiveMode ? 1999 : (isTestMode ? 1 : 1999);

export const TIERS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: starterPrice,
    tagline: "Get orders flowing without buying a single new device.",
  },
  ecosystem: {
    id: "ecosystem",
    name: "Ecosystem",
    price: ecosystemPrice,
    tagline: "Unlock the staff-facing dashboard and smarter inventory calls.",
  },
  growth: {
    id: "growth",
    name: "Growth Engine",
    price: growthPrice,
    tagline: "Automated marketing and AI upsells that pay for the plan.",
  },
};

export const TIER_ORDER = ["starter", "ecosystem", "growth"];

// Each flag: minimum tier required to unlock it.
export const FEATURE_FLAGS = {
  digital_menu: "starter",
  dine_takeaway_select: "starter",
  digital_payments: "starter",
  basic_ratings: "starter",
  whatsapp_order_alerts: "starter",
  owner_basic_menu_control: "starter",
  owner_order_status_tracker: "starter",

  split_bills: "ecosystem",
  staff_portal_full: "ecosystem",
  predictive_inventory_alerts: "ecosystem",
  rescue_campaigns: "ecosystem",
  add_staff: "ecosystem",
  reports_analytics: "ecosystem",
  customer_database: "growth",

  whatsapp_config: "starter",
  gst_config: "starter",
  order_status_workflow: "starter",
  customer_menu_themes: "ecosystem",
  fast_delivery: "ecosystem",

  vip_secret_menus: "growth",
  gamified_staff_dashboard: "growth",
  automated_marketing: "growth",
  whatsapp_blasts: "growth",
  poster_generator: "growth",
  ai_smart_upselling: "growth",
  flash_sales: "growth",
  table_vibe_spotify: "growth",
};

// Feature checklist shared by the homepage pricing page, dashboard billing page,
// and the landing section — single source of truth for what ships in each plan.
export const FEATURE_ROWS = [
  { label: "Digital menu + dine-in/takeaway", flag: "digital_menu" },
  { label: "Digital payments", flag: "digital_payments" },
  { label: "WhatsApp order alerts to kitchen", flag: "whatsapp_order_alerts" },
  { label: "Basic menu control + status tracker", flag: "owner_basic_menu_control" },
  { label: "Frictionless split bills", flag: "split_bills" },
  { label: "Full staff portal", flag: "staff_portal_full" },
  { label: "Predictive inventory alerts", flag: "predictive_inventory_alerts" },
  { label: "One-click rescue campaigns", flag: "rescue_campaigns" },
  { label: "VIP secret menus", flag: "vip_secret_menus" },
  { label: "Gamified staff dashboards", flag: "gamified_staff_dashboard" },
  { label: "Automated marketing + WhatsApp blasts", flag: "automated_marketing" },
  { label: "Fast Delivery section (under 10 min)", flag: "fast_delivery" },
  { label: "AI upselling, flash sales, table vibe", flag: "ai_smart_upselling" },
];

// Marketing copy for the homepage pricing page — how each plan helps a cafe.
export const PLAN_HELP = {
  starter: [
    "Kitchen gets every order as a formatted WhatsApp ping — no printer, no POS box.",
    "Customers scan the QR, order, and pay by UPI from the table; money lands straight in your account.",
    "You control the menu and track every order's status from your phone.",
  ],
  ecosystem: [
    "Give your team a real dashboard with live orders, split bills, and tables at a glance.",
    "Add waiters and kitchen staff with their own logins and roles — no more shouting across the floor.",
    "Predictive inventory alerts flag restock risks before you run out of your bestseller.",
    "Reports & analytics show exactly what's selling, when, so you can plan smarter.",
    "Fast Delivery section highlights quick-prep items for customers in a hurry.",
  ],
  growth: [
    "Automated marketing and WhatsApp blasts that bring regulars back without lifting a finger.",
    "VIP secret menus and gamified staff dashboards that keep both guests and team engaged.",
    "AI upselling, flash sales, and table-vibe music voted on by guests — the plan that pays for itself.",
  ],
};

export function tierIndex(tierId) {
  return TIER_ORDER.indexOf(tierId);
}

// True if `tierId` unlocks `flagKey`.
export function hasFeature(tierId, flagKey) {
  const required = FEATURE_FLAGS[flagKey];
  if (!required) return false;
  return tierIndex(tierId) >= tierIndex(required);
}

// Wallet / billing constants (TRD section 4)
export const BILLING = {
  utilityMessageCost: 0.2, // per automated e-bill / status update
  marketingMessageCost: 1.25, // per promotional blast message
};
