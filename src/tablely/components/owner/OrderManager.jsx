import { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import TicketCard from "../TicketCard";
import OrderCard from "./OrderCard";
import { supabase } from "../../lib/supabase";

const NEXT_STATUS = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function OrderManager({ restaurantId, restaurant }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderTab, setOrderTab] = useState("live");
  const [dateFilter, setDateFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data.map((o) => ({
        ...o,
        table: o.table_number,
        status: o.order_status,
        type: o.order_type,
        total: o.total,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        placedAt: new Date(o.created_at).toLocaleTimeString(),
        placedDate: new Date(o.created_at).toISOString().split("T")[0],
      })));
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restaurantId, fetchOrders]);

  async function advanceStatus(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    // Update in Supabase
    const updates = {
      order_status: next,
      updated_at: new Date().toISOString(),
      ...(next === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (!error) fetchOrders();
  }

  async function acceptOrder(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) fetchOrders();
  }

  async function cancelOrder(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) fetchOrders();
  }

  async function confirmPayment(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) fetchOrders();
  }

  const live = orders.filter((o) => ["placed", "accepted", "preparing", "ready"].includes(o.status));
  const past = orders.filter((o) => o.status === "completed");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  const filteredPast = dateFilter ? past.filter((o) => o.placedDate === dateFilter) : past;
  const filteredCancelled = dateFilter ? cancelled.filter((o) => o.placedDate === dateFilter) : cancelled;

  const tabs = [
    { id: "live", label: "Live Orders", count: live.length },
    { id: "past", label: "Completed", count: past.length },
    { id: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-5">Order Management</h1>
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">Order Management</h1>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-ink-soft" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded border border-paper-line bg-white px-3 py-1.5 font-body text-xs text-ink-soft"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="font-body text-xs text-chili underline">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-paper-line mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setOrderTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-body text-sm font-medium border-b-2 transition-colors ${
              orderTab === t.id
                ? "border-marigold text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                orderTab === t.id ? "bg-marigold/20 text-marigold-dark" : "bg-paper-dim text-ink-soft"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {orderTab === "live" && (
        <div className="space-y-3">
          {live.length === 0 ? (
            <p className="py-10 text-center font-body text-sm text-ink-soft">No live orders right now.</p>
          ) : (
            live.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                restaurant={restaurant}
                onAccept={acceptOrder}
                onAdvance={advanceStatus}
                onCancel={cancelOrder}
                onConfirmPayment={confirmPayment}
              />
            ))
          )}
        </div>
      )}

      {orderTab === "past" && (
        <div className="space-y-3">
          {filteredPast.length === 0 ? (
            <p className="py-10 text-center font-body text-sm text-ink-soft">No completed orders{dateFilter ? " on this date" : ""}.</p>
          ) : (
            filteredPast.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                restaurant={restaurant}
                onAccept={acceptOrder}
                onAdvance={advanceStatus}
                onCancel={cancelOrder}
                onConfirmPayment={confirmPayment}
              />
            ))
          )}
        </div>
      )}

      {orderTab === "cancelled" && (
        <div className="space-y-3">
          {filteredCancelled.length === 0 ? (
            <p className="py-10 text-center font-body text-sm text-ink-soft">No cancelled orders{dateFilter ? " on this date" : ""}.</p>
          ) : (
            filteredCancelled.map((o) => (
              <TicketCard key={o.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-ink-soft">#{String(o.id).slice(0, 8)}</p>
                    <span className="font-body text-xs text-ink-soft">Table {o.table}</span>
                  </div>
                  <span className="tabular font-mono text-sm">₹{o.total}</span>
                </div>
              </TicketCard>
            ))
          )}
        </div>
      )}
    </div>
  );
}
