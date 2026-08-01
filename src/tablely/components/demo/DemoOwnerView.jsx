import { useState } from "react";
import {
  LayoutGrid, UtensilsCrossed, Users, Wallet, Megaphone, Star,
  TrendingUp, Package, Send, Image as ImageIcon, ClipboardList,
  Settings, BarChart3, Contact, Table2, Link2, Copy, CheckCircle2,
  ExternalLink,
} from "lucide-react";
import TicketCard from "../TicketCard";
import TierSwitcher from "../TierSwitcher";
import LockedFeature from "../LockedFeature";
import OrderCard from "../owner/OrderCard";
import ReportsDashboard from "../owner/ReportsDashboard";
import CustomerDatabase from "../owner/CustomerDatabase";
import { useTier } from "../../lib/TierContext";
import { hasFeature, BILLING } from "../../lib/tiers";
import { MENU } from "../../data/menu";
import { ORDERS, TABLES, STAFF, CUSTOMERS, REVIEWS, WALLET, REPORTS_DATA } from "../../data/orders";
import { RESTAURANT } from "../../data/restaurant";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "staff", label: "Staff", icon: Users },
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "links", label: "Links", icon: Link2 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "customers", label: "Customers", icon: Contact },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "reviews", label: "Reviews", icon: Star },
];

export default function DemoOwnerView() {
  const { tier } = useTier();
  const [tab, setTab] = useState("overview");
  const [copiedLink, setCopiedLink] = useState(null);
  const [demoOrders, setDemoOrders] = useState(ORDERS);

  const todayRevenue = demoOrders.filter((o) => o.status === "completed" && o.placedDate === "2026-07-22").reduce((s, o) => s + o.total, 0);
  const activeCount = demoOrders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).length;

  function advanceStatus(orderId) {
    setDemoOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const next = { placed: "accepted", accepted: "preparing", preparing: "ready", ready: "completed" }[o.status];
      return next ? { ...o, status: next } : o;
    }));
  }

  function acceptOrder(orderId) {
    setDemoOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "accepted" } : o));
  }

  function cancelOrder(orderId) {
    setDemoOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
  }

  const live = demoOrders.filter((o) => ["placed", "accepted", "preparing", "ready"].includes(o.status));

  return (
    <div>
      <div className="fixed bottom-16 left-4 z-40 md:bottom-4">
        <div className="rounded-full bg-paper shadow-[0_8px_24px_-8px_rgba(23,24,28,0.4)] ring-1 ring-paper-line">
          <TierSwitcher />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6">
        {/* Side nav */}
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left font-body text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
                }`}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-paper-line bg-paper/95 px-2 py-2 backdrop-blur md:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 flex-col items-center gap-0.5 px-3 py-1 font-body text-[10px] font-medium ${
                tab === t.id ? "text-marigold-dark" : "text-ink-soft"
              }`}
            >
              <t.icon size={16} /> {t.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pb-24 md:pb-16">
          {/* ── Overview ── */}
          {tab === "overview" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Today at a glance</h1>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Revenue today</p>
                  <p className="mt-2 font-display text-3xl font-semibold">₹{todayRevenue}</p>
                  <p className="mt-1 flex items-center gap-1 font-body text-xs text-sage"><TrendingUp size={12} /> Live</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Active orders</p>
                  <p className="mt-2 font-display text-3xl font-semibold">{activeCount}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">across {new Set(demoOrders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).map((o) => o.table)).size} tables</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Avg. rating (7d)</p>
                  <p className="mt-2 font-display text-3xl font-semibold">4.3</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">{REVIEWS.filter((r) => r.stars <= 2).length} reviews need attention</p>
                </TicketCard>
              </div>

              {hasFeature(tier, "predictive_inventory_alerts") ? (
                <div className="mt-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                    <Package size={16} /> Predictive inventory alerts
                  </h2>
                  <TicketCard>
                    <ul className="space-y-2 font-body text-sm">
                      <li className="flex justify-between"><span>Paneer</span><span className="text-chili">Restock by tomorrow — selling 2x usual pace</span></li>
                      <li className="flex justify-between"><span>Maggi noodles</span><span className="text-marigold-dark">3 days of stock left</span></li>
                    </ul>
                  </TicketCard>
                </div>
              ) : (
                <div className="mt-6">
                  <LockedFeature requiredTier="ecosystem" label="Predictive inventory alerts" />
                </div>
              )}

              <div className="mt-6">
                <button onClick={() => setTab("orders")} className="flex items-center gap-2 rounded border border-paper-line bg-white/50 px-4 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors">
                  <ClipboardList size={16} /> View live orders →
                </button>
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === "orders" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-5">Order Management</h1>
              <div className="space-y-3">
                {live.length === 0 ? (
                  <p className="py-10 text-center font-body text-sm text-ink-soft">No live orders right now.</p>
                ) : (
                  live.map((o) => (
                    <OrderCard key={o.id} order={o} restaurant={RESTAURANT} onAccept={acceptOrder} onAdvance={advanceStatus} onCancel={cancelOrder} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Menu ── */}
          {tab === "menu" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-5">Menu Management</h1>
              <p className="mb-4 font-body text-sm text-ink-soft">Browse the demo menu. In production, you can add, edit, and remove items.</p>
              {MENU.map((cat) => (
                <div key={cat.id} className="mb-6">
                  <h2 className="mb-2 font-display text-base font-semibold">{cat.category}</h2>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <TicketCard key={item.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded object-cover" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-sm border flex items-center justify-center ${item.veg ? "border-green-600" : "border-red-600"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`} />
                                </span>
                                <p className="font-body text-sm font-semibold">{item.name}</p>
                              </div>
                              <p className="font-body text-xs text-ink-soft">{item.desc}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-semibold">₹{item.price}</p>
                            {item.discount > 0 && <p className="font-body text-[10px] text-sage">{item.discount}% off</p>}
                          </div>
                        </div>
                      </TicketCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Staff ── */}
          {tab === "staff" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-5">Staff Management</h1>
              <div className="space-y-2">
                {STAFF.map((s) => (
                  <TicketCard key={s.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm font-semibold">{s.name}</p>
                        <p className="font-body text-xs text-ink-soft">{s.role} · {s.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-ink-soft">{s.tablesServed} tables served</p>
                        <p className="font-mono text-xs text-ink-soft">{s.avgResponseMin}m avg response</p>
                      </div>
                    </div>
                  </TicketCard>
                ))}
              </div>
            </div>
          )}

          {/* ── Tables ── */}
          {tab === "tables" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-5">Table Management</h1>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
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
                    <p className="font-body text-[10px] text-ink-soft">{t.seats} seats</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Links ── */}
          {tab === "links" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-1">Portal Links</h1>
              <p className="mb-5 font-body text-sm text-ink-soft">Share these URLs with your team and customers.</p>
              <div className="space-y-4">
                {[
                  { label: "Owner Dashboard", icon: Settings, color: "marigold", path: "/demo?tab=owner" },
                  { label: "Staff Dashboard", icon: Users, color: "sage", path: "/demo?tab=staff" },
                  { label: "Customer Order Portal", icon: UtensilsCrossed, color: "chili", path: "/demo?tab=customer" },
                ].map((link) => (
                  <div key={link.label} className="rounded-lg border border-paper-line bg-white/60 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-${link.color}/15`}>
                        <link.icon size={14} className={`text-${link.color}-dark`} />
                      </div>
                      <p className="font-body text-sm font-semibold">{link.label}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                        {window.location.origin}{link.path}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${link.path}`);
                          setCopiedLink(link.label);
                          setTimeout(() => setCopiedLink(null), 2000);
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line hover:bg-paper-dim transition-colors"
                      >
                        {copiedLink === link.label ? <CheckCircle2 size={14} className="text-sage" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {tab === "settings" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-5">Restaurant Settings</h1>
              <TicketCard>
                <div className="space-y-3 font-body text-sm">
                  <div className="flex justify-between"><span className="text-ink-soft">Name</span><span className="font-semibold">{RESTAURANT.name}</span></div>
                  <div className="flex justify-between"><span className="text-ink-soft">Phone</span><span>{RESTAURANT.phone}</span></div>
                  <div className="flex justify-between"><span className="text-ink-soft">Email</span><span>{RESTAURANT.email}</span></div>
                  <div className="flex justify-between"><span className="text-ink-soft">Address</span><span className="text-right max-w-[60%]">{RESTAURANT.address}</span></div>
                  <div className="perf-divider" />
                  <div className="flex justify-between"><span className="text-ink-soft">GST Number</span><span className="font-mono text-xs">{RESTAURANT.gstNumber}</span></div>
                  <div className="flex justify-between"><span className="text-ink-soft">Tax Rate</span><span>{RESTAURANT.taxRate}%</span></div>
                  <div className="flex justify-between"><span className="text-ink-soft">UPI ID</span><span className="font-mono text-xs">{RESTAURANT.upiId}</span></div>
                </div>
              </TicketCard>
            </div>
          )}

          {/* ── Reports ── */}
          {tab === "reports" && (
            hasFeature(tier, "reports_analytics") ? (
              <ReportsDashboard reports={REPORTS_DATA} />
            ) : (
              <LockedFeature requiredTier="ecosystem" label="Reports & analytics" />
            )
          )}

          {/* ── Customers ── */}
          {tab === "customers" && <CustomerDatabase customers={CUSTOMERS} />}

          {/* ── Wallet ── */}
          {tab === "wallet" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Wallet &amp; billing</h1>
              <p className="mt-1 font-body text-sm text-ink-soft">Prepaid credits fund every WhatsApp message the system sends.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Wallet balance</p>
                  <p className="mt-2 tabular text-3xl font-semibold">₹{WALLET.balance.toFixed(2)}</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Utility messages today</p>
                  <p className="mt-2 tabular text-3xl font-semibold">{WALLET.utilitySentToday}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">₹{BILLING.utilityMessageCost.toFixed(2)} each</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Marketing messages today</p>
                  <p className="mt-2 tabular text-3xl font-semibold">{WALLET.marketingSentToday}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">₹{BILLING.marketingMessageCost.toFixed(2)} each</p>
                </TicketCard>
              </div>
              <button className="mt-5 rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-paper">Recharge wallet</button>
            </div>
          )}

          {/* ── Marketing ── */}
          {tab === "marketing" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Automated marketing</h1>
              {hasFeature(tier, "automated_marketing") ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TicketCard>
                    <p className="flex items-center gap-2 font-body text-sm font-semibold"><Send size={14} /> WhatsApp blast</p>
                    <p className="mt-2 font-body text-sm text-ink-soft">"Rains outside, hot Adrak Chai inside — 20% off till 6PM."</p>
                    <button className="mt-3 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper">Send to {CUSTOMERS.length} regulars</button>
                  </TicketCard>
                  <TicketCard>
                    <p className="flex items-center gap-2 font-body text-sm font-semibold"><ImageIcon size={14} /> Poster generator</p>
                    <p className="mt-2 font-body text-sm text-ink-soft">Auto-generated Instagram poster for today's special.</p>
                    <button className="mt-3 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper">Generate poster</button>
                  </TicketCard>
                </div>
              ) : (
                <div className="mt-5">
                  <LockedFeature requiredTier="growth" label="Automated marketing & WhatsApp blasts" />
                </div>
              )}
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === "reviews" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Reviews</h1>
              <div className="mt-5 space-y-3">
                {REVIEWS.map((r) => (
                  <TicketCard key={r.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < r.stars ? "fill-marigold text-marigold" : "text-paper-line"} />
                        ))}
                      </div>
                      <span className="font-mono text-xs text-ink-soft">Table {r.table}</span>
                    </div>
                    <p className="mt-2 font-body text-sm">{r.text}</p>
                    {r.stars <= 2 && (
                      hasFeature(tier, "rescue_campaigns") ? (
                        <button disabled={r.rescued} className={`mt-3 rounded-full px-4 py-2 font-body text-xs font-semibold ${r.rescued ? "bg-paper-dim text-ink-soft" : "bg-chili text-paper"}`}>
                          {r.rescued ? "Rescue sent ✓" : "One-click rescue offer"}
                        </button>
                      ) : (
                        <div className="mt-3"><LockedFeature requiredTier="ecosystem" label="One-click rescue campaigns" /></div>
                      )
                    )}
                  </TicketCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
