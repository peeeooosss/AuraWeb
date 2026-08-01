import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import Logo from "../../components/Logo";
import { useAuth } from "../../lib/AuthContext";
import { getRestaurant } from "../../lib/db";

export default function StaffLoginPage() {
  const { restaurantId } = useParams();
  const { signInAsStaff } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    getRestaurant(restaurantId).then(setRestaurant);
  }, [restaurantId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInAsStaff(username, password, restaurantId);
      navigate(`/${restaurantId}/staff`);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="mt-4 font-display text-2xl font-semibold">Staff Sign In</h1>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {restaurant?.name || restaurantId}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-medium text-ink-soft">Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded border border-paper-line bg-white pl-9 pr-3 py-2.5 font-body text-sm"
                placeholder="e.g. ramesh"
                required
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="font-body text-xs font-medium text-ink-soft">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-paper-line bg-white pl-9 pr-3 py-2.5 font-body text-sm"
                placeholder="Enter password"
                required
              />
            </div>
          </div>
          {error && <p className="font-body text-xs text-chili">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
            ) : (
              <>Sign In <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
