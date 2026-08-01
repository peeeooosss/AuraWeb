import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown, LayoutDashboard, UtensilsCrossed, ExternalLink } from "lucide-react";
import Logo from "../components/Logo";
import DemoOwnerView from "../components/demo/DemoOwnerView";
import DemoStaffView from "../components/demo/DemoStaffView";
import DemoCustomerView from "../components/demo/DemoCustomerView";

const TABS = [
  { id: "owner", label: "Owner Dashboard", icon: Crown },
  { id: "staff", label: "Staff Dashboard", icon: LayoutDashboard },
  { id: "customer", label: "Customer Menu", icon: UtensilsCrossed },
];

export default function Demo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "owner";
  const [tab, setTab] = useState(initialTab);

  function switchTab(newTab) {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-paper-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-marigold/15 px-2.5 py-0.5 font-body text-[10px] font-semibold text-marigold-dark">DEMO</span>
          </div>

          {/* Tab bar — desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </nav>

          <a
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-paper-line px-4 py-2 font-body text-sm font-medium text-ink-soft hover:bg-paper-dim transition-colors"
          >
            Exit Demo <ExternalLink size={12} />
          </a>
        </div>

        {/* Tab bar — mobile */}
        <div className="flex border-t border-paper-line md:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 font-body text-[10px] font-medium ${
                tab === t.id ? "text-marigold-dark border-b-2 border-marigold" : "text-ink-soft"
              }`}
            >
              <t.icon size={16} /> {t.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      {/* Demo banner */}
      <div className="bg-marigold/10 border-b border-marigold/20 px-5 py-2.5 text-center">
        <p className="font-body text-xs text-marigold-dark">
          This is a live demo with sample data. <a href="/" className="font-semibold underline">Book a demo</a> to see it with your restaurant.
        </p>
      </div>

      {/* Content */}
      <main>
        {tab === "owner" && <DemoOwnerView />}
        {tab === "staff" && <DemoStaffView />}
        {tab === "customer" && <DemoCustomerView />}
      </main>

      {/* Floating CTA */}
      <a
        href="/"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-marigold px-5 py-3 font-body text-sm font-semibold text-ink shadow-lg hover:bg-marigold-dark hover:text-paper transition-colors"
      >
        Book a Demo
      </a>
    </div>
  );
}
