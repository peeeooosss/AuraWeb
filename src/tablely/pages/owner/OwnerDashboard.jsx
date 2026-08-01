import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  UtensilsCrossed,
  Users,
  TrendingUp,
  Package,
  ClipboardList,
  Settings,
  BarChart3,
  Contact,
  Table2,
  Link2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Volume2,
  VolumeX,
  CreditCard,
  Palette,
  Lock,
} from "lucide-react";
import PortalBar from "../../components/PortalBar";
import TicketCard from "../../components/TicketCard";
import PlanBadge from "../../components/PlanBadge";
import LockedFeature from "../../components/LockedFeature";
import BillingManager from "../../components/owner/BillingManager";
import MenuThemesManager from "../../components/owner/MenuThemesManager";
import OrderManager from "../../components/owner/OrderManager";
import StaffManager from "../../components/owner/StaffManager";
import MenuManager from "../../components/owner/MenuManager";
import RestaurantSettings from "../../components/owner/RestaurantSettings";
import ReportsDashboard from "../../components/owner/ReportsDashboard";
import CustomerDatabase from "../../components/owner/CustomerDatabase";
import TableManager from "../../components/owner/TableManager";
import { useTier } from "../../lib/TierContext";
import { useAuth } from "../../lib/AuthContext";
import { hasFeature } from "../../lib/tiers";
import { getRestaurant } from "../../lib/db";
import { useAudioAlert } from "../../hooks/useAudioAlert";
import useRestaurantOrders from "../../hooks/useRestaurantOrders";
import { calculateAnalytics, buildCustomerAnalytics } from "../../lib/analytics";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "staff", label: "Staff", icon: Users },
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "links", label: "Links", icon: Link2 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "customers", label: "Customers", icon: Contact },
  { id: "billing", label: "Billing", icon: CreditCard },
];

function OwnerDashboardInner() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tier, applyRestaurantTier } = useTier();
  const [tab, setTab] = useState("overview");
  const [copiedLink, setCopiedLink] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orders, loading: ordersLoading, error: ordersError } = useRestaurantOrders(restaurantId);
  const { play: playAlert, isMuted, toggleMute } = useAudioAlert();
  const prevOrderCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    getRestaurant(restaurantId).then((r) => {
      setRestaurant(r);
      applyRestaurantTier(r?.tier);
      setLoading(false);
    });
  }, [restaurantId]);

  // Track order count and play alert on new orders
  useEffect(() => {
    const currentOrderCount = orders.length;
    if (isInitialLoadRef.current) {
      prevOrderCountRef.current = currentOrderCount;
      isInitialLoadRef.current = false;
    } else if (currentOrderCount > prevOrderCountRef.current) {
      playAlert();
    }
    prevOrderCountRef.current = currentOrderCount;
  }, [orders.length, playAlert]);

  function refreshRestaurant() {
    getRestaurant(restaurantId).then((r) => { if (r) setRestaurant(r); });
  }

  // Live owner data only. Demo fixtures remain isolated inside /demo.
  const MENU = restaurant?.menu || [];
  const TABLES = restaurant?.tables || [];
  const STAFF_DATA = restaurant?.staff || [];
  const RESTAURANT_DATA = restaurant || {};
  const analytics = calculateAnalytics(orders, MENU);
  const customers = buildCustomerAnalytics(orders);

  // 404 if restaurant not found
  if (loading) return <div className="p-10 text-center text-ink-muted font-body">Loading...</div>;
  if (restaurantId && !restaurant) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold mb-2">Restaurant Not Found</h1>
          <p className="font-body text-ink-soft mb-4">This restaurant doesn't exist or hasn't been onboarded yet.</p>
          <Link to="/" className="rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-paper hover:bg-ink-soft transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar
        title={restaurant ? `${restaurant.name} — Owner` : "Owner Command Center"}
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
        onSignOut={() => { signOut(); navigate("/login"); }}
      />

      <PlanBadge onClick={() => setTab("billing")} />

      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-8">
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
          {tab === "overview" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Today at a glance</h1>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Revenue today</p>
                  <p className="mt-2 font-display text-3xl font-semibold">₹{analytics.todayRevenue.toLocaleString()}</p>
                  <p className="mt-1 flex items-center gap-1 font-body text-xs text-sage"><TrendingUp size={12} /> From completed orders</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Active orders</p>
                  <p className="mt-2 font-display text-3xl font-semibold">{analytics.activeOrders}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">Live from Supabase</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Average order</p>
                  <p className="mt-2 font-display text-3xl font-semibold">₹{analytics.averageOrderValue.toLocaleString()}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">{analytics.totalOrders} completed orders</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Collected revenue</p>
                  <p className="mt-2 font-display text-3xl font-semibold">₹{analytics.collectedRevenue.toLocaleString()}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">Payment confirmed</p>
                </TicketCard>
              </div>

              {hasFeature(tier, "predictive_inventory_alerts") ? (
                <div className="mt-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                    <Package size={16} /> Predictive inventory alerts
                  </h2>
                  <TicketCard>
                    <p className="py-3 text-center font-body text-sm text-ink-soft">Inventory tracking will appear once stock levels are configured.</p>
                  </TicketCard>
                </div>
              ) : (
                <div className="mt-6">
                  <LockedFeature requiredTier="ecosystem" label="Predictive inventory alerts" />
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Top dish</p>
                  <p className="mt-2 font-display text-xl font-semibold">{analytics.topItems[0]?.name || "No completed orders"}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">{analytics.topItems[0] ? `${analytics.topItems[0].units} units sold` : "Sales insights appear after orders are completed."}</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Top category</p>
                  <p className="mt-2 font-display text-xl font-semibold">{analytics.topCategories[0]?.name || "No category data"}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">{analytics.topCategories[0] ? `${analytics.topCategories[0].units} units sold` : "Add categorized menu items to unlock this insight."}</p>
                </TicketCard>
                <TicketCard>
                  <p className="font-body text-xs uppercase tracking-wide text-ink-soft">Best table</p>
                  <p className="mt-2 font-display text-xl font-semibold">{analytics.tablePerformance[0]?.name || "No table data"}</p>
                  <p className="mt-1 font-body text-xs text-ink-soft">{analytics.tablePerformance[0] ? `₹${analytics.tablePerformance[0].revenue.toLocaleString()} revenue` : "Table performance appears after completed orders."}</p>
                </TicketCard>
              </div>

              {ordersError && <p className="mt-4 rounded bg-chili/10 px-3 py-2 font-body text-xs text-chili">Could not load live orders: {ordersError}</p>}
              {ordersLoading && <p className="mt-4 font-body text-xs text-ink-soft">Refreshing live order data...</p>}

              {/* Quick link to Orders */}
              <div className="mt-6">
                <button onClick={() => setTab("orders")} className="flex items-center gap-2 rounded border border-paper-line bg-white/50 px-4 py-3 font-body text-sm font-semibold text-ink hover:bg-paper-dim transition-colors">
                  <ClipboardList size={16} /> View live orders →
                </button>
              </div>
            </div>
          )}

          {tab === "orders" && <OrderManager restaurantId={restaurantId} restaurant={restaurant} />}
          {tab === "menu" && <MenuManager initialMenu={MENU} restaurantId={restaurantId} onSaved={refreshRestaurant} />}
          {tab === "staff" && <StaffManager initialStaff={STAFF_DATA} restaurantId={restaurantId} />}
          {tab === "settings" && <RestaurantSettings restaurant={RESTAURANT_DATA} restaurantId={restaurantId} onSaved={refreshRestaurant} />}
          {tab === "reports" && (
              hasFeature(tier, "reports_analytics") ? (
                <ReportsDashboard analytics={analytics} />
              ) : (
                <LockedFeature requiredTier="ecosystem" label="Reports & analytics" />
              )
            )}
          {tab === "customers" && <CustomerDatabase customers={customers} />}
          {tab === "tables" && <TableManager initialTables={TABLES} orders={orders} restaurant={RESTAURANT_DATA} restaurantId={restaurantId} />}
          {tab === "billing" && <BillingManager restaurant={RESTAURANT_DATA} restaurantId={restaurantId} onPlanChanged={refreshRestaurant} />}
          {tab === "themes" && <MenuThemesManager restaurantId={restaurantId} restaurant={RESTAURANT_DATA} onSaved={refreshRestaurant} />}

          {tab === "links" && (
            <div>
              <h1 className="font-display text-2xl font-semibold">Portal Links</h1>
              <p className="mt-1 font-body text-sm text-ink-soft">Share these URLs with your team and customers.</p>

              <div className="mt-6 space-y-4">
                {/* Owner Dashboard */}
                <div className="rounded-lg border border-paper-line bg-white/60 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold/15">
                      <Settings size={14} className="text-marigold-dark" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold">Owner Dashboard</p>
                      <p className="font-body text-xs text-ink-soft">Your personal admin panel — bookmark this!</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                      {window.location.origin}/{restaurantId}/owner
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${restaurantId}/owner`);
                        setCopiedLink("owner");
                        setTimeout(() => setCopiedLink(null), 2000);
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line hover:bg-paper-dim transition-colors"
                    >
                      {copiedLink === "owner" ? <CheckCircle2 size={14} className="text-sage" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Staff Dashboard — blurred for Starter */}
                {hasFeature(tier, "staff_portal_full") ? (
                  <div className="rounded-lg border border-paper-line bg-white/60 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15">
                        <Users size={14} className="text-sage" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold">Staff Dashboard</p>
                        <p className="font-body text-xs text-ink-soft">Share with waiters &amp; kitchen staff to manage live orders.</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                        {window.location.origin}/{restaurantId}/staff
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/${restaurantId}/staff`);
                          setCopiedLink("staff");
                          setTimeout(() => setCopiedLink(null), 2000);
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line hover:bg-paper-dim transition-colors"
                      >
                        {copiedLink === "staff" ? <CheckCircle2 size={14} className="text-sage" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-paper-line bg-white/60 p-5 opacity-60 pointer-events-none blur-[2px] select-none">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15">
                        <Users size={14} className="text-sage" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold">Staff Dashboard</p>
                        <p className="font-body text-xs text-ink-soft">Share with waiters &amp; kitchen staff to manage live orders.</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                        {window.location.origin}/{restaurantId}/staff
                      </code>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line">
                        <Copy size={14} />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-body text-xs font-semibold text-paper">
                        <Lock size={12} /> Upgrade to Ecosystem to unlock
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Order Portal */}
                <div className="rounded-lg border border-paper-line bg-white/60 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chili/10">
                      <UtensilsCrossed size={14} className="text-chili" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold">Customer Order Portal</p>
                      <p className="font-body text-xs text-ink-soft">Base link for table QR codes — generate specific table QRs in the Tables tab.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                      {window.location.origin}/{restaurantId}/login?table=T1
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${restaurantId}/login?table=T1`);
                        setCopiedLink("order");
                        setTimeout(() => setCopiedLink(null), 2000);
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line hover:bg-paper-dim transition-colors"
                    >
                      {copiedLink === "order" ? <CheckCircle2 size={14} className="text-sage" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Takeaway Link */}
                <div className="rounded-lg border border-paper-line bg-white/60 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold/15">
                      <ExternalLink size={14} className="text-marigold-dark" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold">Takeaway Portal</p>
                      <p className="font-body text-xs text-ink-soft">Direct takeaway link for walk-in customers without a table.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded border border-paper-line bg-paper-dim/50 px-3 py-2 font-mono text-xs text-ink-soft">
                      {window.location.origin}/{restaurantId}/login?table=TA
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${restaurantId}/login?table=TA`);
                        setCopiedLink("takeaway");
                        setTimeout(() => setCopiedLink(null), 2000);
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paper-line hover:bg-paper-dim transition-colors"
                    >
                      {copiedLink === "takeaway" ? <CheckCircle2 size={14} className="text-sage" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  return <OwnerDashboardInner />;
}
