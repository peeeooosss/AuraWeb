export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password, restaurantId } = await request.json();

    if (!username || !password || !restaurantId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseHeaders = {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    };

    // Look up staff profile
    const profileRes = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/staff_profiles?restaurant_id=eq.${restaurantId}&username=eq.${username.toLowerCase()}&active=eq.true&select=user_id,display_name,staff_role,username`,
      { headers: supabaseHeaders }
    );
    const profiles = await profileRes.json();

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: "Username not found or account deactivated" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];

    // Sign in via Supabase Auth using hidden email
    const hiddenEmail = `${username.toLowerCase()}@tablely-staff.local`;
    const signInRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: hiddenEmail,
        password,
      }),
    });

    const session = await signInRes.json();

    if (!signInRes.ok) {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        staffRole: profile.staff_role,
        restaurantId,
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
