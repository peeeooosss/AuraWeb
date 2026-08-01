import { Clock, CheckCircle, ChefHat, Truck, XCircle, MessageCircle, Star, Heart, BadgeCheck } from "lucide-react";
import TicketCard from "../TicketCard";
import { openWhatsApp, formatKitchenAlert, formatThankYouMessage, formatRatingRequest, getKitchenNumber, getCustomerNumber } from "../../lib/whatsapp";

const STATUS_CONFIG = {
  placed: { color: "bg-marigold/20 text-marigold-dark", icon: CheckCircle, label: "Placed" },
  accepted: { color: "bg-marigold/20 text-marigold-dark", icon: CheckCircle, label: "Accepted" },
  preparing: { color: "bg-teal-soft/20 text-teal-soft", icon: ChefHat, label: "Preparing" },
  ready: { color: "bg-sage/20 text-sage", icon: Truck, label: "Ready" },
  completed: { color: "bg-paper-dim text-ink-soft", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "bg-chili/10 text-chili", icon: XCircle, label: "Cancelled" },
};

const PAYMENT_BADGE = {
  unpaid: { color: "bg-marigold/20 text-marigold-dark", icon: Clock, label: "UPI · Awaiting payment" },
  pending_verification: { color: "bg-teal-soft/20 text-teal-soft", icon: BadgeCheck, label: "Customer confirmed — Verify & pay" },
  paid: { color: "bg-sage/20 text-sage", icon: BadgeCheck, label: "Paid ✓" },
};

const NEXT_LABEL = {
  placed: "Accept Order",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Complete",
};

export default function OrderCard({ order, restaurant, onAccept, onAdvance, onCancel, onConfirmPayment }) {
  function handleSendToKitchen() {
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

  function handleSendThankYou() {
    const customerNum = getCustomerNumber(order.customerPhone);
    if (customerNum) {
      openWhatsApp(customerNum, formatThankYouMessage({
        id: order.id,
        restaurant_id: restaurant.id,
      }, restaurant));
    } else {
      alert("No customer phone number available.");
    }
  }

  function handleGetRating() {
    const customerNum = getCustomerNumber(order.customerPhone);
    if (customerNum) {
      openWhatsApp(customerNum, formatRatingRequest({
        id: order.id,
        restaurant_id: restaurant.id,
      }, restaurant));
    } else {
      alert("No customer phone number available.");
    }
  }

  const paymentBadge = PAYMENT_BADGE[order.payment_status];
  const PaymentIcon = paymentBadge?.icon;

  return (
    <TicketCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-ink-soft">#{String(order.id).slice(0, 8)}</p>
            <span className="font-body text-xs text-ink-soft">Table {order.table}</span>
            <span className="font-body text-xs text-ink-soft capitalize">· {order.type}</span>
          </div>
          <p className="mt-1 font-body text-xs text-ink-soft">
            {order.customerName} · {order.customerPhone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {paymentBadge && (
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-xs font-semibold ${paymentBadge.color}`}>
              <PaymentIcon size={11} />
              {paymentBadge.label}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${STATUS_CONFIG[order.status]?.color || "bg-paper-dim text-ink-soft"}`}>
            {STATUS_CONFIG[order.status]?.label || order.status}
          </span>
          <span className="flex items-center gap-1 font-body text-xs text-ink-soft">
            <Clock size={11} /> {order.placedAt}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-0.5 font-body text-sm">
        {(order.items || []).map((it, i) => (
          <li key={i} className="flex justify-between">
            <span>{it.qty}× {it.name}</span>
            <span className="tabular text-ink-soft">₹{it.price * it.qty}</span>
          </li>
        ))}
      </ul>

      {order.upi_utr && (
        <p className="mt-2 font-mono text-[10px] text-ink-soft">
          UTR: {order.upi_utr} <span className="text-marigold-dark">(match in your bank app)</span>
        </p>
      )}

      <div className="perf-divider my-3" />

      <div className="flex items-center justify-between">
        <span className="tabular font-mono text-sm font-semibold">Total ₹{order.total}</span>
        <div className="flex gap-2">
          {(order.payment_status === "unpaid" || order.payment_status === "pending_verification") && onConfirmPayment && (
            <button
              onClick={() => onConfirmPayment(order.id)}
              className="flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20"
            >
              <BadgeCheck size={12} /> {order.payment_status === "pending_verification" ? "Verify & Confirm Payment" : "Confirm Payment"}
            </button>
          )}
          {order.status === "placed" && (
            <button
              onClick={() => {
                onAccept(order.id);
                handleSendToKitchen();
              }}
              className="flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20"
            >
              <MessageCircle size={12} /> Accept & Send to Kitchen
            </button>
          )}
          {order.status === "completed" && order.customerPhone && (
            <>
              <button
                onClick={handleSendThankYou}
                className="flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20"
              >
                <Heart size={12} /> Send Thank You
              </button>
              <button
                onClick={handleGetRating}
                className="flex items-center gap-1 rounded-full border border-marigold/40 bg-marigold/10 px-3 py-1.5 font-body text-xs font-semibold text-marigold-dark hover:bg-marigold/20"
              >
                <Star size={12} /> Get Rating
              </button>
            </>
          )}
          {["placed", "accepted", "preparing"].includes(order.status) && (
            <button
              onClick={() => onCancel(order.id)}
              className="rounded-full border border-chili/30 px-3 py-1.5 font-body text-xs font-semibold text-chili hover:bg-chili/10"
            >
              Reject
            </button>
          )}
          {["accepted", "preparing", "ready"].includes(order.status) && (
            <button
              onClick={() => onAdvance(order.id)}
              className="rounded-full bg-ink px-4 py-1.5 font-body text-xs font-semibold text-paper hover:bg-ink-soft"
            >
              {NEXT_LABEL[order.status] || "Advance"}
            </button>
          )}
        </div>
      </div>
    </TicketCard>
  );
}
