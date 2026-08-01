import { TIERS, TIER_ORDER } from "../lib/tiers";
import { useTier } from "../lib/TierContext";

export default function TierSwitcher({ dark = false }) {
  const { tier, setTier } = useTier();

  return (
    <div
      className={`flex items-center gap-1 rounded-full p-1 text-xs font-semibold ${
        dark ? "bg-white/10" : "bg-paper-dim"
      }`}
    >
      {TIER_ORDER.map((t) => (
        <button
          key={t}
          onClick={() => setTier(t)}
          className={`rounded-full px-3 py-1.5 transition-colors cursor-pointer ${
            tier === t
              ? "bg-marigold text-ink"
              : dark
              ? "text-paper/70 hover:text-paper"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {TIERS[t].name}
        </button>
      ))}
    </div>
  );
}
