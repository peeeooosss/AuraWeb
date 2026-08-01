import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Minus, ShoppingBag, Star, Lock, Users, ArrowRight, CheckCircle2, Phone, ExternalLink, Wallet, ClipboardList, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import PortalBar from "../../components/PortalBar";
import TicketCard from "../../components/TicketCard";
import { hasFeature, TIERS } from "../../lib/tiers";
import { useTier } from "../../lib/TierContext";
import { getRestaurant } from "../../lib/db";
import { buildUpiPay, buildUpiIntent, buildUpiIosUrl, UPI_APPS, isValidUtr } from "../../lib/upi";
import { getMenuTheme } from "../../lib/menuThemes";
import { supabase } from "../../lib/supabase";

export default function CustomerMenu({ embedded, tableId: propTableId }) {
  const params = useParams();
  const restaurantId = params.restaurantId;
  const tableId = propTableId || params.tableId || "T1";
  const { tier } = useTier();
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState(tableId === "TA" ? "takeaway" : "dine-in");
  const [splitCount, setSplitCount] = useState(1);
  const [step, setStep] = useState("menu");
  const [rating, setRating] = useState(0);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [payError, setPayError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [utr, setUtr] = useState("");

  // Auto-fill customer info from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("customer_profile");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.phone) setCustomerPhone(p.phone);
        if (p.name) setCustomerName(p.name);
      }
    } catch {}
  }, []);

  const isTakeaway = tableId === "TA";

  // Load restaurant-specific data or fall back to defaults
  const [restaurant, setRestaurant] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);

  // Fetch restaurant data and subscribe to real-time menu changes
  useEffect(() => {
    if (!restaurantId) { setMenuLoading(false); return; }

    async function loadMenu() {
      const r = await getRestaurant(restaurantId);
      setRestaurant(r);
      setMenuLoading(false);
    }
    loadMenu();

    // Re-fetch when menu_categories or menu_items change
    const channel = supabase
      .channel(`menu-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories", filter: `restaurant_id=eq.${restaurantId}` }, loadMenu)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items", filter: `restaurant_id=eq.${restaurantId}` }, loadMenu)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const themeId = hasFeature(restaurant?.tier || "starter", "customer_menu_themes")
    ? (restaurant?.customerMenuTheme || "classic")
    : "classic";
  const menuTheme = getMenuTheme(themeId);

  const MENU = restaurant?.menu || [];
  const RESTAURANT = restaurant;

  const canSplit = hasFeature(tier, "split_bills");
  const canSecretMenu = hasFeature(tier, "vip_secret_menus");
  const canFastDelivery = hasFeature(restaurant?.tier || "starter", "fast_delivery");

  const fastDeliveryItems = useMemo(() => {
    if (!canFastDelivery) return [];
    return allItems.filter((i) => i.fastDelivery);
  }, [allItems, canFastDelivery]);

  const allItems = useMemo(() => MENU.flatMap((c) => c.items.map((i) => ({
    ...i,
    categoryId: c.id,
    categoryName: c.category,
  }))), [MENU]);

  if (menuLoading) {
    return (
      <div className={`min-h-screen menu-theme-${menuTheme.id} theme-screen flex items-center justify-center`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className={`min-h-screen menu-theme-${menuTheme.id} theme-screen flex items-center justify-center`}>
        <div className="text-center px-5">
          <p className="font-display text-xl font-semibold">Restaurant not found</p>
          <p className="mt-2 font-body text-sm text-ink-soft">This restaurant doesn't exist or hasn't been set up yet.</p>
        </div>
      </div>
    );
  }

  const cartLines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: allItems.find((i) => i.id === id), qty }));

  const subtotal = cartLines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const taxAmount = RESTAURANT.taxRate > 0 ? Math.round(subtotal * RESTAURANT.taxRate / 100) : 0;
  const serviceCharge = RESTAURANT.serviceChargeEnabled ? Math.round(subtotal * RESTAURANT.serviceChargeRate / 100) : 0;
  const total = subtotal + taxAmount + serviceCharge;
  const perHead = canSplit && splitCount > 1 ? Math.ceil(total / splitCount) : null;
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);

  function updateQty(id, delta) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));
  }

  // ─── Thank You Screen ──────────────────────────────────
  if (step === "confirmed") {
    const ord = lastOrder;
    return (
      <div className={`min-h-screen menu-theme-${menuTheme.id} theme-screen`}>
        {!embedded && <PortalBar title={isTakeaway ? "Takeaway · Thank You" : `Table ${tableId} · Thank You`} />}
        <div className="mx-auto max-w-md px-5 py-10">
          <div className="theme-card-sm p-5">
            <div className="flex items-center gap-2 text-sage">
              <CheckCircle2 size={20} />
              <span className="font-body text-sm font-semibold">Order placed</span>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">Thank you!</p>
            <p className="mt-1 font-body text-sm text-ink-soft">
              Your order has been placed successfully. The restaurant will confirm your UPI payment shortly.
            </p>

            {/* Receipt */}
            <div className="mt-5 theme-card-sm p-4">
              <p className="font-display text-sm font-semibold text-center">{RESTAURANT.name}</p>
              <p className="font-body text-[10px] text-center theme-soft">{RESTAURANT.address}</p>
              {RESTAURANT.gstNumber && (
                <p className="font-mono text-[10px] text-center theme-soft mt-0.5">GSTIN: {RESTAURANT.gstNumber}</p>
              )}
              <div className="perf-divider my-3" />
              <p className="font-mono text-xs theme-soft">{isTakeaway ? "Takeaway" : `Table ${tableId}`} · {orderType}</p>
              <ul className="mt-2 space-y-1 font-body text-sm">
                {cartLines.map((l) => (
                  <li key={l.item.id} className="flex justify-between">
                    <span>{l.qty}x {l.item.name}</span>
                    <span className="tabular">₹{l.item.price * l.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="perf-divider my-3" />
              <div className="space-y-1 font-body text-xs">
                <div className="flex justify-between"><span className="theme-soft">Subtotal</span><span className="tabular">₹{subtotal}</span></div>
                {taxAmount > 0 && <div className="flex justify-between"><span className="theme-soft">GST ({RESTAURANT.taxRate}%)</span><span className="tabular">₹{taxAmount}</span></div>}
                {serviceCharge > 0 && <div className="flex justify-between"><span className="theme-soft">Service Charge ({RESTAURANT.serviceChargeRate}%)</span><span className="tabular">₹{serviceCharge}</span></div>}
              </div>
              <div className="perf-divider my-3" />
              <div className="flex justify-between font-mono text-base font-semibold">
                <span>Total</span>
                <span className="tabular">₹{total}</span>
              </div>
              {ord?.id && (
                <p className="mt-2 font-mono text-[10px] text-center theme-soft">Order #{String(ord.id).slice(0, 8)}</p>
              )}
              {customerPhone && (
                <p className="mt-1 font-body text-[10px] text-center theme-soft">Receipt sent to {customerPhone}</p>
              )}
            </div>

            {/* E-Bill link */}
            {ord?.id && (
              <Link
                to={`/${restaurantId}/bill/${ord.id}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-full theme-btn-outline py-3 font-body text-sm font-semibold"
              >
                <ExternalLink size={15} /> View E-Bill
              </Link>
            )}

            {/* View My Orders link */}
            <Link
              to={`/${restaurantId}/dashboard?tab=orders${tableId && tableId !== "T1" ? `&table=${tableId}` : ""}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-full theme-btn-primary py-3 font-body text-sm font-semibold"
            >
              <ClipboardList size={15} /> View My Orders
            </Link>

            <div className="perf-divider my-5" />
            <p className="font-body text-sm font-semibold">Rate your visit</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}>
                  <Star
                    size={26}
                    className={n <= rating ? "fill-marigold text-marigold" : "theme-soft"}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && rating <= 2 && (
              <p className="mt-3 rounded bg-chili/10 px-3 py-2 font-body text-xs text-chili">
                Thanks for the honesty — the owner will see this immediately.
                {hasFeature(tier, "rescue_campaigns") && " A rescue offer may land in your WhatsApp shortly."}
              </p>
            )}
            {rating >= 4 && (
              <p className="mt-3 rounded bg-sage/10 px-3 py-2 font-body text-xs text-sage">
                Glad you enjoyed it! See you again soon.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout Screen ──────────────────────────────────
  if (step === "checkout") {
    return (
      <div className={`min-h-screen menu-theme-${menuTheme.id} theme-screen`}>
        {!embedded && <PortalBar title={isTakeaway ? "Takeaway · Checkout" : `Table ${tableId} · Checkout`} />}
        <div className="mx-auto max-w-md px-5 py-10">
          <div className="theme-card-sm p-5">
            <p className="font-display text-xl font-semibold">Review &amp; pay</p>
            <div className="perf-divider my-4" />
            <ul className="space-y-2 font-body text-sm">
              {cartLines.map((l) => (
                <li key={l.item.id} className="flex justify-between">
                  <span>{l.qty}x {l.item.name}</span>
                  <span className="tabular">₹{l.item.price * l.qty}</span>
                </li>
              ))}
            </ul>
            <div className="perf-divider my-4" />

            {/* Customer details */}
            <div className="mb-4 space-y-2">
              <div>
                <label className="font-body text-xs font-medium theme-soft">Your Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full theme-input" placeholder="Name (optional)" />
              </div>
              <div>
                <label className="font-body text-xs font-medium theme-soft">WhatsApp Number (for e-bill)</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 theme-soft" />
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 w-full theme-input pl-8" placeholder="+91XXXXXXXXXX" />
                </div>
              </div>
            </div>

            {canSplit ? (
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-1.5 font-body text-sm font-semibold">
                  <Users size={14} /> Split the bill
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSplitCount((n) => Math.max(1, n - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-dim"><Minus size={14} /></button>
                  <span className="tabular w-6 text-center font-semibold">{splitCount}</span>
                  <button onClick={() => setSplitCount((n) => n + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-dim"><Plus size={14} /></button>
                  <span className="ml-auto font-body text-xs text-ink-soft">people</span>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded theme-card-sm px-3 py-2 font-body text-xs theme-soft">
                <Lock size={12} /> Split bills unlocks on {TIERS.ecosystem.name} (₹{TIERS.ecosystem.price}/mo)
              </div>
            )}

            {/* Totals breakdown */}
            <div className="space-y-1 font-body text-xs mb-3">
              <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="tabular">₹{subtotal}</span></div>
              {taxAmount > 0 && <div className="flex justify-between"><span className="text-ink-soft">GST ({RESTAURANT.taxRate}%)</span><span className="tabular">₹{taxAmount}</span></div>}
              {serviceCharge > 0 && <div className="flex justify-between"><span className="text-ink-soft">Service ({RESTAURANT.serviceChargeRate}%)</span><span className="tabular">₹{serviceCharge}</span></div>}
            </div>

            <div className="flex justify-between font-mono text-base font-semibold">
              <span>{perHead ? `Per head x ${splitCount}` : "Total"}</span>
              <span className="tabular">₹{perHead ?? total}</span>
            </div>

            <button
              onClick={() => {
                setPayError("");
                if (!RESTAURANT.upiId) {
                  setPayError("This restaurant hasn't set up UPI payments yet. Please pay at the counter.");
                  return;
                }
                setStep("pay");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full theme-btn-primary py-3 font-body text-sm font-semibold"
            >
              <Wallet size={15} />
              Pay ₹{perHead ?? total} <ArrowRight size={15} />
            </button>
            {payError && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded bg-chili/10 px-3 py-2">
                <p className="font-body text-xs text-chili">{payError}</p>
              </div>
            )}
            <button onClick={() => setStep("menu")} className="mt-3 w-full font-body text-xs text-ink-soft underline">
              Back to menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── UPI Pay Screen ────────────────────────────────────
  if (step === "pay") {
    const payAmount = perHead ?? total;
    const upiArgs = {
      upiId: RESTAURANT.upiId,
      name: RESTAURANT.name,
      amount: payAmount,
      note: `${isTakeaway ? "Takeaway" : "Table " + tableId} ${restaurantId}`,
    };
    const upiUrl = buildUpiPay(upiArgs);
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

    async function placeOrder() {
      setPayError("");
      setCheckoutLoading(true);
      try {
        const cartItems = cartLines.map((l) => ({
          id: l.item.id,
          name: l.item.name,
          price: l.item.price,
          qty: l.qty,
          category_id: l.item.categoryId,
          category_name: l.item.categoryName,
        }));

        const { data: savedOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            restaurant_id: restaurantId,
            table_number: tableId,
            order_type: orderType,
            customer_name: customerName,
            customer_phone: customerPhone,
            items: cartItems,
            subtotal: subtotal,
            tax_amount: taxAmount,
            service_charge: serviceCharge,
            total: total,
            payment_status: "pending_verification",
            payment_method: "upi",
            upi_utr: utr.trim() ? utr.trim() : null,
            order_status: "placed",
          })
          .select()
          .single();

        if (orderError || !savedOrder) {
          console.error("Order save error:", orderError);
          throw new Error(orderError?.message || "Could not save order. Please try again.");
        }

        setLastOrder(savedOrder);
        setCheckoutLoading(false);
        setStep("confirmed");
      } catch (err) {
        setCheckoutLoading(false);
        setPayError("Could not place order: " + err.message);
      }
    }

    return (
      <div className={`min-h-screen menu-theme-${menuTheme.id} theme-screen`}>
        {!embedded && <PortalBar title={isTakeaway ? "Takeaway · Pay" : `Table ${tableId} · Pay`} />}
        <div className="mx-auto max-w-md px-5 py-10">
          <div className="theme-card-sm p-5">
            <p className="font-display text-xl font-semibold">Scan &amp; pay</p>
            <p className="mt-1 font-body text-xs text-ink-soft">
              Pay {RESTAURANT.name} directly via any UPI app. The restaurant confirms your payment at the counter.
            </p>

            {/* UPI QR */}
            <div className="mt-5 flex flex-col items-center rounded theme-card-sm p-5">
              <QRCodeSVG value={upiUrl} size={170} level="M" />
              <p className="mt-3 font-mono text-sm font-semibold">₹{payAmount}</p>
              <p className="mt-1 font-mono text-[11px] theme-soft">{RESTAURANT.upiId}</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.pkg}
                    onClick={() => {
                      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                      const url = isAndroid
                        ? buildUpiIntent(upiArgs, app)
                        : isIOS
                          ? buildUpiIosUrl(upiArgs, app)
                          : upiUrl;
                      window.open(url, "_blank");
                    }}
                    className="rounded-full theme-btn-outline px-2 py-2.5 font-body text-xs font-semibold transition-colors"
                  >
                    {app.name}
                  </button>
                ))}
              </div>

              <a
                href={upiUrl}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(upiUrl, "_blank");
                }}
                className="mt-2 block text-center font-body text-[11px] theme-soft underline"
              >
                Use another UPI app
              </a>
            </div>

            {/* UTR */}
            <div className="mt-4">
              <label className="font-body text-xs font-medium theme-soft">
                UTR number <span className="font-normal">(optional)</span>
              </label>
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="mt-1 w-full theme-input"
                placeholder="12-digit UTR from your UPI app"
                maxLength={12}
                inputMode="numeric"
              />
              {utr && !isValidUtr(utr) && (
                <p className="mt-1 font-body text-[10px] text-chili">UTR should be 12 digits — you can leave it blank.</p>
              )}
            </div>

            {/* I HAVE PAID button */}
            <button
              onClick={placeOrder}
              disabled={checkoutLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full theme-btn-primary py-3.5 font-body text-sm font-bold shadow-md disabled:opacity-60 transition-colors"
            >
              {checkoutLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Placing order...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> I HAVE PAID — Place order
                </>
              )}
            </button>
            <p className="mt-2 text-center font-body text-[11px] text-ink-soft">
              Tap after you've completed the UPI payment. Owner will verify and confirm.
            </p>
            {payError && (
              <div className="mt-2 rounded bg-chili/10 px-3 py-2">
                <p className="font-body text-xs text-chili">{payError}</p>
              </div>
            )}
            <button onClick={() => setStep("checkout")} className="mt-3 w-full font-body text-xs text-ink-soft underline">
              Back to cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Menu Screen ──────────────────────────────────────
  return (
    <div className={embedded ? "pb-28" : `menu-theme-${menuTheme.id} theme-screen pb-28`}>
      {!embedded && (
        <PortalBar
          title={isTakeaway ? "Takeaway Menu" : `Table ${tableId} · Menu`}
          right={
            !isTakeaway ? (
              <div className="flex overflow-hidden rounded-full border border-paper-line font-body text-xs font-semibold">
                {["dine-in", "takeaway"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-3 py-1.5 capitalize ${orderType === t ? "bg-ink text-paper" : "text-ink-soft"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <span className="rounded-full bg-marigold/20 px-3 py-1.5 font-body text-xs font-semibold text-marigold-dark">Takeaway</span>
            )
          }
        />
      )}

      <div className="mx-auto max-w-2xl px-5 py-8">
        {/* Fast Delivery Section */}
        {canFastDelivery && fastDeliveryItems.length > 0 && (
          <div className="mb-8 fast-delivery-section rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1">
                <Zap size={14} className="text-sage fill-sage" />
                <span className="font-body text-sm font-bold text-sage">Fast Delivery</span>
              </div>
              <span className="rounded-full bg-sage/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sage">Under 10 min</span>
            </div>
            <div className="space-y-2">
              {fastDeliveryItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between theme-card-sm px-3 py-3 gap-3">
                  {item.imageUrl && (
                    <div className="h-14 w-14 shrink-0 rounded overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${item.veg ? "bg-sage" : "bg-chili"}`} />
                      <p className="font-body text-sm font-semibold truncate">{item.name}</p>
                      <span className="rounded bg-sage/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-sage uppercase shrink-0">
                        <Zap size={8} className="inline -mt-0.5" /> Fast
                      </span>
                    </div>
                    <p className="mt-0.5 font-body text-xs text-ink-soft line-clamp-1">{item.desc}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="tabular font-mono text-sm">₹{item.price}</span>
                      {item.discount > 0 && (
                        <>
                          <span className="tabular font-mono text-xs text-ink-soft line-through">₹{item.originalPrice}</span>
                          <span className="font-body text-[10px] font-semibold text-chili">{item.discount}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cart[item.id] > 0 && (
                      <>
                        <button onClick={() => updateQty(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim">
                          <Minus size={13} />
                        </button>
                        <span className="tabular w-4 text-center text-sm font-semibold">{cart[item.id]}</span>
                      </>
                    )}
                    <button onClick={() => updateQty(item.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {MENU.map((cat) => {
          if (cat.id === "cat-secret" && !canSecretMenu) return null;
          return (
            <div key={cat.id} className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold">{cat.category}</h2>
                {cat.id === "cat-secret" && (
                  <span className="rounded-full bg-marigold/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-marigold-dark">VIP</span>
                )}
              </div>

              {cat.id === "cat-secret" && canSecretMenu && !secretUnlocked ? (
                <button
                  onClick={() => setSecretUnlocked(true)}
                  className="w-full rounded border border-dashed border-marigold-dark/50 bg-marigold/10 py-4 font-body text-sm font-semibold text-marigold-dark"
                >
                  Tap to reveal the secret menu
                </button>
              ) : (
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between theme-card-sm px-3 py-3 gap-3">
                      {/* Image */}
                      {item.imageUrl && (
                        <div className="h-16 w-16 shrink-0 rounded overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${item.veg ? "bg-sage" : "bg-chili"}`} />
                          <p className="font-body text-sm font-semibold truncate">{item.name}</p>
                          {item.offer && (
                            <span className="rounded bg-marigold/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-marigold-dark uppercase shrink-0">
                              {item.offer === "BOGO" ? "BOGO" : item.offer === "HOTDEAL" ? "HOT" : item.offer}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-body text-xs text-ink-soft line-clamp-1">{item.desc}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="tabular font-mono text-sm">₹{item.price}</span>
                          {item.discount > 0 && (
                            <>
                              <span className="tabular font-mono text-xs text-ink-soft line-through">₹{item.originalPrice}</span>
                              <span className="font-body text-[10px] font-semibold text-chili">{item.discount}% OFF</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Add/Qty controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cart[item.id] > 0 && (
                          <>
                            <button onClick={() => updateQty(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim">
                              <Minus size={13} />
                            </button>
                            <span className="tabular w-4 text-center text-sm font-semibold">{cart[item.id]}</span>
                          </>
                        )}
                        <button onClick={() => updateQty(item.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 theme-cart-bar">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-2 font-body text-sm">
              <ShoppingBag size={16} />
              <span className="tabular font-semibold">{cartCount} items</span>
              <span className="font-mono text-ink-soft">· ₹{total}</span>
            </div>
            <button
              onClick={() => setStep("checkout")}
              className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-paper"
            >
              Review order <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
