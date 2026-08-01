import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, Printer, CheckCircle2, ClipboardList } from "lucide-react";
import PortalBar from "../../components/PortalBar";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

export default function BillPage() {
  const { restaurantId, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadBill();
  }, [restaurantId, orderId]);

  async function loadBill() {
    // Fetch order
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId)
      .single();

    if (!orderData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch restaurant
    const { data: restData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    setOrder({
      ...orderData,
      table: orderData.table_number,
      type: orderData.order_type,
      items: orderData.items || [],
      customerName: orderData.customer_name,
      customerPhone: orderData.customer_phone,
      subtotal: orderData.subtotal,
      taxAmount: orderData.tax_amount,
      serviceCharge: orderData.service_charge,
      total: orderData.total,
      placedAt: new Date(orderData.created_at).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    });

    setRestaurant({
      name: restData?.name || "Restaurant",
      address: restData?.address || "",
      gstNumber: restData?.gst_number || "",
      phone: restData?.phone || "",
    });

    setLoading(false);
  }

  function downloadPDF() {
    if (!order || !restaurant) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant.name, 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(restaurant.address, 105, y, { align: "center" });
    y += 5;
    if (restaurant.gstNumber) {
      doc.text(`GSTIN: ${restaurant.gstNumber}`, 105, y, { align: "center" });
      y += 5;
    }
    doc.text(`Phone: ${restaurant.phone}`, 105, y, { align: "center" });
    y += 10;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 8;

    // Order info
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Order #${order.id.slice(0, 8)}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.type === "takeaway" ? "Takeaway" : `Table ${order.table}`} · ${order.customerName || "Walk-in"}`, 190, y, { align: "right" });
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(order.placedAt, margin, y);
    doc.text(order.status.toUpperCase(), 190, y, { align: "right" });
    y += 8;

    // Divider
    doc.line(margin, y, 190, y);
    y += 6;

    // Items header
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("Item", margin, y);
    doc.text("Qty", 140, y);
    doc.text("Amount", 190, y, { align: "right" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    for (const item of order.items) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(item.name, margin, y);
      doc.text(`${item.qty}`, 143, y, { align: "right" });
      doc.text(`₹${item.price * item.qty}`, 190, y, { align: "right" });
      y += 5;
    }

    y += 3;
    doc.line(margin, y, 190, y);
    y += 6;

    // Totals
    doc.setFontSize(9);
    doc.text("Subtotal", margin, y);
    doc.text(`₹${order.subtotal}`, 190, y, { align: "right" });
    y += 5;
    if (order.taxAmount > 0) {
      doc.text(`GST (5%)`, margin, y);
      doc.text(`₹${order.taxAmount}`, 190, y, { align: "right" });
      y += 5;
    }
    if (order.serviceCharge > 0) {
      doc.text(`Service Charge (10%)`, margin, y);
      doc.text(`₹${order.serviceCharge}`, 190, y, { align: "right" });
      y += 5;
    }

    // Total
    doc.line(margin, y, 190, y);
    y += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", margin, y);
    doc.text(`₹${order.total}`, 190, y, { align: "right" });
    y += 10;

    // Payment info
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Payment: UPI · ${order.payment_status === "paid" ? "Paid" : order.payment_status === "pending_verification" ? "Customer confirmed" : "Awaiting confirmation"}`, 105, y, { align: "center" });
    y += 5;
    if (order.upi_utr) {
      doc.text(`UTR: ${order.upi_utr}`, 105, y, { align: "center" });
      y += 8;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for dining with us! 🙏", 105, y, { align: "center" });

    doc.save(`bill_${order.id.slice(0, 8)}.pdf`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold mb-2">Order Not Found</h1>
          <p className="font-body text-sm text-ink-soft">This bill doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalBar title="E-Bill" />
      <div className="mx-auto max-w-md px-5 py-6">
        {/* Actions */}
        <div className="flex gap-2 mb-6">
        <Link to={`/${restaurantId}/dashboard?tab=orders`} className="flex items-center gap-1.5 rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim">
          <ClipboardList size={14} /> My Orders
        </Link>
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim">
          <ArrowLeft size={14} /> Back
        </button>
          <button onClick={downloadPDF} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper hover:bg-ink-soft">
            <Download size={14} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim">
            <Printer size={14} /> Print
          </button>
        </div>

        {/* Bill card */}
        <div className="rounded-lg border border-paper-line bg-white/60 p-6 print:border-0 print:bg-white">
          <div className="text-center mb-4">
            <h1 className="font-display text-xl font-semibold">{restaurant.name}</h1>
            <p className="font-body text-xs text-ink-soft mt-0.5">{restaurant.address}</p>
            {restaurant.gstNumber && (
              <p className="font-mono text-[10px] text-ink-soft mt-0.5">GSTIN: {restaurant.gstNumber}</p>
            )}
          </div>

          <div className="perf-divider my-3" />

          <div className="flex justify-between text-xs mb-1">
            <span className="font-mono text-ink-soft">#{order.id.slice(0, 8)}</span>
            <span className="font-body text-ink-soft">
              {order.type === "takeaway" ? "Takeaway" : `Table ${order.table}`}
            </span>
          </div>
          <p className="font-body text-[10px] text-ink-soft mb-3">{order.placedAt}</p>

          {order.customerName && (
            <p className="font-body text-xs text-ink-soft mb-2">
              <span className="font-medium text-ink">{order.customerName}</span>
              {order.customerPhone && ` · ${order.customerPhone}`}
            </p>
          )}

          <div className="perf-divider my-3" />

          {/* Items */}
          <ul className="space-y-1.5 font-body text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.qty}× {item.name}</span>
                <span className="tabular font-mono">₹{item.price * item.qty}</span>
              </li>
            ))}
          </ul>

          <div className="perf-divider my-3" />

          {/* Totals */}
          <div className="space-y-1 font-body text-xs">
            <div className="flex justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="tabular">₹{order.subtotal}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-soft">GST (5%)</span>
                <span className="tabular">₹{order.taxAmount}</span>
              </div>
            )}
            {order.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Service Charge (10%)</span>
                <span className="tabular">₹{order.serviceCharge}</span>
              </div>
            )}
          </div>

          <div className="perf-divider my-3" />

          <div className="flex justify-between font-mono text-base font-semibold">
            <span>Total</span>
            <span className="tabular">₹{order.total}</span>
          </div>

          <div className={`mt-4 flex items-center justify-center gap-1.5 ${order.payment_status === "paid" ? "text-sage" : order.payment_status === "pending_verification" ? "text-teal-soft" : "text-marigold-dark"}`}>
            <CheckCircle2 size={14} />
            <span className="font-body text-xs font-semibold">
              {order.payment_status === "paid" ? "Paid via UPI" : order.payment_status === "pending_verification" ? "Payment confirmed — Awaiting verification" : "UPI · Awaiting confirmation"}
            </span>
          </div>

          {order.upi_utr && (
            <p className="mt-1 text-center font-mono text-[9px] text-ink-soft">
              UTR: {order.upi_utr}
            </p>
          )}

          <div className="mt-5 text-center">
            <p className="font-body text-xs text-ink-soft">Thank you for dining with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
