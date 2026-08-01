import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import TicketCard from "../TicketCard";
import LockedFeature from "../LockedFeature";
import { THEMES } from "../../lib/menuThemes";
import { hasFeature } from "../../lib/tiers";
import { updateRestaurant } from "../../lib/db";
import { useTier } from "../../lib/TierContext";

export default function MenuThemesManager({ restaurantId, restaurant, onSaved }) {
  const { tier } = useTier();
  const currentTheme = restaurant?.customerMenuTheme || "classic";
  const [selected, setSelected] = useState(currentTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(currentTheme);
  }, [currentTheme]);

  const canUseThemes = hasFeature(tier, "customer_menu_themes");

  async function handleSave() {
    if (selected === currentTheme) return;
    setSaving(true);
    try {
      const result = await updateRestaurant(restaurantId, { customerMenuTheme: selected });
      if (!result) throw new Error("Failed to save theme");
      if (onSaved) onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  if (!canUseThemes) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-5">Menu Themes</h1>
        <p className="font-body text-sm text-ink-soft mb-6">
          Customize how your customer menu looks. Choose from 3 distinct themes.
        </p>
        <LockedFeature requiredTier="ecosystem" label="Customer menu themes" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-5">Menu Themes</h1>
      <p className="font-body text-sm text-ink-soft mb-6">
        Pick a visual theme for your customer-facing menu. Changes apply instantly.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelected(theme.id)}
            className={`relative rounded-lg border-2 p-5 text-left transition-all ${
              selected === theme.id
                ? "border-marigold bg-marigold/5 shadow-sm"
                : "border-paper-line bg-white/40 hover:border-marigold/40"
            }`}
          >
            {/* Theme preview swatch */}
            <div className="flex gap-1.5 mb-3">
              {theme.swatches.map((color, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.1)" }}
                />
              ))}
            </div>

            <p className="font-display text-base font-semibold">{theme.name}</p>
            <p className="mt-1 font-body text-xs text-ink-soft">{theme.tagline}</p>

            {selected === theme.id && (
              <div className="mt-3 flex items-center gap-1.5 font-body text-xs font-semibold text-marigold-dark">
                <Check size={12} /> Selected
              </div>
            )}

            {currentTheme === theme.id && selected !== theme.id && (
              <p className="mt-2 font-body text-[10px] text-ink-soft">Currently active</p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || selected === currentTheme}
          className="flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 font-body text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-60"
        >
          {saving ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper border-t-transparent" />
          ) : (
            <Palette size={15} />
          )}
          {saving ? "Saving..." : "Save Theme"}
        </button>
        {saved && <span className="font-body text-xs text-sage font-semibold">Saved!</span>}
        {selected !== currentTheme && !saved && (
          <span className="font-body text-xs text-ink-soft">Changes will apply on next page load</span>
        )}
      </div>
    </div>
  );
}
