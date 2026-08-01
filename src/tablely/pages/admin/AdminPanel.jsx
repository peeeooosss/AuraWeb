import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Trash2, RefreshCw, Shield } from "lucide-react";
import PortalBar from "../../components/PortalBar";
import TicketCard from "../../components/TicketCard";
import { getAllRestaurantList, deleteRestaurant } from "../../lib/db";
import { TIERS } from "../../lib/tiers";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load() {
    const list = await getAllRestaurantList();
    setRestaurants(list);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    await deleteRestaurant(id);
    setConfirmDelete(null);
    load();
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar title="Tablely — Super Admin" />

      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Shield size={22} className="text-marigold-dark" /> Client Overview
            </h1>
            <p className="mt-1 font-body text-sm text-ink-soft">All onboarded restaurants across the platform.</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-full border border-paper-line px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Tier distribution */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(TIERS).map(([key, tier]) => (
            <TicketCard key={key}>
              <p className="font-body text-xs uppercase tracking-wide text-ink-soft">{tier.name}</p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {restaurants.filter((r) => r.tier === key).length}
              </p>
            </TicketCard>
          ))}
        </div>

        {/* Restaurant list */}
        <div className="space-y-3">
          {restaurants.length === 0 && (
            <TicketCard>
              <p className="font-body text-sm text-ink-soft text-center py-4">No restaurants onboarded yet.</p>
            </TicketCard>
          )}
          {restaurants.map((r) => (
            <TicketCard key={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold">{r.name}</p>
                    <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${
                      r.tier === "growth" ? "bg-marigold/20 text-marigold-dark" :
                      r.tier === "ecosystem" ? "bg-sage/20 text-sage" :
                      "bg-paper-dim text-ink-soft"
                    }`}>
                      {TIERS[r.tier]?.name || r.tier}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-ink-soft">{r.ownerName} · {r.email} · {r.phone}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-soft">/{r.id} · Created {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/${r.id}/owner`)}
                    className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors"
                  >
                    <ExternalLink size={11} /> Open Dashboard
                  </button>
                  {confirmDelete === r.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(r.id)} className="rounded bg-chili px-2.5 py-1 font-body text-[10px] text-paper">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="rounded bg-paper-dim px-2.5 py-1 font-body text-[10px]">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-ink-soft hover:text-chili hover:bg-chili/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </TicketCard>
          ))}
        </div>
      </div>
    </div>
  );
}
