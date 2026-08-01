import { Sparkles } from "lucide-react";
import { useTier } from "../lib/TierContext";
import { TIERS } from "../lib/tiers";

// Fixed bottom-left indicator showing the restaurant's current plan.
// Pass onClick (owner dashboard → open Billing) to make it actionable.
export default function PlanBadge({ onClick = null }) {
  const { tier } = useTier();
  const plan = TIERS[tier] || TIERS.starter;

  return (
    <div className="fixed bottom-16 left-4 z-40 md:bottom-4">
      <button
        onClick={onClick}
        disabled={!onClick}
        className={`flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 font-body text-xs font-semibold text-paper shadow-[0_8px_24px_-8px_rgba(23,24,28,0.5)] transition-colors ${
          onClick ? "cursor-pointer hover:bg-ink-soft" : "cursor-default"
        }`}
        title={onClick ? "Manage your plan" : "Current plan"}
      >
        <Sparkles size={12} className="text-marigold" />
        <span>
          {plan.name} plan
          {onClick && <span className="ml-1 text-paper/60">· manage</span>}
        </span>
      </button>
    </div>
  );
}
