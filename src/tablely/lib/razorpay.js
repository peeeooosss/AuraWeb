// Razorpay checkout helper
import { sanitizePhone } from "./utils";

function friendlyRazorpayError(err) {
  const msg = (err && err.message) || String(err) || "";
  if (msg.includes("pattern") || msg.includes("contact")) {
    return "Your phone number format looks invalid. Please enter a 10-digit mobile number.";
  }
  if (msg.includes("key") || msg.includes("Key")) {
    return "Payment gateway is not configured correctly. Please contact support.";
  }
  if (msg.includes("network") || msg.includes("Network") || msg.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  return msg || "Something went wrong while starting payment. Please try again.";
}

export function openRazorpayCheckout({
  amount,
  orderId,
  name = "Tablely",
  description = "Payment",
  prefill = {},
  notes = {},
  handler,
  onDismiss,
  onError,
}) {
  if (!window.Razorpay) {
    if (onError) onError(new Error("Payment gateway failed to load. Please refresh the page and try again."));
    return;
  }

  if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
    if (onError) onError(new Error("Payment gateway is not configured. Please contact support."));
    return;
  }

  // Sanitize contact number to the 10-digit format Razorpay expects
  const cleanPrefill = { ...prefill };
  if (cleanPrefill.contact) {
    cleanPrefill.contact = sanitizePhone(cleanPrefill.contact);
  }

  try {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      name,
      description,
      order_id: orderId,
      prefill: cleanPrefill,
      notes,
      theme: { color: "#1a1a1a" },
      handler: function (response) {
        if (handler) handler(response);
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      if (onError) onError(new Error(response?.error?.description || "Payment failed. Please try again."));
    });

    rzp.open();
  } catch (err) {
    if (onError) onError(new Error(friendlyRazorpayError(err)));
  }
}

// Create a Razorpay order via our API
export async function createRazorpayOrder({ amount, receipt, notes }) {
  const res = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// Create a subscription order (₹1 test)
export async function createSubscriptionOrder({ plan, email, restaurantName }) {
  const res = await fetch("/api/payments/create-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email, restaurantName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// Verify payment signature
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}
