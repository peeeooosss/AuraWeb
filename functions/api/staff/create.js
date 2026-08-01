export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify caller is authenticated via Supabase
    const token = authHeader.replace("Bearer ", "");
    const userRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: userId } = await userRes.json();
    const { username, password, name, role, phone, restaurantId } = await request.json();

    if (!username || !password || !name || !role || !restaurantId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return new Response(JSON.stringify({ error: "Username must be 3-20 chars, lowercase alphanumeric + underscore" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseHeaders = {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    };

    // Verify caller is the owner of this restaurant
    const restRes = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/restaurants?id=eq.${restaurantId}&owner_id=eq.${userId}&select=id`,
      { headers: supabaseHeaders }
    );
    const restaurants = await restRes.json();
    if (!restaurants || restaurants.length === 0) {
      return new Response(JSON.stringify({ error: "Not the owner of this restaurant" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check username uniqueness within restaurant
    const existingRes = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/staff_profiles?restaurant_id=eq.${restaurantId}&username=eq.${username.toLowerCase()}&select=id`,
      { headers: supabaseHeaders }
    );
    const existing = await existingRes.json();
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "Username already taken in this restaurant" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase Auth user with hidden email
    const hiddenEmail = `${username.toLowerCase()}@tablely-staff.local`;
    const createRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({
        email: hiddenEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "staff",
          restaurant_id: restaurantId,
          display_name: name,
          staff_role: role,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return new Response(JSON.stringify({ error: err.msg || "Failed to create staff user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newUser = await createRes.json();

    // Insert staff profile
    const profileRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/staff_profiles`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({
        user_id: newUser.id,
        restaurant_id: restaurantId,
        username: username.toLowerCase(),
        display_name: name,
        staff_role: role,
        phone,
        active: true,
      }),
    });

    if (!profileRes.ok) {
      // Rollback: delete the auth user
      await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/admin/users/${newUser.id}`, {
        method: "DELETE",
        headers: supabaseHeaders,
      });
      return new Response(JSON.stringify({ error: "Failed to create staff profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, staffId: newUser.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
