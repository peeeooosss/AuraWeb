// Direct UPI payment helpers — money goes straight to the restaurant owner's UPI ID

export const UPI_APPS = [
  {
    name: "Google Pay",
    pkg: "com.google.android.apps.nbu.paisa.user",
    scheme: "tez",
    androidPath: "upi/pay",
    iosUrl: "tez://upi/pay",
  },
  {
    name: "PhonePe",
    pkg: "com.phonepe.app",
    scheme: "phonepe",
    androidPath: "pay",
    iosUrl: "phonepe://pay",
  },
  {
    name: "Paytm",
    pkg: "net.one97.paytm",
    scheme: "paytmmp",
    androidPath: "pay",
    iosUrl: "paytmmp://pay",
  },
];

export function buildUpiPayParams({ upiId, name = "", amount, note = "" }) {
  const params = new URLSearchParams();
  params.set("pa", upiId);
  if (name) params.set("pn", name.slice(0, 20));
  if (amount > 0) params.set("am", amount.toFixed(2));
  if (note) params.set("tn", note.slice(0, 40));
  params.set("cu", "INR");
  return params.toString();
}

export function buildUpiPay({ upiId, name = "", amount, note = "" }) {
  return `upi://pay?${buildUpiPayParams({ upiId, name, amount, note })}`;
}

// Android intent deep link that opens a specific UPI app
export function buildUpiIntent({ upiId, name = "", amount, note = "" }, app) {
  const params = buildUpiPayParams({ upiId, name, amount, note });
  return `intent://${app.androidPath}?${params}#Intent;scheme=${app.scheme};package=${app.pkg};end`;
}

// iOS deep link that opens a specific UPI app
export function buildUpiIosUrl({ upiId, name = "", amount, note = "" }, app) {
  const params = buildUpiPayParams({ upiId, name, amount, note });
  return `${app.iosUrl}?${params}`;
}

export function isValidUtr(utr) {
  return /^\d{12}$/.test((utr || "").trim());
}
