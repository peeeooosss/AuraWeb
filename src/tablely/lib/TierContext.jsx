import { createContext, useContext, useEffect, useState } from "react";
import { TIER_ORDER } from "./tiers";
import { updateRestaurant } from "./db";

const TierContext = createContext(null);

const STORAGE_KEY = "tablely-demo-tier";

export function TierProvider({ children }) {
  const [tier, setTierState] = useState(() => {
    if (typeof window === "undefined") return "starter";
    return window.localStorage.getItem(STORAGE_KEY) || "starter";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, tier);
  }, [tier]);

  // Demo / public flows: switching is local-only (no restaurant yet).
  function setTier(nextTier) {
    setTierState(nextTier);
    window.localStorage.setItem(STORAGE_KEY, nextTier);
  }

  // The real subscription lives on the restaurant row in the DB, not in
  // localStorage. Dashboards call this on load so the active plan matches
  // the restaurant's plan on every device.
  function applyRestaurantTier(restaurantTier) {
    if (!restaurantTier || restaurantTier === tier) return;
    setTierState(restaurantTier);
    window.localStorage.setItem(STORAGE_KEY, restaurantTier);
  }

  // Owner upgrades/downgrades: persist to the restaurant row AND update local state.
  async function saveTierToRestaurant(restaurantId, nextTier) {
    const updated = await updateRestaurant(restaurantId, { tier: nextTier });
    if (updated) {
      setTierState(nextTier);
      window.localStorage.setItem(STORAGE_KEY, nextTier);
    }
    return !!updated;
  }

  return (
    <TierContext.Provider value={{ tier, setTier, tiers: TIER_ORDER, applyRestaurantTier, saveTierToRestaurant }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be used inside <TierProvider>");
  return ctx;
}
