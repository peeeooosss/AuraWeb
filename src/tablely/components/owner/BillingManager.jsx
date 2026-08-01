import { useState } from "react";
import { Check, Shield, RefreshCw, Sparkles } from "lucide-react";
import TicketCard from "../TicketCard";
import { TIERS, TIER_ORDER, FEATURE_FLAGS, FEATURE_ROWS } from "../../lib/tiers";
import { createSubscriptionOrder, openRazorpayCheckout, verifyPayment } from "../../lib/razorpay";
import { useTier } from "../../lib/TierContext";

const isTestMode = import.meta.env.VITE_TEST_MODE === "true";

function unlockedAt(flag) {
  return FEATURE_FLAGS[flag];
}

export default function BillingManager({ restaurantId, restaurant = {}, onPlanChanged = null }) {
  const { tier, saveTierToRestaurant } = useTier();
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState(null);

  const email = restaurant?.email || "";
  const restaurantName = restaurant?.name || "Your restaurant";
  const current = TIERS[tier] || TIERS.starter;

  async function choosePlan(planId) {
    if (planId === tier) return;
    setProcessing(true);
    setMessage(null);
    setStage("creating");
    try {
      const orderData = await createSubscriptionOrder({ plan: planId, email, restaurantName });
      setStage("waiting");

      openRazorpayCheckout({
        amount: orderData.amount / 100,
        orderId: orderData.razorpay_order_id,
        name: "Tablely",
        description: `${TIERS[planId].name} Plan — ${isTestMode ? "₹1 (Test)" : `₹${TIERS[planId].price}/mo`}`,
        prefill: email ? { email } : {},
        notes: { plan: planId, restaurant_id: restaurantId, type: "subscription" },
        handler: async (response) => {
          try {
            setStage("verifying");
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setStage("finalizing");
            const ok = await saveTierToRestaurant(restaurantId, planId);
            if (!ok) {
              setMessage({ type: "error", text: "Payment succeeded, but the plan could not be applied. Please contact support with payment ID " + response.razorpay_payment_id + "." });
              return;
            }
            if (onPlanChanged) onPlanChanged();
            setMessage({ type: "success", text: `You're now on the ${TIERS[planId].name} plan. Features updated instantly.` });
          } catch (err) {
            setMessage({ type: "error", text: "Payment was successful, but applying the plan failed: " + err.message });
          } finally {
            setProcessing(false);
            setStage("");
          }
        },
        onDismiss: () => {
          setProcessing(false);
          setStage("");
          setMessage({ type: "error", text: "Payment window closed. No amount was charged — click Choose Plan to try again." });
        },
        onError: (err) => {
          setProcessing(false);
          setStage("");
          setMessage({ type: "error", text: err.message || "Payment failed. Please try again." });
        },
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not start payment. Please try again." });
      setProcessing(false);
      setStage("");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Billing &amp; subscription</h1>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Your plan decides which features your restaurant and team can use. Upgrade or downgrade anytime.
      </p>

      {/* Current plan summary */}
      <TicketCard className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-marigold/15">
              <Sparkles size={16} className="text-marigold-dark" />
            </div>
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Current plan</p>
              <p className="font-display text-xl font-semibold">
                {current.name} <span className="font-body text-sm font-normal text-ink-soft">· ₹{current.price}/mo</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-ink-soft">{current.tagline}</p>
            {restaurantId && (
              <p className="mt-1 font-mono text-[10px] text-ink-soft">restaurant_id: {restaurantId}</p>
            )}
          </div>
        </div>
      </TicketCard>

      {/* Processing / message states */}
      {processing && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-marigold/30 bg-marigold/10 px-4 py-3">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-marigold-dark border-t-transparent" />
          <span className="font-body text-sm font-medium text-marigold-dark">
            {stage === "creating" && "Preparing secure checkout..."}
            {stage === "waiting" && "Waiting for payment in the Razorpay window..."}
            {stage === "verifying" && "Verifying your payment..."}
            {stage === "finalizing" && "Applying your new plan..."}
          </span>
        </div>
      )}

      {message && (
        <div className={`mt-5 flex items-start gap-3 rounded-lg border px-4 py-3 ${
          message.type === "success" ? "border-sage/30 bg-sage/10" : "border-chili/30 bg-chili/10"
        }`}>
          <div className="flex-1">
            <p className={`font-body text-sm ${message.type === "success" ? "text-sage" : "text-chili"}`}>{message.text}</p>
          </div>
          {message.type === "error" && (
            <button
              onClick={() => setMessage(null)}
              className="shrink-0 rounded-full border border-chili/30 px-3 py-1 font-body text-xs font-semibold text-chili hover:bg-chili/10"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {TIER_ORDER.map((tId) => {
          const t = TIERS[tId];
          const isCurrent = tId === tier;
          return (
            <TicketCard key={tId} className={isCurrent ? "border-marigold ring-1 ring-marigold/40" : ""}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{t.name}</p>
                {isCurrent && (
                  <span className="rounded-full bg-marigold/20 px-2.5 py-0.5 font-body text-[10px] font-semibold text-marigold-dark">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-4xl font-semibold">
                ₹{t.price}<span className="text-base font-normal text-ink-soft">/mo</span>
              </p>
              <p className="mt-2 font-body text-sm text-ink-soft">{t.tagline}</p>
              <div className="perf-divider my-4" />
              <ul className="space-y-2.5 font-body text-sm">
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
              {isCurrent ? (
                <button
                  disabled
                  className="mt-5 w-full rounded-full border border-paper-line bg-paper-dim px-4 py-2.5 font-body text-sm font-semibold text-ink-soft"
                >
                  Current plan
                </button>
              ) : (
                <button
                  onClick={() => choosePlan(tId)}
                  disabled={processing}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 font-body text-sm font-semibold text-paper hover:bg-ink-soft transition-colors disabled:opacity-60"
                >
                  {processing && stage !== "waiting" ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Choose {t.name}
                </button>
              )}
            </TicketCard>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded bg-paper-dim/60 px-4 py-3">
        <Shield size={14} className="shrink-0 text-ink-soft" />
        <span className="font-body text-xs text-ink-soft">
          {isTestMode
            ? "Payments secured by Razorpay. In test mode every plan costs ₹1 — the change applies to your restaurant instantly."
            : "Payments secured by Razorpay. Your plan renews monthly and the change applies to your restaurant instantly."}
        </span>
      </div>
    </div>
  );
}
