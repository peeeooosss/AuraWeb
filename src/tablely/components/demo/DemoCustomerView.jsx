import { useState } from "react";
import { Plus, Minus, ShoppingBag, Star, CheckCircle2, ArrowRight } from "lucide-react";
import TicketCard from "../TicketCard";
import { MENU } from "../../data/menu";
import { RESTAURANT } from "../../data/restaurant";

export default function DemoCustomerView() {
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState(MENU[0]?.id || "");
  const [step, setStep] = useState("menu");
  const [rating, setRating] = useState(0);
  const [orderType, setOrderType] = useState("dine-in");

  const cartLines = Object.entries(cart)
    .map(([id, qty]) => {
      for (const cat of MENU) {
        const item = cat.items.find((i) => i.id === id);
        if (item) return { item, qty };
      }
      return null;
    })
    .filter(Boolean);

  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const taxAmount = Math.round(subtotal * (RESTAURANT.taxRate || 5) / 100);
  const total = subtotal + taxAmount;

  function addToCart(itemId) {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  }

  function removeFromCart(itemId) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] > 1) next[itemId]--;
      else delete next[itemId];
      return next;
    });
  }

  const activeItems = MENU.find((c) => c.id === activeCategory)?.items || [];

  if (step === "success") {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/20">
          <CheckCircle2 size={32} className="text-sage" />
        </div>
        <h2 className="font-display text-2xl font-semibold">Order Placed!</h2>
        <p className="mt-2 font-body text-sm text-ink-soft">
          Your order has been sent to the kitchen. Thank you for dining with us!
        </p>
        <p className="mt-1 font-mono text-xs text-ink-soft">Order #DEMO-{Date.now().toString().slice(-4)}</p>

        <div className="mt-8">
          <p className="mb-3 font-body text-sm font-medium">Rate your experience</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star size={28} className={s <= rating ? "fill-marigold text-marigold" : "text-paper-line"} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-3 font-body text-xs text-sage">Thanks for your feedback!</p>
          )}
        </div>

        <button
          onClick={() => { setStep("menu"); setCart({}); setRating(0); }}
          className="mt-8 rounded-full bg-ink px-6 py-2.5 font-body text-sm font-semibold text-paper hover:bg-ink-soft"
        >
          Order Again
        </button>
      </div>
    );
  }

  if (step === "checkout") {
    return (
      <div className="mx-auto max-w-md px-5 py-10">
        <h2 className="font-display text-xl font-semibold mb-5">Checkout</h2>
        <TicketCard>
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-sm font-medium">{orderType === "takeaway" ? "Takeaway" : "Dine-in"}</span>
            <button onClick={() => setStep("menu")} className="font-body text-xs text-marigold-dark underline">Edit</button>
          </div>
          <ul className="space-y-1.5 font-body text-sm">
            {cartLines.map(({ item, qty }) => (
              <li key={item.id} className="flex justify-between">
                <span>{qty}× {item.name}</span>
                <span className="tabular">₹{item.price * qty}</span>
              </li>
            ))}
          </ul>
          <div className="perf-divider my-3" />
          <div className="space-y-1 font-body text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="tabular">₹{subtotal}</span></div>
            <div className="flex justify-between"><span>GST ({RESTAURANT.taxRate}%)</span><span className="tabular">₹{taxAmount}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span className="tabular">₹{total}</span></div>
          </div>
        </TicketCard>

        <button
          onClick={() => setStep("success")}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Pay ₹{total} with UPI — Place Order
        </button>
        <p className="mt-2 text-center font-body text-[10px] text-ink-soft">Simulated checkout — no real payment required. In production, a UPI QR to the restaurant's own UPI ID appears here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Dine-in / Takeaway toggle */}
      <div className="px-5 pt-5">
        <div className="flex gap-2">
          {["dine-in", "takeaway"].map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`rounded-full px-4 py-1.5 font-body text-xs font-semibold capitalize transition-colors ${
                orderType === t ? "bg-ink text-paper" : "border border-paper-line text-ink-soft hover:bg-paper-dim"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-16 z-10 bg-paper border-b border-paper-line">
        <div className="flex gap-1 overflow-x-auto px-5 py-2">
          {MENU.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 font-body text-xs font-medium transition-colors ${
                activeCategory === cat.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="px-5 py-4 space-y-3">
        {activeItems.map((item) => (
          <TicketCard key={item.id}>
            <div className="flex gap-3">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center ${item.veg ? "border-green-600" : "border-red-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`} />
                  </span>
                  <p className="font-body text-sm font-semibold truncate">{item.name}</p>
                </div>
                <p className="mt-0.5 font-body text-xs text-ink-soft line-clamp-1">{item.desc}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">₹{item.price}</span>
                  {item.discount > 0 && (
                    <span className="rounded bg-sage/15 px-1.5 py-0.5 font-body text-[10px] font-semibold text-sage">{item.discount}% off</span>
                  )}
                  {item.offer && (
                    <span className="rounded bg-marigold/15 px-1.5 py-0.5 font-body text-[10px] font-semibold text-marigold-dark">{item.offer}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                {cart[item.id] ? (
                  <div className="flex items-center gap-2 rounded-full border border-paper-line bg-white">
                    <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-ink-soft hover:text-ink">
                      <Minus size={12} />
                    </button>
                    <span className="font-mono text-xs font-semibold w-4 text-center">{cart[item.id]}</span>
                    <button onClick={() => addToCart(item.id)} className="h-7 w-7 flex items-center justify-center text-ink-soft hover:text-ink">
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item.id)}
                    className="rounded-full border border-paper-line px-3 py-1.5 font-body text-xs font-semibold text-ink hover:bg-paper-dim transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </TicketCard>
        ))}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-5 md:bottom-8">
          <button
            onClick={() => setStep("checkout")}
            className="flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-3.5 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-ink">
                {cartCount}
              </span>
              <span className="font-body text-sm font-semibold text-paper">View Cart</span>
            </div>
            <span className="font-mono text-sm font-semibold text-paper">₹{total} <ArrowRight size={14} className="inline" /></span>
          </button>
        </div>
      )}
    </div>
  );
}
