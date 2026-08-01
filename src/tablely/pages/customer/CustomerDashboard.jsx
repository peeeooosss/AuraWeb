import { useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { UtensilsCrossed, ClipboardList, Tag, LogOut, ArrowLeft } from "lucide-react";
import PortalBar from "../../components/PortalBar";
import CustomerMenu from "./CustomerMenu";
import OrderHistory from "./OrderHistory";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

const TABS = [
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "orders", label: "My Orders", icon: ClipboardList },
  { id: "offers", label: "Offers", icon: Tag },
];

export default function CustomerDashboard() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table") || "TA";
  const navigate = useNavigate();

  const [tab, setTab] = useState(searchParams.get("tab") || "menu");
  const [profile, setProfile] = useState(null);

  // Check auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem("customer_profile");
      if (!stored) {
        navigate(`/${restaurantId}/login?table=${tableParam}`, { replace: true });
        return;
      }
      const p = JSON.parse(stored);
      if (p.restaurantId !== restaurantId) {
        navigate(`/${restaurantId}/login?table=${tableParam}`, { replace: true });
        return;
      }
      setProfile(p);
    } catch {
      navigate(`/${restaurantId}/login?table=${tableParam}`, { replace: true });
    }
  }, [restaurantId, tableParam, navigate]);

  // Sync URL tab query param with state
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && currentTab !== tab) {
      setTab(currentTab);
    }
  }, [searchParams]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar
        title={`Hello, ${profile.name}`}
        right={
          <button
            onClick={() => {
              localStorage.removeItem("customer_profile");
              navigate(`/${restaurantId}/login?table=${tableParam}`);
            }}
            className="flex items-center gap-1.5 rounded-full border border-paper-line px-3 py-1.5 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim"
          >
            <LogOut size={12} /> Sign out
          </button>
        }
      />

      {/* Tab bar */}
      <div className="flex border-b border-paper-line bg-paper/95 backdrop-blur sticky top-0 z-20">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 font-body text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-20">
        {tab === "menu" && (
          <CustomerMenu embedded tableId={tableParam} />
        )}
        {tab === "orders" && (
          <OrderHistory
            restaurantId={restaurantId}
            customerPhone={profile.phone}
            customerName={profile.name}
          />
        )}
        {tab === "offers" && (
          <div className="px-5 py-10 text-center">
            <p className="font-body text-sm text-ink-soft">No offers yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
