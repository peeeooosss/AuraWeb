// Shared utility helpers

// Strip country code, spaces, dashes, parens from a phone number and
// return the last 10 digits — the format Razorpay's prefill.contact expects.
export function sanitizePhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.slice(-10);
}

// Validate a 10-digit Indian mobile number (after sanitization).
export function isValidPhone(phone) {
  const clean = sanitizePhone(phone);
  return /^[6-9]\d{9}$/.test(clean);
}


