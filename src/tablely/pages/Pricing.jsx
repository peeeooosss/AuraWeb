import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import Logo from "../components/Logo";
import TicketCard from "../components/TicketCard";
import { TIERS, TIER_ORDER, FEATURE_FLAGS, FEATURE_ROWS, PLAN_HELP, tierIndex } from "../lib/tiers";
import { useAuth } from "../lib/AuthContext";

function unlockedAt(flag) {
  return FEATURE_FLAGS[flag];
}

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-paper-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-8 font-body text-sm font-medium text-ink-soft md:flex">
            <Link to="/#portals" className="hover:text-ink">Portals</Link>
            <Link to="/#loop" className="hover:text-ink">How it works</Link>
            <Link to="/pricing" className="font-semibold text-ink">Pricing</Link>
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
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 text-center">
        <p className="inline-block rounded-full bg-marigold/20 px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest text-marigold-dark">
          Pricing
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Simple pricing that grows with your restaurant
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-body text-lg text-ink-soft">
          Every plan replaces a POS box — with no hardware to buy. Pick the one that matches
          how your cafe works today, and upgrade as you grow.
        </p>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-5 lg:grid-cols-3">
          {TIER_ORDER.map((tId) => {
            const t = TIERS[tId];
            return (
              <TicketCard key={tId} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{t.name}</p>
                  {tId === "ecosystem" && (
                    <span className="rounded-full bg-marigold/20 px-2.5 py-0.5 font-body text-[10px] font-semibold text-marigold-dark">POPULAR</span>
                  )}
                </div>
                <p className="mt-2 font-display text-4xl font-semibold">
                  ₹{t.price}<span className="text-base font-normal text-ink-soft">/mo</span>
                </p>
                <p className="mt-2 font-body text-sm text-ink-soft">{t.tagline}</p>

                <p className="mt-5 font-body text-xs font-semibold uppercase tracking-wide text-ink">How it helps</p>
                <ul className="mt-2 flex-1 space-y-2.5 font-body text-sm">
                  {PLAN_HELP[tId].map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles size={14} className="mt-0.5 shrink-0 text-marigold-dark" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="perf-divider my-4" />
                <ul className="mb-5 flex-1 space-y-2 font-body text-sm">
                  {FEATURE_ROWS.filter((f) => unlockedAt(f.flag) === tId).map((f) => (
                    <li key={f.flag} className="flex items-start gap-2">
                      <Check size={15} className="mt-0.5 shrink-0 text-sage" />
                      <span>{f.label}</span>
                    </li>
                  ))}
                  {tId !== "starter" && (
                    <li className="pt-1 font-mono text-xs text-ink-soft">+ everything in {TIERS[TIER_ORDER[TIER_ORDER.indexOf(tId) - 1]].name}</li>
                  )}
                </ul>

                <Link
                  to="/login"
                  className="mt-auto flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-body text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                >
                  Start with {t.name} <ArrowRight size={15} />
                </Link>
              </TicketCard>
            );
          })}
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Compare every feature</h2>
        <p className="mt-2 max-w-xl font-body text-ink-soft">
          The full flag matrix behind the plans. Upgrades unlock rows instantly — no new hardware.
        </p>
        <div className="mt-8 overflow-x-auto rounded-lg border border-paper-line bg-white/60">
          <table className="w-full min-w-[640px] border-collapse font-body text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-paper-dim/50">
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                {TIER_ORDER.map((tId) => (
                  <th key={tId} className="px-4 py-3 text-center font-semibold">{TIERS[tId].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((f) => (
                <tr key={f.flag} className="border-b border-paper-line/60 last:border-0">
                  <td className="px-4 py-2.5 text-ink-soft">{f.label}</td>
                  {TIER_ORDER.map((tId) => {
                    const unlocked = tierIndex(tId) >= tierIndex(unlockedAt(f.flag));
                    return (
                      <td key={tId} className="px-4 py-2.5 text-center">
                        {unlocked ? <Check size={15} className="mx-auto text-sage" /> : <Minus size={15} className="mx-auto text-paper-line" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-paper-line bg-ink py-16 text-paper">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Pick a plan, get your QR on the table today</h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-paper/70">
            Set up in minutes, pay by UPI card or netbanking, and start taking orders the same evening.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-marigold px-6 py-3 font-body text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
          >
            Start onboarding now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-paper-line bg-paper py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 font-body text-sm text-ink-soft md:flex-row md:items-center">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-ink">Pricing</Link>
            <span>·</span>
            <Link to="/admin" className="hover:text-ink">Admin Panel</Link>
            <span>·</span>
            <p>Multi-tenant SaaS · restaurant_id-scoped data · Razorpay · WhatsApp Cloud API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
