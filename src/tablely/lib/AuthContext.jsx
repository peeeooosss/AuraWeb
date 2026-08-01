import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) hydrateUser(s.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) hydrateUser(s.user);
        else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function hydrateUser(authUser) {
    const metadata = authUser.user_metadata || {};
    const role = metadata.role || "owner";
    let profileData = null;
    let restaurantId = metadata.restaurant_id;
    let onboardingComplete = false;

    if (role === "staff") {
      const { data } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();
      profileData = data;
    } else {
      // For owners: look up restaurant by owner_id
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", authUser.id)
        .single();
      if (data) {
        profileData = data;
        restaurantId = data.id;
        onboardingComplete = data.onboarding_complete || false;
      }
    }

    // Set user with the final resolved restaurantId — no intermediate state
    setUser({
      id: authUser.id,
      email: authUser.email,
      role,
      restaurantId,
      onboardingComplete,
      displayName: metadata.display_name,
      staffRole: metadata.staff_role,
    });
    setProfile(profileData);
    setLoading(false);
  }

  const signInAsOwner = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUpAsOwner = useCallback(async (email, password, restaurantId) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "owner", restaurant_id: restaurantId },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signInAsStaff = useCallback(async (username, password, restaurantId) => {
    const res = await fetch("/api/staff/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, restaurantId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);

    await supabase.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    });

    return body;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      await hydrateUser(s.user);
      return user;
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signInAsOwner, signUpAsOwner, signInAsStaff, signOut, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
