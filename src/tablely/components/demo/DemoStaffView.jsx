import { MessageCircle, Trophy, Clock, Table2 } from "lucide-react";
import TicketCard from "../TicketCard";
import TierSwitcher from "../TierSwitcher";
import { useTier } from "../../lib/TierContext";
import { hasFeature } from "../../lib/tiers";
import { ORDERS, TABLES, STAFF } from "../../data/orders";

const STATUS_STYLE = {
  accepted: "bg-marigold/20 text-marigold-dark",
  preparing: "bg-teal-soft/20 text-teal-soft",
  ready: "bg-sage/20 text-sage",
  completed: "bg-paper-line/40 text-ink-soft",
};

function WhatsAppOnlyView() {
  const activeOrders = ORDERS.filter((o) => o.status !== "completed");
  return (
    <div className="mx-auto max-w-md px-5 pb-28 pt-10">
      <div className="mb-4 flex items-center gap-2 rounded-full bg-sage/15 px-4 py-2 font-body text-xs font-semibold text-sage">
        <MessageCircle size={14} /> "Kitchen Orders" group · WhatsApp
      </div>
      <p className="mb-4 font-body text-sm text-ink-soft">
        On the Starter plan, staff don't get a dashboard — every order pings this WhatsApp
        group instead, formatted like a ticket.
      </p>
      <div className="space-y-3">
        {activeOrders.map((o) => (
          <div key={o.id} className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
            <p className="font-mono text-xs text-ink-soft">Order #{o.id} · Table {o.table} · {o.placedAt}</p>
            <ul className="mt-1 font-body text-sm">
              {o.items.map((it) => (
                <li key={it.name}>{it.qty}× {it.name}</li>
              ))}
            </ul>
            <p className="mt-1 tabular text-sm font-semibold">Total ₹{o.total}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center font-body text-xs text-ink-soft">
        Upgrade to Ecosystem to give staff a real-time dashboard instead of a phone screen.
      </p>
    </div>
  );
}

export default function DemoStaffView() {
  const { tier } = useTier();
  const fullPortal = hasFeature(tier, "staff_portal_full");
  const gamified = hasFeature(tier, "gamified_staff_dashboard");

  return (
    <div>
      <div className="fixed bottom-16 left-4 z-40 md:bottom-4">
        <div className="rounded-full bg-paper shadow-[0_8px_24px_-8px_rgba(23,24,28,0.4)] ring-1 ring-paper-line">
          <TierSwitcher />
        </div>
      </div>

      {!fullPortal ? (
        <WhatsAppOnlyView />
      ) : (
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 md:pb-16">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Orders */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                <Clock size={18} /> Live orders
              </h2>
              <div className="space-y-3">
                {ORDERS.map((o) => (
                  <TicketCard key={o.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-ink-soft">#{o.id} · Table {o.table} · {o.type} · {o.placedAt}</p>
                      <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold capitalize ${STATUS_STYLE[o.status]}`}>
                        {o.status}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-0.5 font-body text-sm">
                      {o.items.map((it) => (
                        <li key={it.name} className="flex justify-between">
                          <span>{it.qty}× {it.name}</span>
                        </li>
                      ))}
                    </ul>
                  </TicketCard>
                ))}
              </div>
            </div>

            {/* Tables + leaderboard */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                <Table2 size={18} /> Tables
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {TABLES.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-lg border px-3 py-4 text-center font-body text-sm font-semibold ${
                      t.status === "occupied"
                        ? "border-chili/30 bg-chili/10 text-chili"
                        : t.status === "free"
                        ? "border-sage/30 bg-sage/10 text-sage"
                        : "border-paper-line bg-paper-dim text-ink-soft"
                    }`}
                  >
                    {t.id}
                    <p className="mt-1 font-body text-[10px] font-normal capitalize opacity-80">{t.status}</p>
                  </div>
                ))}
              </div>

              {gamified ? (
                <div className="mt-8">
                  <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                    <Trophy size={18} className="text-marigold-dark" /> This week's leaderboard
                  </h2>
                  <div className="space-y-2">
                    {[...STAFF]
                      .sort((a, b) => b.tablesServed - a.tablesServed)
                      .map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between rounded border border-paper-line bg-white/50 px-3 py-2">
                          <span className="font-body text-sm font-semibold">
                            {i === 0 ? "🏆 " : `${i + 1}. `}
                            {s.name} <span className="font-normal text-ink-soft">· {s.role}</span>
                          </span>
                          <span className="tabular text-xs text-ink-soft">{s.tablesServed} tables · {s.avgResponseMin}m avg</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded border border-dashed border-paper-line bg-paper-dim/50 px-4 py-6 text-center font-body text-xs text-ink-soft">
                  Gamified leaderboards unlock on the Growth Engine plan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
