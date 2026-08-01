import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PortalBar from "../../components/PortalBar";
import { supabase } from "../../lib/supabase";

export default function CustomerLogin() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table") || "T1";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem("customer_profile");
      if (stored) {
        const profile = JSON.parse(stored);
        if (profile.restaurantId === restaurantId) {
          // Already logged in — go to dashboard
          navigate(`/${restaurantId}/dashboard?table=${tableParam}`, { replace: true });
        }
      }
    } catch {}
  }, [restaurantId, tableParam, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and WhatsApp number");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setError("Enter a valid 10-digit WhatsApp number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create or find customer profile in Supabase
      const { data: existing } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("phone", cleanPhone)
        .single();

      if (existing) {
        // Update name if changed
        if (existing.name !== name.trim()) {
          await supabase
            .from("customer_profiles")
            .update({ name: name.trim(), last_seen: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("customer_profiles")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", existing.id);
        }
      } else {
        // Create new profile
        await supabase.from("customer_profiles").insert({
          restaurant_id: restaurantId,
          name: name.trim(),
          phone: cleanPhone,
        });
      }

      // Store in localStorage
      const profile = { name: name.trim(), phone: cleanPhone, restaurantId };
      localStorage.setItem("customer_profile", JSON.stringify(profile));

      // Navigate to dashboard
      navigate(`/${restaurantId}/dashboard?table=${tableParam}`);
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar title="Tablely" />
      <div className="mx-auto max-w-sm px-5 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/15">
            <MessageCircle size={28} className="text-sage" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Welcome!</h1>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {tableParam === "TA" ? "Takeaway order" : `Table ${tableParam}`} — Enter your details to start.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-chili/30 bg-chili/10 px-4 py-3">
            <p className="font-body text-sm text-chili">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-body text-xs font-medium text-ink-soft">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-paper-line bg-white px-4 py-3 font-body text-sm"
              placeholder="e.g. Priya"
              autoFocus
            />
          </div>
          <div>
            <label className="font-body text-xs font-medium text-ink-soft">WhatsApp Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded border border-paper-line bg-white px-4 py-3 font-body text-sm"
              placeholder="98765 43210"
              maxLength={16}
            />
            <p className="mt-1 font-body text-[10px] text-ink-soft">We'll send your e-bill here after payment.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-[10px] text-ink-soft">
          Your info is only used for this restaurant's orders and receipts.
        </p>
      </div>
    </div>
  );
}
