import { Lock } from "lucide-react";
import { TIERS } from "../lib/tiers";

export default function LockedFeature({ requiredTier, label }) {
  const tier = TIERS[requiredTier];
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-paper-line bg-paper-dim/60 px-6 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">
        <Lock size={16} />
      </div>
      <p className="font-body text-sm text-ink-soft">
        {label} unlocks on <span className="font-semibold text-ink">{tier.name}</span> (₹{tier.price}/mo)
      </p>
    </div>
  );
}
