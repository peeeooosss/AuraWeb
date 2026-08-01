import { useState, useMemo, useRef, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Download,
  Printer,
  ShoppingBag,
  Users,
  Receipt,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import TicketCard from "../TicketCard";
import { createTable, updateTable, deleteTable } from "../../lib/db";
import { supabase } from "../../lib/supabase";

const BASE_URL = window.location.origin;

const STATUS_DOTS = {
  occupied: "bg-chili",
  free: "bg-sage",
  cleaning: "bg-ink-soft",
};

function TableCard({ table, orders, onClick }) {
  const tableOrders = orders.filter((o) => o.table === table.id);
  const totalRevenue = tableOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = tableOrders.length;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded border border-paper-line bg-white/40 p-4 text-left transition-colors hover:bg-paper-dim/60 hover:border-marigold/40"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-display text-sm font-semibold">{table.name || `Table ${table.id.replace("T", "")}`}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOTS[table.status] || "bg-paper-line"}`} />
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <Users size={11} className="text-ink-soft" />
        <span className="font-body text-[11px] text-ink-soft">{table.seats} seats</span>
      </div>
      <div className="mt-auto perf-divider mb-2" />
      <div className="flex items-center justify-between">
        <span className="font-body text-[11px] text-ink-soft">{orderCount} order{orderCount !== 1 ? "s" : ""}</span>
        <span className="tabular font-mono text-[11px] font-semibold">₹{totalRevenue}</span>
      </div>
    </button>
  );
}

function TableView({ table, orders, restaurant, onBack, onEdit, onDelete }) {
  const canvasRef = useRef(null);
  const tableOrders = useMemo(() => orders.filter((o) => o.table === table.id), [orders, table.id]);
  const totalRevenue = tableOrders.reduce((s, o) => s + o.total, 0);
  const avgOrder = tableOrders.length > 0 ? Math.round(totalRevenue / tableOrders.length) : 0;
  const tableUrl = `${BASE_URL}/${restaurant?.id || ""}/login?table=${table.id}`;

  const downloadQR = useCallback(() => {
    const svg = document.querySelector("[data-table-detail-qr] svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `${table.id.toLowerCase()}_qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [table.id]);

  function printQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=400,height=500");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>QR — ${table.id}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh}.card{text-align:center;border:2px dashed #ccc;border-radius:8px;padding:30px 40px}.card h2{font-size:18px;font-weight:700;margin-bottom:4px}.card p{font-size:12px;color:#666;margin-bottom:16px}.card .sub{font-size:14px;font-weight:600;margin-top:10px}@media print{body{padding:20px}}</style></head><body>
      <div class="card"><h2>${restaurant.name}</h2><p>${restaurant.address}</p><img src="${dataUrl}" width="180" height="180"/><div class="sub">${table.name || `Table ${table.id.replace("T", "")}`}</div><p style="margin-top:4px">${table.seats} seats · Scan to order</p></div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded p-1.5 text-ink-soft hover:text-ink hover:bg-paper-dim">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold">{table.name || `Table ${table.id.replace("T", "")}`}</h1>
            <p className="font-body text-xs text-ink-soft">{table.seats} seats · {table.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(table)} className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => onDelete(table.id)} className="flex items-center gap-1.5 rounded-full border border-chili/30 bg-white px-3 py-1.5 font-body text-xs font-medium text-chili hover:bg-chili/10 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* QR Code */}
        <div>
          <h2 className="font-display text-base font-semibold mb-3">QR Code</h2>
          <TicketCard>
            <div className="flex flex-col items-center">
              <div data-table-detail-qr className="bg-white p-3 rounded">
                <QRCodeSVG value={tableUrl} size={160} level="M" includeMargin={false} />
              </div>
              <div className="absolute opacity-0 pointer-events-none" style={{ width: 0, height: 0 }}>
                <QRCodeCanvas ref={canvasRef} value={tableUrl} size={200} level="M" includeMargin={false} />
              </div>
              <p className="mt-3 font-mono text-[11px] text-ink-soft">{tableUrl}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={downloadQR} className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors">
                  <Download size={12} /> Download PNG
                </button>
                <button onClick={printQR} className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors">
                  <Printer size={12} /> Print
                </button>
              </div>
            </div>
          </TicketCard>
        </div>

        {/* Order Report */}
        <div>
          <h2 className="font-display text-base font-semibold mb-3">Order Report</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded border border-paper-line bg-white/40 p-3 text-center">
              <Receipt size={14} className="mx-auto text-ink-soft mb-1" />
              <p className="tabular font-mono text-xl font-semibold">{tableOrders.length}</p>
              <p className="font-body text-[10px] text-ink-soft">Total Orders</p>
            </div>
            <div className="rounded border border-paper-line bg-white/40 p-3 text-center">
              <TrendingUp size={14} className="mx-auto text-ink-soft mb-1" />
              <p className="tabular font-mono text-xl font-semibold">₹{totalRevenue}</p>
              <p className="font-body text-[10px] text-ink-soft">Revenue</p>
            </div>
            <div className="rounded border border-paper-line bg-white/40 p-3 text-center">
              <Clock size={14} className="mx-auto text-ink-soft mb-1" />
              <p className="tabular font-mono text-xl font-semibold">₹{avgOrder}</p>
              <p className="font-body text-[10px] text-ink-soft">Avg Order</p>
            </div>
          </div>

          {tableOrders.length === 0 ? (
            <TicketCard>
              <p className="py-6 text-center font-body text-sm text-ink-soft">No orders yet for this table.</p>
            </TicketCard>
          ) : (
            <div className="space-y-2">
              {tableOrders.map((o) => (
                <TicketCard key={o.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs text-ink-soft">#{o.id}</p>
                        <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${
                          o.status === "completed" ? "bg-paper-dim text-ink-soft"
                            : o.status === "cancelled" ? "bg-chili/10 text-chili"
                            : "bg-marigold/20 text-marigold-dark"
                        }`}>{o.status}</span>
                      </div>
                      <p className="mt-1 font-body text-xs text-ink-soft">{o.customerName} · {o.placedAt} · {o.placedDate}</p>
                    </div>
                    <span className="tabular font-mono text-sm font-semibold">₹{o.total}</span>
                  </div>
                  <ul className="mt-1.5 font-body text-xs text-ink-soft">
                    {o.items.map((it, i) => (
                      <li key={i}>{it.qty}× {it.name}</li>
                    ))}
                  </ul>
                </TicketCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TableManager({ initialTables, orders, restaurant, restaurantId }) {
  const [tables, setTables] = useState(initialTables.filter((t) => t.id !== "TA"));
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", seats: 4 });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const takeawayUrl = `${BASE_URL}/${restaurant?.id || ""}/login?table=TA`;

  const nextTableId = useMemo(() => {
    const nums = tables.map((t) => parseInt(t.id.replace("T", ""), 10)).filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `T${max + 1}`;
  }, [tables]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", seats: 4 });
    setShowModal(true);
  }

  function openEdit(t) {
    setEditing(t.id);
    setForm({ name: t.name || "", seats: t.seats });
    setShowModal(true);
  }

  async function save() {
    if (form.seats < 1) return;
    const tableName = form.name.trim() || nextTableId;
    setSaving(true);
    try {
      if (editing) {
        await updateTable(editing, { name: tableName, seats: form.seats });
        setTables((prev) => prev.map((t) => (t.id === editing ? { ...t, name: tableName, seats: form.seats } : t)));
        if (selectedTable?.id === editing) {
          setSelectedTable((prev) => prev ? { ...prev, name: tableName, seats: form.seats } : prev);
        }
      } else {
        const dbTable = await createTable(restaurantId, { name: tableName, seats: form.seats });
        const newTable = { id: dbTable.table_number, name: tableName, seats: form.seats, status: "free" };
        setTables((prev) => [...prev, newTable]);
      }
      setShowModal(false);
    } catch (err) {
      alert("Failed to save table: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTable(id) {
    setSaving(true);
    try {
      // Find the DB id by table_number
      const table = tables.find((t) => t.id === id);
      if (table) {
        // Query for the actual DB row ID
        const { data: row } = await supabase
          .from("restaurant_tables")
          .select("id")
          .eq("table_number", id)
          .eq("restaurant_id", restaurantId)
          .single();
        if (row) await deleteTable(row.id);
      }
      setTables((prev) => prev.filter((t) => t.id !== id));
      setConfirmDelete(null);
      if (selectedTable?.id === id) setSelectedTable(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteFromView(id) {
    removeTable(id);
  }

  if (selectedTable) {
    const currentTable = tables.find((t) => t.id === selectedTable.id) || selectedTable;
    return (
      <div>
        <TableView
          table={currentTable}
          orders={orders}
          restaurant={restaurant}
          onBack={() => setSelectedTable(null)}
          onEdit={(t) => { openEdit(t); }}
          onDelete={handleDeleteFromView}
        />
        {showModal && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
        <div className="w-full max-w-sm rounded-lg p-6 shadow-lg" style={{ background: 'var(--color-paper)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">{editing ? "Edit Table" : "Add Table"}</h3>
            <button onClick={() => setShowModal(false)} className="text-ink-soft hover:text-ink"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="font-body text-xs font-medium text-ink-soft">Table Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm"
                placeholder={editing ? "" : nextTableId}
              />
              {!editing && <p className="mt-1 font-body text-[10px] text-ink-soft">Leave blank to use {nextTableId}</p>}
            </div>
            <div>
              <label className="font-body text-xs font-medium text-ink-soft">Number of Seats</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value, 10) || 1 })}
                className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowModal(false)} className="rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft">Cancel</button>
            <button onClick={save} className="rounded-full bg-ink px-5 py-2 font-body text-xs font-semibold text-paper">{editing ? "Save" : "Add Table"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">Tables</h1>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper hover:bg-ink-soft transition-colors">
          <Plus size={14} /> Add Table
        </button>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {tables.map((t) => (
          <div key={t.id} className="relative">
            <TableCard
              table={t}
              orders={orders}
              onClick={() => setSelectedTable(t)}
            />
            {confirmDelete === t.id && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-ink/60">
                <div className="flex items-center gap-2">
                  <button onClick={() => removeTable(t.id)} className="rounded bg-chili px-3 py-1.5 font-body text-xs font-semibold text-paper">Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded bg-paper px-3 py-1.5 font-body text-xs font-semibold text-ink">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Takeaway QR */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={16} className="text-marigold-dark" />
          <h2 className="font-display text-lg font-semibold">Takeaway / Walk-in</h2>
        </div>
        <TicketCard>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div data-takeaway-qr className="bg-white p-3 rounded">
              <QRCodeSVG value={takeawayUrl} size={140} level="M" includeMargin={false} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-display text-base font-semibold">Takeaway QR</p>
              <p className="mt-1 font-body text-sm text-ink-soft">
                For customers who want to takeaway from the door. Scans directly to the menu in takeaway mode.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => {
                    const svg = document.querySelector("[data-takeaway-qr] svg");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0);
                      const a = document.createElement("a");
                      a.download = "takeaway_qr.png";
                      a.href = canvas.toDataURL("image/png");
                      a.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors"
                >
                  <Download size={12} /> Download PNG
                </button>
                <TakeawayPrinter takeawayUrl={takeawayUrl} restaurant={restaurant} />
              </div>
            </div>
          </div>
        </TicketCard>
      </div>

      {showModal && renderModal()}
    </div>
  );
}

function TakeawayPrinter({ takeawayUrl, restaurant }) {
  const canvasRef = useRef(null);

  function printTakeaway() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=500,height=500");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Takeaway QR — ${restaurant.name}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh}.card{text-align:center;border:2px dashed #ccc;border-radius:8px;padding:30px 40px}.card h2{font-size:20px;font-weight:700;margin-bottom:4px}.card p{font-size:12px;color:#666;margin-bottom:16px}.card .sub{font-size:14px;font-weight:600;margin-top:10px}@media print{body{padding:20px}}</style></head><body>
      <div class="card"><h2>${restaurant.name}</h2><p>${restaurant.address}</p><img src="${dataUrl}" width="180" height="180"/><div class="sub">Takeaway / Walk-in</div><p style="margin-top:4px">Scan to view menu &amp; order</p></div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <>
      <div className="absolute opacity-0 pointer-events-none" style={{ width: 0, height: 0 }}>
        <QRCodeCanvas ref={canvasRef} value={takeawayUrl} size={200} level="M" includeMargin={false} />
      </div>
      <button onClick={printTakeaway} className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3 py-1.5 font-body text-xs font-medium text-ink hover:bg-paper-dim transition-colors">
        <Printer size={12} /> Print
      </button>
    </>
  );
}
