import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";
import Logo from "../../components/Logo";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const { user, signInAsOwner } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get("email") || "";

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasJustAuthenticated, setHasJustAuthenticated] = useState(false);

  const routeUser = useCallback(async (authUser) => {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, onboarding_complete")
      .eq("owner_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!restaurant) {
      navigate("/onboarding", { replace: true });
    } else if (!restaurant.onboarding_complete) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate(`/${restaurant.id}/owner`, { replace: true });
    }
  }, [navigate]);

  // After explicit login/signup → route based on draft status
  useEffect(() => {
    if (!user || !hasJustAuthenticated) return;
    routeUser(user);
  }, [user, hasJustAuthenticated, routeUser]);

  // Already logged in (session restored) → redirect away from /login
  useEffect(() => {
    if (!user || hasJustAuthenticated) return;
    routeUser(user);
  }, [user, hasJustAuthenticated, routeUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInAsOwner(email, password);
        setHasJustAuthenticated(true);
      } else {
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: "owner" },
          },
        });
        if (signUpError) throw signUpError;

        await signInAsOwner(email, password);
        setHasJustAuthenticated(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="mt-4 font-display text-2xl font-semibold">
            {mode === "signin" ? "Sign in to Tablely" : "Create your Tablely account"}
          </h1>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {prefilledEmail && mode === "signin"
              ? "Welcome back! Sign in to access your dashboard."
              : mode === "signin"
                ? "Access your restaurant dashboard"
                : "Set up your restaurant in minutes"}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-paper-line bg-paper-dim p-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 font-body text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 font-body text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <UserPlus size={14} /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-medium text-ink-soft">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-paper-line bg-white pl-9 pr-3 py-2.5 font-body text-sm"
                placeholder="you@email.com"
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
          {mode === "signup" && (
            <div>
              <label className="font-body text-xs font-medium text-ink-soft">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-paper-line bg-white pl-9 pr-3 py-2.5 font-body text-sm"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          )}
          {error && <p className="font-body text-xs text-chili">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-body text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Create Account & Start Onboarding"}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-xs text-ink-soft">
          {mode === "signin" ? (
            <>
              New restaurant?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); }}
                className="font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4"
              >
                Sign up to get started
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); }}
                className="font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
