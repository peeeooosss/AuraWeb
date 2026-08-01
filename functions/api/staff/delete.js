export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify caller is the owner
    const token = authHeader.replace("Bearer ", "");
    const userRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: userId } = await userRes.json();
    const url = new URL(request.url);
    const staffId = url.searchParams.get("staffId");
    const restaurantId = url.searchParams.get("restaurantId");

    if (!staffId || !restaurantId) {
      return new Response(JSON.stringify({ error: "Missing staffId or restaurantId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseHeaders = {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    };

    // Verify caller is the owner
    const restRes = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/restaurants?id=eq.${restaurantId}&owner_id=eq.${userId}&select=id`,
      { headers: supabaseHeaders }
    );
    const restaurants = await restRes.json();
    if (!restaurants || restaurants.length === 0) {
      return new Response(JSON.stringify({ error: "Not the owner" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Soft-delete: deactivate
    await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/staff_profiles?id=eq.${staffId}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({ active: false }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
