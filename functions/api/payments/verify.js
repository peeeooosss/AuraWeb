export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment details" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify signature using Web Crypto API (Cloudflare Workers compatible)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(env.RAZORPAY_KEY_SECRET);
    const bodyData = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid payment signature", success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
