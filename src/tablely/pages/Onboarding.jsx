import { useState, useEffect } from "react";
import { Check, ArrowRight, ArrowLeft, Store, CreditCard, Sparkles, Shield, Save, PartyPopper, RefreshCw } from "lucide-react";
import PortalBar from "../components/PortalBar";
import { TIERS } from "../lib/tiers";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { createSubscriptionOrder, openRazorpayCheckout, verifyPayment } from "../lib/razorpay";
import { sanitizePhone, isValidPhone } from "../lib/utils";

const isLiveMode = import.meta.env.VITE_LIVE_MODE === "true";

const PLAN_FEATURES = {
  starter: [
    "Digital menu & ordering",
    "Dine-in / Takeaway toggle",
    "UPI payments & e-bills",
    "Basic ratings",
    "WhatsApp order alerts",
  ],
  ecosystem: [
    "Everything in Starter",
    "Full staff dashboard",
    "Split bills",
    "Staff management",
    "Order status workflow",
    "Reports & analytics",
  ],
  growth: [
    "Everything in Ecosystem",
    "VIP secret menus",
    "Automated marketing",
    "WhatsApp blasts",
    "Customer database",
    "AI smart upselling",
  ],
};

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState(null);
  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    tier: "starter",
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [paymentStage, setPaymentStage] = useState(""); // "", "creating", "verifying", "finalizing"

  // Load draft on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .eq("onboarding_complete", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDraftId(data.id);
        setForm({
          restaurantName: data.name || "",
          ownerName: data.owner_name || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          address: data.address || "",
          tier: data.tier || "starter",
        });
        if (data.onboarding_step && data.onboarding_step >= 1 && data.onboarding_step <= 3) {
          setStep(data.onboarding_step);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  function validateStep1() {
    const errs = {};
    if (!form.restaurantName.trim()) errs.restaurantName = "Restaurant name is required";
    if (!form.ownerName.trim()) errs.ownerName = "Your name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!isValidPhone(form.phone)) errs.phone = "Enter a valid 10-digit mobile number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2) {
      setStep(3);
      return;
    }
    setStep(step + 1);
  }

  // Generate restaurant ID from name
  function getRestaurantId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Save draft to Supabase
  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg("");
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const baseId = draftId || getRestaurantId(form.restaurantName);
      if (!baseId) {
        setErrors({ restaurantName: "Enter a restaurant name first" });
        setSaving(false);
        return;
      }

      const rowData = {
        id: baseId,
        name: form.restaurantName,
        owner_id: authUser.id,
        address: form.address,
        phone: form.phone,
        email: form.email,
        owner_name: form.ownerName,
        tier: form.tier,
        onboarding_step: step,
        onboarding_complete: false,
        tax_rate: 5,
        service_charge_enabled: false,
        service_charge_rate: 10,
      };

      if (draftId) {
        // Update existing draft
        const { error } = await supabase.from("restaurants").update(rowData).eq("id", draftId);
        if (error) throw error;
      } else {
        // Insert new draft
        const { error } = await supabase.from("restaurants").insert(rowData);
        if (error) throw error;
        setDraftId(baseId);
      }

      setSaveMsg("Draft saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment() {
    setProcessing(true);
    setErrors({});
    setPaymentStage("creating");
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error("Not authenticated. Please sign in again.");

      const baseId = draftId || getRestaurantId(form.restaurantName);
      const cleanPhone = sanitizePhone(form.phone);

      // Step 1: Create Razorpay order for ₹1 test subscription
      const orderData = await createSubscriptionOrder({
        plan: form.tier,
        email: form.email,
        restaurantName: form.restaurantName,
      });

      setPaymentStage("waiting");

      // Step 2: Open Razorpay checkout modal
      openRazorpayCheckout({
        amount: orderData.amount / 100, // convert from paise
        orderId: orderData.razorpay_order_id,
        name: "Tablely",
        description: `${selectedTier?.name} Plan — ₹1 (Test)`,
        prefill: { email: form.email, contact: cleanPhone },
        notes: { plan: form.tier, restaurant_id: baseId },
        handler: async (response) => {
          try {
            setPaymentStage("verifying");
            // Step 3: Verify payment signature
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentStage("finalizing");

            // Step 4: Mark restaurant onboarding complete + save razorpay_customer_id
            const rowData = {
              name: form.restaurantName,
              address: form.address,
              phone: form.phone,
              email: form.email,
              owner_name: form.ownerName,
              tier: form.tier,
              onboarding_complete: true,
              onboarding_step: 3,
              razorpay_customer_id: response.razorpay_payment_id,
            };

            if (draftId) {
              const { error: dbError } = await supabase.from("restaurants").update(rowData).eq("id", draftId);
              if (dbError) throw dbError;
            } else {
              const { error: dbError } = await supabase.from("restaurants").insert({
                id: baseId,
                owner_id: authUser.id,
                tax_rate: 5,
                service_charge_enabled: false,
                service_charge_rate: 10,
                ...rowData,
              });
              if (dbError) throw dbError;
            }

            // Step 5: Seed default menu and tables
            const { data: existingCats } = await supabase
              .from("menu_categories")
              .select("id")
              .eq("restaurant_id", baseId)
              .limit(1);

            if (!existingCats || existingCats.length === 0) {
              const { data: cats } = await supabase.from("menu_categories").insert([
                { restaurant_id: baseId, name: "Chai & Coffee", display_order: 1 },
                { restaurant_id: baseId, name: "Snacks", display_order: 2 },
              ]).select();

              if (cats && cats.length >= 2) {
                await supabase.from("menu_items").insert([
                  { restaurant_id: baseId, category_id: cats[0].id, name: "Adrak Chai", price: 30, original_price: 30, is_veg: true, description: "Fresh ginger chai." },
                  { restaurant_id: baseId, category_id: cats[0].id, name: "Filter Coffee", price: 40, original_price: 40, is_veg: true, description: "South Indian style." },
                  { restaurant_id: baseId, category_id: cats[1].id, name: "Samosa (2 pc)", price: 40, original_price: 40, is_veg: true, description: "Crispy potato samosa." },
                  { restaurant_id: baseId, category_id: cats[1].id, name: "Veg Toastie", price: 60, original_price: 60, is_veg: true, description: "Grilled veg sandwich." },
                ]);
              }

              await supabase.from("restaurant_tables").insert([
                { restaurant_id: baseId, table_number: "T1", seats: 4 },
                { restaurant_id: baseId, table_number: "T2", seats: 4 },
                { restaurant_id: baseId, table_number: "T3", seats: 4 },
                { restaurant_id: baseId, table_number: "T4", seats: 6 },
                { restaurant_id: baseId, table_number: "T5", seats: 2 },
              ]);
            }

            // Step 6: Refresh auth user so restaurantId is hydrated, then redirect
            await refreshUser();
            setPaymentStage("done");
            setProcessing(false);
            setLaunchSuccess(true);

            // Hard redirect to owner dashboard — forces full page reload so
            // AuthContext rehydrates fresh with the correct restaurant ID.
            // Using window.location.href instead of React Router's navigate()
            // prevents stale user.restaurantId from blocking ProtectedRoute.
            setTimeout(() => {
              window.location.href = `/${baseId}/owner`;
            }, 1500);
          } catch (err) {
            setErrors({ general: "Payment was successful, but setup failed: " + err.message + ". Please contact support with your payment ID: " + response.razorpay_payment_id });
            setProcessing(false);
            setPaymentStage("");
          }
        },
        onDismiss: () => {
          setProcessing(false);
          setPaymentStage("");
          setErrors({ general: "Payment window closed. No amount was charged — click below to try again." });
        },
        onError: (err) => {
          setProcessing(false);
          setPaymentStage("");
          setErrors({ general: err.message || "Payment failed. Please try again." });
        },
      });
    } catch (err) {
      setErrors({ general: err.message || "Could not start payment. Please try again." });
      setProcessing(false);
      setPaymentStage("");
    }
  }

  const selectedTier = TIERS[form.tier];

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <PortalBar title="Tablely — Onboarding" />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      </div>
    );
  }

  if (launchSuccess) {
    return (
      <div className="min-h-screen bg-paper">
        <PortalBar title="Tablely — Onboarding" />
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/15">
            <PartyPopper size={30} className="text-sage" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Payment successful!</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Your restaurant <span className="font-semibold text-ink">{form.restaurantName}</span> is ready. Taking you to your dashboard...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            <span className="font-body text-xs text-ink-soft">Redirecting</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar title="Tablely — Onboarding" />

      <div className="mx-auto max-w-2xl px-5 py-10">
        {/* Draft indicator */}
        {draftId && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-marigold/30 bg-marigold/10 px-4 py-2.5">
            <Save size={14} className="text-marigold-dark" />
            <span className="font-body text-sm text-marigold-dark">
              Draft restored — you're on Step {step}
            </span>
          </div>
        )}

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-body text-xs font-semibold ${
                  step >= s ? "bg-ink text-paper" : "bg-paper-dim text-ink-soft"
                }`}
              >
                {step > s ? <Check size={14} /> : s}
              </div>
              <span className={`font-body text-sm ${step >= s ? "text-ink font-medium" : "text-ink-soft"}`}>
                {s === 1 ? "Details" : s === 2 ? "Choose Plan" : "Payment"}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-ink" : "bg-paper-line"}`} />}
            </div>
          ))}
        </div>

        {errors.general && step !== 3 && (
          <div className="mb-6 rounded-lg border border-chili/30 bg-chili/10 px-4 py-3">
            <p className="font-body text-sm text-chili">{errors.general}</p>
          </div>
        )}

        {/* Step 1: Restaurant Details */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-marigold-dark" />
              <h1 className="font-display text-2xl font-semibold">Restaurant Details</h1>
            </div>
            <p className="font-body text-sm text-ink-soft mb-6">Tell us about your restaurant. You can always change these later.</p>

            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Restaurant Name *</label>
                <input
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  className={`mt-1 w-full rounded border bg-white px-3 py-2.5 font-body text-sm ${errors.restaurantName ? "border-chili" : "border-paper-line"}`}
                  placeholder="e.g. Tablely Cafe"
                />
                {errors.restaurantName && <p className="mt-1 font-body text-xs text-chili">{errors.restaurantName}</p>}
              </div>

              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Your Name *</label>
                <input
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className={`mt-1 w-full rounded border bg-white px-3 py-2.5 font-body text-sm ${errors.ownerName ? "border-chili" : "border-paper-line"}`}
                  placeholder="e.g. Priya Sharma"
                />
                {errors.ownerName && <p className="mt-1 font-body text-xs text-chili">{errors.ownerName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="mt-1 w-full rounded border border-paper-line bg-paper-dim px-3 py-2.5 font-body text-sm text-ink-soft cursor-not-allowed"
                    placeholder="you@email.com"
                  />
                  {errors.email && <p className="mt-1 font-body text-xs text-chili">{errors.email}</p>}
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Phone *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`mt-1 w-full rounded border bg-white px-3 py-2.5 font-body text-sm ${errors.phone ? "border-chili" : "border-paper-line"}`}
                    placeholder="+91XXXXXXXXXX"
                    maxLength={16}
                  />
                  {errors.phone ? (
                    <p className="mt-1 font-body text-xs text-chili">{errors.phone}</p>
                  ) : (
                    <p className="mt-1 font-body text-[10px] text-ink-soft">10-digit mobile number, used for WhatsApp order alerts.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2.5 font-body text-sm"
                  placeholder="123 Cafe Street, Bandra West, Mumbai"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full border border-paper-line px-5 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors disabled:opacity-60"
              >
                {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" /> : <Save size={14} />}
                Save Draft
              </button>
              <button onClick={handleNext} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft transition-colors">
                Choose a Plan <ArrowRight size={15} />
              </button>
            </div>
            {saveMsg && <p className="mt-2 font-body text-xs text-sage font-medium">{saveMsg}</p>}
          </div>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={20} className="text-marigold-dark" />
              <h1 className="font-display text-2xl font-semibold">Choose Your Plan</h1>
            </div>
            <p className="font-body text-sm text-ink-soft mb-6">Start with Starter, upgrade anytime as you grow.</p>

            <div className="space-y-4">
              {Object.entries(TIERS).map(([key, tier]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, tier: key })}
                  className={`w-full rounded-lg border-2 p-5 text-left transition-all ${
                    form.tier === key
                      ? "border-ink bg-ink/5 shadow-sm"
                      : "border-paper-line bg-white/40 hover:border-marigold/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base font-semibold">{tier.name}</p>
                        {key === "ecosystem" && (
                          <span className="rounded-full bg-marigold/20 px-2 py-0.5 font-body text-[10px] font-semibold text-marigold-dark">POPULAR</span>
                        )}
                      </div>
                      <p className="mt-1 font-body text-xs text-ink-soft">{tier.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-semibold">₹{tier.price}</p>
                      <p className="font-body text-[10px] text-ink-soft">/month</p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {PLAN_FEATURES[key].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 font-body text-xs text-ink-soft">
                        <Check size={12} className={form.tier === key ? "text-sage" : "text-paper-line"} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {form.tier === key && (
                    <div className="mt-3 flex items-center gap-1.5 font-body text-xs font-semibold text-ink">
                      <Sparkles size={12} /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 rounded-full border border-paper-line px-5 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full border border-paper-line px-5 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors disabled:opacity-60"
              >
                {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" /> : <Save size={14} />}
                Save Draft
              </button>
              <button onClick={handleNext} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft transition-colors">
                Proceed to Payment <ArrowRight size={15} />
              </button>
            </div>
            {saveMsg && <p className="mt-2 font-body text-xs text-sage font-medium">{saveMsg}</p>}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-marigold-dark" />
              <h1 className="font-display text-2xl font-semibold">Complete Payment</h1>
            </div>
            <p className="font-body text-sm text-ink-soft mb-6">
              {isLiveMode
                ? "Secure Razorpay checkout to activate your workspace."
                : "Secure Razorpay checkout — live mode, real ₹1 charge to activate."}
            </p>

            {/* Order summary */}
            <div className="rounded-lg border border-paper-line bg-white/60 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-ink-soft">Selected plan</span>
                <span className="font-body text-sm font-semibold">{selectedTier?.name}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-ink-soft">Restaurant</span>
                <span className="font-body text-sm font-semibold">{form.restaurantName || "—"}</span>
              </div>
              <div className="perf-divider my-3" />
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-semibold">Total due today</span>
                <span className="font-mono text-xl font-semibold text-sage">₹{selectedTier?.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded bg-paper-dim/60 px-3 py-2 mb-6">
              <Shield size={12} className="text-ink-soft shrink-0" />
              <span className="font-body text-xs text-ink-soft">
                Payments secured by Razorpay. A ₹{selectedTier?.price} charge activates your workspace instantly.
              </span>
            </div>

            {/* Payment stage indicator */}
            {processing && (
              <div className="mb-6 rounded-lg border border-marigold/30 bg-marigold/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-marigold-dark border-t-transparent" />
                  <span className="font-body text-sm font-medium text-marigold-dark">
                    {paymentStage === "creating" && "Preparing secure checkout..."}
                    {paymentStage === "waiting" && "Waiting for payment in the Razorpay window..."}
                    {paymentStage === "verifying" && "Verifying your payment..."}
                    {paymentStage === "finalizing" && "Setting up your restaurant..."}
                  </span>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-chili/30 bg-chili/10 px-4 py-3">
                <div className="flex-1">
                  <p className="font-body text-sm text-chili">{errors.general}</p>
                </div>
                <button
                  onClick={handlePayment}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-chili px-3 py-1.5 font-body text-xs font-semibold text-white hover:bg-chili/90"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} disabled={processing} className="flex items-center gap-1.5 rounded-full border border-paper-line px-5 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors disabled:opacity-50">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft transition-colors disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{selectedTier?.price} &amp; Launch <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
