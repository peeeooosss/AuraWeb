import { useState } from "react";
import { Search, Download, Send } from "lucide-react";
import TicketCard from "../TicketCard";
import LockedFeature from "../LockedFeature";
import { useTier } from "../../lib/TierContext";
import { hasFeature } from "../../lib/tiers";

const LOYALTY_COLORS = {
  Gold: "bg-marigold/20 text-marigold-dark",
  Silver: "bg-paper-dim text-ink-soft",
  Bronze: "bg-chili/10 text-chili",
};

export default function CustomerDatabase({ customers: initial }) {
  const { tier } = useTier();
  const canAccess = hasFeature(tier, "customer_database");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const filtered = initial
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )
    .sort((a, b) => {
      if (sortBy === "recent") return b.lastVisit.localeCompare(a.lastVisit);
      if (sortBy === "orders") return b.totalOrders - a.totalOrders;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      return 0;
    });

  if (!canAccess) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-5">Customer Database</h1>
        <LockedFeature requiredTier="growth" label="Customer database & marketing lists" />
        <div className="mt-6">
          <p className="font-body text-sm text-ink-soft mb-3">You have {initial.length} customers in your database. Upgrade to Growth Engine to access the full customer database for marketing.</p>
          <div className="space-y-2">
            {initial.slice(0, 5).map((c) => (
              <TicketCard key={c.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-semibold">{c.name}</p>
                    <p className="font-body text-xs text-ink-soft">{c.phone}</p>
                  </div>
                  <span className="tabular font-mono text-xs text-ink-soft">{c.totalOrders} orders</span>
                </div>
              </TicketCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customer Database</h1>
          <p className="font-body text-xs text-ink-soft mt-1">{initial.length} total customers</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-full border border-paper-line px-3 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim">
            <Download size={13} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper hover:bg-ink-soft">
            <Send size={13} /> WhatsApp Blast
          </button>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-paper-line bg-white pl-9 pr-3 py-2 font-body text-sm"
            placeholder="Search by name or phone..."
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-paper-line bg-white px-3 py-2 font-body text-xs text-ink-soft">
          <option value="recent">Most Recent</option>
          <option value="orders">Most Orders</option>
          <option value="spent">Highest Spent</option>
        </select>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-wide text-ink-soft border-b border-paper-line">
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-2">Last Visit</div>
        <div className="col-span-2 text-center">Orders</div>
        <div className="col-span-2 text-right">Total Spent</div>
        <div className="col-span-1 text-right">Loyalty</div>
      </div>

      {/* Customer rows */}
      <div className="divide-y divide-paper-line">
        {filtered.map((c) => (
          <div key={c.id} className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-paper-dim/30 transition-colors">
            <div className="col-span-12 md:col-span-3">
              <p className="font-body text-sm font-semibold">{c.name}</p>
              <p className="font-body text-xs text-ink-soft md:hidden">{c.phone}</p>
            </div>
            <div className="hidden md:block col-span-2 font-body text-xs text-ink-soft">{c.phone}</div>
            <div className="col-span-5 md:col-span-2 font-body text-xs text-ink-soft">{c.lastVisit}</div>
            <div className="col-span-3 md:col-span-2 text-center font-mono text-xs tabular">{c.totalOrders}</div>
            <div className="col-span-4 md:col-span-2 text-right font-mono text-xs tabular">₹{c.totalSpent.toLocaleString()}</div>
            <div className="col-span-3 md:col-span-1 text-right">
              <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${LOYALTY_COLORS[c.loyaltyTier] || "bg-paper-dim text-ink-soft"}`}>
                {c.loyaltyTier}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center font-body text-sm text-ink-soft">No customers match your search.</p>
      )}
    </div>
  );
}
