import { useState } from "react";
import { UserPlus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import TicketCard from "../TicketCard";
import LockedFeature from "../LockedFeature";
import { useTier } from "../../lib/TierContext";
import { hasFeature } from "../../lib/tiers";
import { createStaffMember, deleteStaffMember, toggleStaffActive } from "../../lib/db";
import { supabase } from "../../lib/supabase";

const ROLES = ["Waiter", "Kitchen", "Manager"];

export default function StaffManager({ initialStaff, restaurantId }) {
  const { tier } = useTier();
  const canAdd = hasFeature(tier, "add_staff");
  const [staff, setStaff] = useState(initialStaff);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "Waiter", phone: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm({ name: "", username: "", password: "", role: "Waiter", phone: "" });
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(s) {
    setEditing(s.id);
    setForm({ name: s.name, username: s.username || "", password: "", role: s.role, phone: s.phone });
    setSaveError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (!editing && !form.username.trim()) return;
    if (!editing && form.password.length < 6) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editing) {
        // Edit mode — just update local state (staff editing not yet supported via API)
        setStaff((prev) => prev.map((s) => (s.id === editing ? { ...s, ...form } : s)));
      } else {
        // Create via API
        await createStaffMember({
          username: form.username,
          password: form.password,
          name: form.name,
          role: form.role,
          phone: form.phone,
          restaurantId,
        });
        // Re-fetch staff list from Supabase
        const { data } = await supabase
          .from("staff_profiles")
          .select("*")
          .eq("restaurant_id", restaurantId);
        if (data) {
          setStaff(data.map((s) => ({
            id: s.id,
            name: s.display_name,
            username: s.username,
            role: s.staff_role,
            phone: s.phone || "",
            tablesServed: s.tables_served || 0,
            avgResponseMin: s.avg_response_min || 0,
            active: s.active,
          })));
        }
      }
      setShowModal(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setSaving(true);
    try {
      await deleteStaffMember(id, restaurantId);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id) {
    const member = staff.find((s) => s.id === id);
    if (!member) return;
    const newVal = !member.active;
    try {
      await toggleStaffActive(id, newVal);
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: newVal } : s)));
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  }

  if (!canAdd) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-5">Staff Management</h1>
        <LockedFeature requiredTier="ecosystem" label="Add & manage staff" />
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold mb-3">Current Staff (read-only)</h2>
          <div className="space-y-3">
            {staff.map((s) => (
              <TicketCard key={s.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-semibold">{s.name}</p>
                    <p className="font-body text-xs text-ink-soft">{s.role} · {s.phone}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${s.active ? "bg-sage/20 text-sage" : "bg-paper-dim text-ink-soft"}`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </TicketCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">Staff Management</h1>
          {saving && (
            <span className="flex items-center gap-1.5 rounded-full bg-marigold/15 px-3 py-1 font-body text-xs font-medium text-marigold-dark">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
        </div>
        <button onClick={openAdd} disabled={saving} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper hover:bg-ink-soft disabled:opacity-50">
          <UserPlus size={14} /> Add Staff
        </button>
      </div>

      <div className="space-y-3">
        {staff.map((s) => (
          <TicketCard key={s.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm font-semibold">{s.name}</p>
                <p className="font-body text-xs text-ink-soft">{s.role} · {s.phone}</p>
                <p className="mt-1 font-body text-[10px] text-ink-soft">
                  {s.tablesServed} tables served · {s.avgResponseMin}m avg
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(s.id)}
                  disabled={saving}
                  className={`rounded-full px-2.5 py-1 font-body text-[10px] font-semibold ${s.active ? "bg-sage/20 text-sage" : "bg-paper-dim text-ink-soft"}`}
                >
                  {s.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => openEdit(s)} className="rounded p-1 text-ink-soft hover:text-ink hover:bg-paper-dim">
                  <Pencil size={14} />
                </button>
                {confirmDelete === s.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => remove(s.id)} disabled={saving} className="rounded bg-chili px-2 py-0.5 font-body text-[10px] text-paper">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="rounded bg-paper-dim px-2 py-0.5 font-body text-[10px]">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(s.id)} className="rounded p-1 text-ink-soft hover:text-chili hover:bg-chili/10">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </TicketCard>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
          <div className="w-full max-w-sm rounded-lg p-6 shadow-lg" style={{ background: 'var(--color-paper)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">{editing ? "Edit Staff" : "Add Staff"}</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-soft hover:text-ink"><X size={18} /></button>
            </div>
            {saveError && (
              <div className="mb-4 rounded bg-chili/10 px-3 py-2">
                <p className="font-body text-xs text-chili">{saveError}</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="e.g. Ramesh" />
              </div>
              {!editing && (
                <>
                  <div>
                    <label className="font-body text-xs font-medium text-ink-soft">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm"
                      placeholder="e.g. ramesh, kitchen1"
                    />
                    <p className="mt-1 font-body text-[10px] text-ink-soft">Staff will use this to sign in. Lowercase, no spaces.</p>
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-ink-soft">Initial Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm"
                      placeholder="Min 6 characters"
                    />
                    <p className="mt-1 font-body text-[10px] text-ink-soft">Share this with the staff member. They can change it later.</p>
                  </div>
                </>
              )}
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="+91XXXXXXXXXX" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-full bg-ink px-5 py-2 font-body text-xs font-semibold text-paper disabled:opacity-50">
                {saving ? "Saving..." : (editing ? "Save" : "Add Staff")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
