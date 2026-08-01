export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { amount, currency = "INR", receipt, notes } = await request.json();

    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: "Amount must be at least ₹1 (100 paise)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const auth = btoa(`${env.VITE_RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    const order = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: order.error?.description || "Failed to create order" }), {
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
