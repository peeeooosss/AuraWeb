import { useState, useEffect } from "react";
import { Save, ExternalLink, Phone, CheckCircle } from "lucide-react";
import { updateRestaurant } from "../../lib/db";
import { openWhatsApp, formatKitchenAlert } from "../../lib/whatsapp";

function mapResult(row) {
  if (!row) return {};
  return {
    name: row.name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    gstNumber: row.gst_number,
    taxRate: row.tax_rate,
    serviceChargeEnabled: row.service_charge_enabled,
    serviceChargeRate: row.service_charge_rate,
    upiId: row.upi_id,
    whatsappKitchenNumber: row.whatsapp_kitchen_number,
    whatsappOwnerNumber: row.whatsapp_owner_number,
    googleReviewLink: row.google_review_link,
  };
}

export default function RestaurantSettings({ restaurant: initial, restaurantId, onSaved }) {
  const [r, setR] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setR(initial);
  }, [initial]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const result = await updateRestaurant(restaurantId, {
        name: r.name,
        phone: r.phone,
        address: r.address,
        email: r.email,
        gstNumber: r.gstNumber,
        taxRate: r.taxRate,
        serviceChargeEnabled: r.serviceChargeEnabled,
        serviceChargeRate: r.serviceChargeRate,
        upiId: r.upiId,
        whatsappKitchenNumber: r.whatsappKitchenNumber,
        whatsappOwnerNumber: r.whatsappOwnerNumber,
        googleReviewLink: r.googleReviewLink,
      });
      if (!result) throw new Error("Failed to save settings");
      setR({ ...r, ...mapResult(result) });
      if (onSaved) onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm";
  const labelCls = "font-body text-xs font-medium text-ink-soft";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-5">Restaurant Settings</h1>
      <p className="font-body text-sm text-ink-soft mb-6">Configure your restaurant details. This data appears on customer e-bills and receipts.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-chili/30 bg-chili/10 px-4 py-3">
          <p className="font-body text-sm text-chili">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <section>
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">1</span>
            Basic Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Restaurant Name</label>
              <input value={r.name || ""} onChange={(e) => setR({ ...r, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={r.phone || ""} onChange={(e) => setR({ ...r, phone: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input value={r.address || ""} onChange={(e) => setR({ ...r, address: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={r.email || ""} onChange={(e) => setR({ ...r, email: e.target.value })} className={inputCls} />
            </div>
          </div>
        </section>

        {/* GST */}
        <section>
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">2</span>
            GST & Tax Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>GST Number</label>
              <input value={r.gstNumber || ""} onChange={(e) => setR({ ...r, gstNumber: e.target.value })} className={inputCls} placeholder="22AAAAA0000A1Z5" />
              <p className="mt-1 font-body text-[10px] text-ink-soft">15-character GSTIN. Appears on customer e-bills.</p>
            </div>
            <div>
              <label className={labelCls}>Tax Rate (%)</label>
              <input type="number" min="0" max="28" value={r.taxRate || 0} onChange={(e) => setR({ ...r, taxRate: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={r.serviceChargeEnabled || false} onChange={(e) => setR({ ...r, serviceChargeEnabled: e.target.checked })} className="rounded" />
                <span className={labelCls}>Enable Service Charge ({r.serviceChargeRate || 10}%)</span>
              </label>
            </div>
          </div>
        </section>

        {/* WhatsApp */}
        <section>
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">3</span>
            WhatsApp Automation
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Owner WhatsApp Number</label>
              <div className="flex gap-2">
                <input
                  value={r.whatsappOwnerNumber || ""}
                  onChange={(e) => setR({ ...r, whatsappOwnerNumber: e.target.value })}
                  className={inputCls}
                  placeholder="919876543210"
                />
                {r.whatsappOwnerNumber && r.whatsappOwnerNumber.replace(/[^0-9]/g, "").length === 10 && (
                  <button
                    onClick={() => {
                      const phone = r.whatsappOwnerNumber.replace(/[^0-9]/g, "").slice(-10);
                      openWhatsApp(phone, "📱 Test Owner Alert\n\nThis is a test message from Tablely!\nIf you received this, your owner WhatsApp number is configured correctly.");
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20 shrink-0"
                  >
                    <Phone size={12} /> Test
                  </button>
                )}
              </div>
              <p className="mt-1 font-body text-[10px] text-ink-soft flex items-center gap-1">
                {r.whatsappOwnerNumber && r.whatsappOwnerNumber.replace(/[^0-9]/g, "").length === 10 ? (
                  <><CheckCircle size={10} className="text-sage" /> Valid number — you'll receive reports and customer queries here</>
                ) : (
                  "Used for receiving reports and customer queries. Include country code (e.g. 91 for India)."
                )}
              </p>
            </div>
            <div>
              <label className={labelCls}>Kitchen WhatsApp Number</label>
              <div className="flex gap-2">
                <input value={r.whatsappKitchenNumber || ""} onChange={(e) => setR({ ...r, whatsappKitchenNumber: e.target.value })} className={inputCls} placeholder="919864854481" />
                {r.whatsappKitchenNumber && r.whatsappKitchenNumber.replace(/[^0-9]/g, "").length === 10 && (
                  <button
                    onClick={() => {
                      const phone = r.whatsappKitchenNumber.replace(/[^0-9]/g, "").slice(-10);
                      openWhatsApp(phone, "🍽️ Test Kitchen Alert\n\nThis is a test message from Tablely!\nIf you received this, your kitchen number is configured correctly.");
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 font-body text-xs font-semibold text-sage hover:bg-sage/20 shrink-0"
                  >
                    <Phone size={12} /> Test
                  </button>
                )}
              </div>
              <p className="mt-1 font-body text-[10px] text-ink-soft flex items-center gap-1">
                {r.whatsappKitchenNumber && r.whatsappKitchenNumber.replace(/[^0-9]/g, "").length === 10 ? (
                  <><CheckCircle size={10} className="text-sage" /> Valid number — owner can send orders to kitchen from Orders tab</>
                ) : (
                  "Include country code, no + or spaces. Orders will be sent here via WhatsApp when owner taps 'Send to Kitchen'."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Customer Engagement */}
        <section>
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">4</span>
            Customer Engagement
          </h2>
          <div>
            <label className={labelCls}>Google Review Link</label>
            <input
              value={r.googleReviewLink || ""}
              onChange={(e) => setR({ ...r, googleReviewLink: e.target.value })}
              className={inputCls}
              placeholder="https://g.page/r/.../review"
            />
            <p className="mt-1 font-body text-[10px] text-ink-soft">
              Used in the "Get Rating" WhatsApp message sent to customers after order completion.
            </p>
            {r.googleReviewLink && (
              <a href={r.googleReviewLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-body text-xs text-marigold-dark hover:underline">
                <ExternalLink size={12} /> Open Google review link
              </a>
            )}
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">5</span>
            Payment Settings
          </h2>
          <div>
            <label className={labelCls}>UPI ID</label>
            <input value={r.upiId || ""} onChange={(e) => setR({ ...r, upiId: e.target.value })} className={inputCls} placeholder="yourname@upi" />
            <p className="mt-1 font-body text-[10px] text-ink-soft">Customers scan this QR at checkout and pay you directly. Set it or online orders can't be placed.</p>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-4 border-t border-paper-line">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 font-body text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-60">
            {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper border-t-transparent" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="font-body text-xs text-sage font-semibold">Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
}
