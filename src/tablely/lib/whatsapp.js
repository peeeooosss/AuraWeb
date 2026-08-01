// WhatsApp wa.me integration — no API keys needed
// Opens WhatsApp with pre-filled message

export function openWhatsApp(phone, message) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
}

// Message templates

export function formatKitchenAlert(order, restaurant) {
  const items = order.items
    .map((i) => `  ${i.qty}x ${i.name}`)
    .join("\n");
  const paymentLine = order.payment_status === "paid"
    ? "Payment: UPI · Paid ✓"
    : "Payment: UPI · Awaiting confirmation";
  return `🍽️ *New Order #${order.id.slice(0, 8)}*
Table: ${order.table_number}
Type: ${order.order_type}
Items:
${items}
Total: ₹${order.total}
${paymentLine}
Time: ${new Date().toLocaleTimeString()}`;
}

export function formatStatusUpdate(order, restaurant) {
  const statusMessages = {
    accepted: "Your order has been accepted and is being prepared.",
    preparing: "Your order is being prepared in the kitchen.",
    ready: "Your order is ready for pickup! 🎉",
    completed: "Thank you for dining with us!",
  };
  return `📦 *Order #${order.id.slice(0, 8)} Update*
${statusMessages[order.order_status] || `Status: ${order.order_status}`}`;
}

export function formatCustomerReceipt(order, restaurant) {
  const items = order.items
    .map((i) => `  ${i.qty}x ${i.name} - ₹${i.price * i.qty}`)
    .join("\n");
  return `🧾 *Receipt from ${restaurant.name || "Tablely"}*
Order #${order.id.slice(0, 8)}
${items}
Subtotal: ₹${order.subtotal}
${order.tax_amount > 0 ? `GST: ₹${order.tax_amount}\n` : ""}Total: ₹${order.total}
Thank you! 🙏`;
}

export function formatEBillMessage(order, restaurant) {
  const items = (order.items || [])
    .map((i) => `  ${i.qty}× ${i.name} — ₹${i.price * i.qty}`)
    .join("\n");
  const billUrl = `${window.location.origin}/${order.restaurant_id}/bill/${order.id}`;
  return `🧾 *E-Bill from ${restaurant.name || "Tablely"}*
━━━━━━━━━━━━━━━━━━━━━━
Order: #${order.id.slice(0, 8)}
Date: ${new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
Table: ${order.table_number}
Type: ${order.order_type}
━━━━━━━━━━━━━━━━━━━━━━
${items}
━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${order.subtotal}
${order.tax_amount > 0 ? `GST (5%): ₹${order.tax_amount}\n` : ""}${order.service_charge > 0 ? `Service Charge (10%): ₹${order.service_charge}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━
*TOTAL: ₹${order.total}*
━━━━━━━━━━━━━━━━━━━━━━
${order.payment_status === "paid"
  ? `Payment: UPI · Paid ✓${order.upi_utr ? `\nUTR: ${order.upi_utr}` : ""}`
  : "Payment: UPI · Awaiting confirmation"}
━━━━━━━━━━━━━━━━━━━━━━
Thank you for dining with us! 🙏
View detailed bill: ${billUrl}`;
}

export function formatThankYouMessage(order, restaurant) {
  return `🙏 *Thank you for dining at ${restaurant.name || "Tablely"}!*

We hope you enjoyed your meal.
Your order #${order.id.slice(0, 8)} has been completed.

See you again soon! ✨

With love,
${restaurant.name || "Tablely"} Team`;
}

export function formatRatingRequest(order, restaurant) {
  const billUrl = `${window.location.origin}/${order.restaurant_id}/bill/${order.id}`;
  const reviewLink = restaurant?.googleReviewLink || restaurant?.google_review_link || "";
  const rateLine = reviewLink
    ? `Rate us on Google: ${reviewLink}`
    : `Rate us here: ${billUrl}`;
  return `⭐ *How was your experience?*

Thank you for dining at ${restaurant?.name || "Tablely"}!

We'd love your feedback on order #${order.id.slice(0, 8)}.
${rateLine}

Your feedback helps us serve you better! 🙏`;
}

// Kitchen number from env (restaurant can override via settings)
export function getKitchenNumber(restaurant) {
  return restaurant?.whatsapp_kitchen_number || import.meta.env.VITE_WHATSAPP_KITCHEN_NUMBER || "";
}

// Owner number from restaurant settings
export function getOwnerNumber(restaurant) {
  return restaurant?.whatsapp_owner_number || restaurant?.whatsappOwnerNumber || "";
}

export function getCustomerNumber(customerPhone) {
  return customerPhone || import.meta.env.VITE_WHATSAPP_CUSTOMER_NUMBER || "";
}
