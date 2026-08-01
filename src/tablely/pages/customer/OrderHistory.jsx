import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, ChefHat, Truck, XCircle, ExternalLink } from "lucide-react";
import TicketCard from "../../components/TicketCard";
import { supabase } from "../../lib/supabase";

const STATUS_CONFIG = {
  placed: { color: "bg-marigold/20 text-marigold-dark", icon: CheckCircle, label: "Placed" },
  accepted: { color: "bg-marigold/20 text-marigold-dark", icon: CheckCircle, label: "Accepted" },
  preparing: { color: "bg-sage/20 text-sage", icon: ChefHat, label: "Preparing" },
  ready: { color: "bg-sage/20 text-sage", icon: Truck, label: "Ready" },
  completed: { color: "bg-paper-dim text-ink-soft", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "bg-chili/10 text-chili", icon: XCircle, label: "Cancelled" },
};

export default function OrderHistory({ restaurantId, customerPhone, customerName }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!restaurantId || !customerPhone) return;
    fetchOrders();
  }, [restaurantId, customerPhone]);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("customer_phone", customerPhone)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data.map((o) => ({
        ...o,
        table: o.table_number,
        status: o.order_status,
        type: o.order_type,
        items: o.items || [],
        customerName: o.customer_name,
        placedAt: new Date(o.created_at).toLocaleTimeString(),
        placedDate: new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      })));
    }
    setLoading(false);
  }

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId || !customerPhone) return;
    const channel = supabase
      .channel(`customer-orders-${customerPhone}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restaurantId, customerPhone]);

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => {
        if (filter === "active") return ["placed", "accepted", "preparing", "ready"].includes(o.status);
        if (filter === "completed") return o.status === "completed";
        if (filter === "cancelled") return o.status === "cancelled";
        return true;
      });

  const tabs = [
    { id: "all", label: "All", count: orders.length },
    { id: "active", label: "Active", count: orders.filter((o) => ["placed", "accepted", "preparing", "ready"].includes(o.status)).length },
    { id: "completed", label: "Completed", count: orders.filter((o) => o.status === "completed").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-paper-line mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 font-body text-xs font-medium border-b-2 transition-colors ${
              filter === t.id
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
              filter === t.id ? "bg-ink/10 text-ink" : "bg-paper-dim text-ink-soft"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-body text-sm text-ink-soft">
            {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const statusCfg = STATUS_CONFIG[o.status] || {};
            const StatusIcon = statusCfg.icon || CheckCircle;
            return (
              <TicketCard key={o.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-ink-soft">#{String(o.id).slice(0, 8)}</p>
                      <span className="font-body text-xs text-ink-soft">
                        {o.type === "takeaway" ? "Takeaway" : `Table ${o.table}`}
                      </span>
                    </div>
                    <p className="mt-1 font-body text-xs text-ink-soft">{o.placedAt} · {o.placedDate}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[10px] font-semibold ${statusCfg.color || "bg-paper-dim text-ink-soft"}`}>
                    <StatusIcon size={10} /> {statusCfg.label || o.status}
                  </span>
                </div>

                <ul className="mt-2 font-body text-xs text-ink-soft">
                  {o.items.map((it, i) => (
                    <li key={i}>{it.qty}× {it.name}</li>
                  ))}
                </ul>

                <div className="perf-divider my-2" />

                <div className="flex items-center justify-between">
                  <span className="tabular font-mono text-sm font-semibold">₹{o.total}</span>
                  <Link
                    to={`/${restaurantId}/bill/${o.id}`}
                    className="flex items-center gap-1 rounded-full border border-paper-line px-3 py-1.5 font-body text-[10px] font-semibold text-ink hover:bg-paper-dim transition-colors"
                  >
                    <ExternalLink size={10} /> E-Bill
                  </Link>
                </div>
              </TicketCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
