import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, Trophy, Clock, Table2, Volume2, VolumeX, BadgeCheck, ChefHat, Truck, CheckCircle, XCircle } from "lucide-react";
import PortalBar from "../../components/PortalBar";
import TicketCard from "../../components/TicketCard";
import PlanBadge from "../../components/PlanBadge";
import { useTier } from "../../lib/TierContext";
import { hasFeature } from "../../lib/tiers";
import { useAudioAlert } from "../../hooks/useAudioAlert";
import { supabase } from "../../lib/supabase";
import { openWhatsApp, formatKitchenAlert, getKitchenNumber } from "../../lib/whatsapp";
import { ORDERS, TABLES, STAFF } from "../../data/orders";

const NEXT_STATUS = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

const NEXT_LABEL = {
  placed: "Accept",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Complete",
};

const NEXT_ICON = {
  accepted: ChefHat,
  preparing: Truck,
  ready: CheckCircle,
};

const STATUS_STYLE = {
  placed: "bg-marigold/20 text-marigold-dark",
  accepted: "bg-marigold/20 text-marigold-dark",
  preparing: "bg-teal-soft/20 text-teal-soft",
  ready: "bg-sage/20 text-sage",
  completed: "bg-paper-line/40 text-ink-soft",
};

const PAYMENT_STYLE = {
  unpaid: "bg-marigold/20 text-marigold-dark",
  pending_verification: "bg-teal-soft/20 text-teal-soft",
  paid: "bg-sage/20 text-sage",
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

export default function StaffDashboard() {
  const params = useParams();
  const restaurantId = params.restaurantId;
  const { tier, applyRestaurantTier } = useTier();
  const fullPortal = hasFeature(tier, "staff_portal_full");
  const gamified = hasFeature(tier, "gamified_staff_dashboard");
  const { isMuted, toggleMute } = useAudioAlert();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => {
        setRestaurant(data);
        applyRestaurantTier(data?.tier);
      });
  }, [restaurantId]);

  async function advanceStatus(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const updates = {
      order_status: next,
      updated_at: new Date().toISOString(),
      ...(next === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);
    if (error) console.error("Status update failed:", error);
  }

  async function acceptOrder(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) console.error("Accept failed:", error);
  }

  async function cancelOrder(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) console.error("Reject failed:", error);
  }

  async function confirmPayment(orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) console.error("Payment confirm failed:", error);
  }

  function sendToKitchen(order) {
    const kitchenNum = getKitchenNumber(restaurant);
    if (kitchenNum) {
      openWhatsApp(kitchenNum, formatKitchenAlert({
        id: order.id,
        table_number: order.table,
        order_type: order.type,
        items: order.items,
        total: order.total,
      }, restaurant));
    } else {
      alert("No kitchen WhatsApp number set. Please add it in Settings.");
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .in("order_status", ["placed", "accepted", "preparing", "ready"])
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data.map((o) => ({
        id: o.id,
        table: o.table_number,
        type: o.order_type,
        status: o.order_status,
        paymentStatus: o.payment_status || "unpaid",
        upiUtr: o.upi_utr || "",
        placedAt: new Date(o.created_at).toLocaleTimeString(),
        items: o.items || [],
        total: o.total,
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
      .channel("staff-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restaurantId, fetchOrders]);

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar
        title="Staff Portal"
        right={
          <>
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 rounded-full border border-paper-line px-3 py-1.5 font-body text-xs font-medium text-ink-soft hover:bg-paper-dim hover:text-ink transition-colors"
              title={isMuted ? "Unmute alerts" : "Mute alerts"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
            </button>
          </>
        }
      />

      <PlanBadge />

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
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="py-10 text-center font-body text-sm text-ink-soft">No live orders right now.</p>
                  ) : (
                    orders.map((o) => (
                      <TicketCard key={o.id}>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-ink-soft">#{String(o.id).slice(0, 8)} · Table {o.table} · {o.type} · {o.placedAt}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-xs font-semibold ${PAYMENT_STYLE[o.paymentStatus]}`}>
                              <BadgeCheck size={11} />
                              {o.paymentStatus === "paid" ? "Paid ✓" : o.paymentStatus === "pending_verification" ? "Customer confirmed — Verify" : "Unpaid"}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold capitalize ${STATUS_STYLE[o.status]}`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                        <ul className="mt-2 space-y-0.5 font-body text-sm">
                          {o.items.map((it, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{it.qty}× {it.name}</span>
                              <span className="tabular text-ink-soft">₹{it.price * it.qty}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="tabular font-mono text-sm font-semibold">Total ₹{o.total}</span>
                          {(o.paymentStatus === "unpaid" || o.paymentStatus === "pending_verification") && (
                            <span className="font-body text-[10px] text-marigold-dark">{o.paymentStatus === "pending_verification" ? "Customer confirmed payment — please verify" : "Awaiting payment confirmation"}</span>
                          )}
                        </div>
                        {o.upiUtr && (
                          <p className="mt-1 font-mono text-[10px] text-ink-soft">
                            UTR: {o.upiUtr} <span className="text-marigold-dark">(match in bank app)</span>
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-paper-line pt-3">
                          {(o.paymentStatus === "unpaid" || o.paymentStatus === "pending_verification") && (
                            <button
                              onClick={() => confirmPayment(o.id)}
                              className="flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20"
                            >
                              <BadgeCheck size={12} /> {o.paymentStatus === "pending_verification" ? "Verify & Confirm Payment" : "Confirm Payment"}
                            </button>
                          )}
                          {o.status === "placed" && (
                            <button
                              onClick={() => {
                                acceptOrder(o.id);
                                sendToKitchen(o);
                              }}
                              className="flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20"
                            >
                              <MessageCircle size={12} /> Accept & Send to Kitchen
                            </button>
                          )}
                          {["placed", "accepted", "preparing"].includes(o.status) && (
                            <button
                              onClick={() => cancelOrder(o.id)}
                              className="flex items-center gap-1 rounded-full border border-chili/30 px-3 py-1.5 font-body text-xs font-semibold text-chili hover:bg-chili/10"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                          {["accepted", "preparing", "ready"].includes(o.status) && (() => {
                            const NextIcon = NEXT_ICON[o.status] || CheckCircle;
                            return (
                              <button
                                onClick={() => advanceStatus(o.id)}
                                className="flex items-center gap-1 rounded-full bg-ink px-4 py-1.5 font-body text-xs font-semibold text-paper hover:bg-ink-soft"
                              >
                                <NextIcon size={12} /> {NEXT_LABEL[o.status]}
                              </button>
                            );
                          })()}
                        </div>
                      </TicketCard>
                    ))
                  )}
                </div>
              )}
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
