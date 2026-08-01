export async function onRequestPost(context) {
  const { request, env } = context;

  const TIER_PRICES = {
    starter: 599,
    ecosystem: 1499,
    growth: 1999,
  };

  try {
    const { plan, email, restaurantName } = await request.json();

    const isTestMode = env.VITE_TEST_MODE !== "false";
    const tierPrice = TIER_PRICES[plan] || 599;
    const amount = isTestMode ? 1 : tierPrice;

    const auth = btoa(`${env.VITE_RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: `sub_${Date.now()}`,
        notes: {
          plan: plan || "starter",
          email: email || "",
          restaurant: restaurantName || "",
          type: "subscription",
          mode: isTestMode ? "test" : "live",
        },
      }),
    });

    const order = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: order.error?.description || "Failed to create subscription order" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
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
