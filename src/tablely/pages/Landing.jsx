import { Link } from "react-router-dom";
import {
  QrCode,
  UtensilsCrossed,
  LayoutDashboard,
  Crown,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Sparkles,
  LogIn,
} from "lucide-react";
import Logo from "../components/Logo";
import TicketCard from "../components/TicketCard";
import { TIER_ORDER, TIERS, FEATURE_FLAGS, FEATURE_ROWS } from "../lib/tiers";
import { useAuth } from "../lib/AuthContext";

const LOOP_STEPS = [
  { n: "01", title: "Scan", desc: "Customer scans the table QR. No app download.", icon: QrCode },
  { n: "02", title: "Order & pay", desc: "Menu, cart, and UPI checkout in one tab.", icon: UtensilsCrossed },
  { n: "03", title: "WhatsApp ping", desc: "Order lands in the kitchen's WhatsApp group instantly.", icon: MessageCircle },
  { n: "04", title: "Owner completes", desc: "One tap on the dashboard marks it done.", icon: CheckCircle2 },
  { n: "05", title: "Auto receipt", desc: "Customer gets a WhatsApp e-bill, no printer needed.", icon: Wallet },
];

const PORTALS = [
  {
    to: "/demo?tab=customer",
    icon: UtensilsCrossed,
    name: "Customer WebApp",
    desc: "Browse the menu, split the bill, pay, and rate the visit — all from the table.",
  },
  {
    to: "/demo?tab=staff",
    icon: LayoutDashboard,
    name: "Staff Dashboard",
    desc: "Waitstaff and kitchen see accepted orders and table status at a glance.",
  },
  {
    to: "/demo?tab=owner",
    icon: Crown,
    name: "Owner Command Center",
    desc: "Configuration, analytics, staff tracking, and menu control in one place.",
  },
];

// Group PRD's flat feature matrix into rows for the pricing table.
// Shared source of truth lives in lib/tiers.js (FEATURE_ROWS).
function unlockedAt(flag) {
  return FEATURE_FLAGS[flag];
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-paper-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 font-body text-sm font-medium text-ink-soft md:flex">
            <a href="#portals" className="hover:text-ink">Portals</a>
            <a href="#loop" className="hover:text-ink">How it works</a>
            <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user?.restaurantId ? (
              <Link
                to={`/${user.restaurantId}/owner`}
                className="rounded-full bg-ink px-4 py-2 font-body text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-ink px-4 py-2 font-body text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper">
                  Login
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-ink px-4 py-2 font-body text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                >
                  Start onboarding
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pt-24">
        <div>
          <p className="mb-5 inline-block rounded-full bg-marigold/20 px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest text-marigold-dark">
            Tablely — Smart Orders for Modern Restaurants
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Your restaurant deserves a
            <span className="italic text-marigold-dark"> proper</span> ordering system —
            not a bulky POS box.
          </h1>
          <p className="mt-6 max-w-lg font-body text-lg leading-relaxed text-ink-soft">
            One QR code turns any table into a self-serve counter. Orders ping straight to your
            staff's WhatsApp, payments land in your account, and the till never needs new
            hardware. It's a full ordering system quietly standing in for a POS.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper"
            >
              Start onboarding
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/demo?tab=owner" className="font-body text-sm font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4">
              View live demo
            </Link>
          </div>
        </div>

        {/* Signature: live order ticket */}
        <div className="relative">
          <TicketCard className="mx-auto max-w-sm shadow-[0_20px_50px_-20px_rgba(23,24,28,0.35)]">
            <div className="mb-3 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink-soft">
              <span>Order #0231</span>
              <span className="text-sage">Accepted</span>
            </div>
            <p className="font-display text-lg font-semibold">Table 1 · Dine-in</p>
            <div className="perf-divider my-4" />
            <ul className="space-y-2 font-body text-sm">
              <li className="flex justify-between">
                <span>1× Paneer Butter Masala + Rice</span>
                <span className="tabular">₹190</span>
              </li>
              <li className="flex justify-between">
                <span>2× Adrak Chai</span>
                <span className="tabular">₹60</span>
              </li>
            </ul>
            <div className="perf-divider my-4" />
            <div className="flex justify-between font-mono text-sm font-semibold">
              <span>Total</span>
              <span className="tabular">₹250</span>
            </div>
          </TicketCard>
          <div className="mx-auto mt-4 flex max-w-sm items-center gap-2 rounded-full bg-sage/15 px-4 py-2 font-body text-xs font-semibold text-sage">
            <MessageCircle size={14} />
            Pinged to "Kitchen Orders" WhatsApp group · just now
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="border-y border-paper-line bg-paper-dim/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight">One codebase, three experiences</h2>
          <p className="mt-2 max-w-xl font-body text-ink-soft">
            A single multi-tenant app renders three interfaces off the same data, gated by
            each cafe's subscription tier.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PORTALS.map((p) => (
              <Link key={p.name} to={p.to} className="group">
                <TicketCard className="h-full transition-transform group-hover:-translate-y-1">
                  <p.icon size={22} className="text-marigold-dark" />
                  <p className="mt-4 font-display text-xl font-semibold">{p.name}</p>
                  <p className="mt-2 font-body text-sm text-ink-soft">{p.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-semibold text-ink">
                    Open demo <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </TicketCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The ordering loop */}
      <section id="loop" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight">The ordering loop</h2>
        <p className="mt-2 max-w-xl font-body text-ink-soft">
          Every Starter-plan order follows the same five-step round trip, end to end, with no
          app installed on either side.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP_STEPS.map((s) => (
            <div key={s.n} className="ticket px-4 pb-5 pt-6">
              <span className="font-mono text-xs text-marigold-dark">{s.n}</span>
              <s.icon size={20} className="my-3 text-ink" />
              <p className="font-display text-base font-semibold">{s.title}</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-paper-line bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">Three tiers, one flag system</h2>
              <p className="mt-2 max-w-xl font-body text-paper/70">
                Every row below is a real feature flag in <code className="font-mono text-marigold">lib/tiers.js</code> —
                change the matrix there and the whole product follows.
              </p>
            </div>
            <Sparkles className="hidden text-marigold md:block" size={28} />
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TIER_ORDER.map((tId) => {
              const t = TIERS[tId];
              return (
                <TicketCard key={tId} dark className="text-paper">
                  <p className="font-mono text-xs uppercase tracking-widest text-paper/60">{t.name}</p>
                  <p className="mt-2 font-display text-4xl font-semibold">
                    ₹{t.price}<span className="text-base font-normal text-paper/60">/mo</span>
                  </p>
                  <p className="mt-2 font-body text-sm text-paper/70">{t.tagline}</p>
                  <div className="perf-divider mt-5 mb-4 border-white/15" />
                  <ul className="space-y-2.5 font-body text-sm">
                    {FEATURE_ROWS.filter((f) => unlockedAt(f.flag) === tId).map((f) => (
                      <li key={f.flag} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-marigold" />
                        <span>{f.label}</span>
                      </li>
                    ))}
                    {tId !== "starter" && (
                      <li className="pt-1 font-mono text-xs text-paper/50">+ everything in {TIERS[TIER_ORDER[TIER_ORDER.indexOf(tId) - 1]].name}</li>
                    )}
                  </ul>
                </TicketCard>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-marigold px-6 py-3 font-body text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Start onboarding now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-paper-line bg-paper py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 font-body text-sm text-ink-soft md:flex-row md:items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-ink">Pricing</Link>
            <span>·</span>
            <Link to="/admin" className="hover:text-ink">Admin Panel</Link>
            <span>·</span>
            <p>Multi-tenant SaaS · restaurant_id-scoped data · Razorpay/Stripe · WhatsApp Cloud API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
