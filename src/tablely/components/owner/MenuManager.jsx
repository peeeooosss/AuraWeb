import { useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { OFFER_TYPES } from "../../data/menu";
import {
  createMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../lib/db";

export default function MenuManager({ initialMenu, restaurantId, onSaved }) {
  const [menu, setMenu] = useState(initialMenu);
  const [activeCat, setActiveCat] = useState(initialMenu[0]?.id || "");
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState("");

  const emptyItem = { name: "", price: "", originalPrice: "", discount: 0, offer: "", veg: true, desc: "", imageUrl: "", available: true, fastDelivery: false };
  const [itemForm, setItemForm] = useState({ ...emptyItem });

  const activeCategory = menu.find((c) => c.id === activeCat);

  function openAddItem() {
    setEditingItem(null);
    setItemForm({ ...emptyItem });
    setShowItemModal(true);
  }

  function openEditItem(item) {
    setEditingItem(item.id);
    setItemForm({
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      discount: item.discount || 0,
      offer: item.offer || "",
      veg: item.veg,
      desc: item.desc,
      imageUrl: item.imageUrl || "",
      available: item.available !== false,
      fastDelivery: item.fastDelivery || false,
    });
    setShowItemModal(true);
  }

  async function saveItem() {
    if (!itemForm.name.trim() || !itemForm.price) return;
    const price = Number(itemForm.price);
    const originalPrice = Number(itemForm.originalPrice) || price;
    const discount = Number(itemForm.discount) || 0;
    const fastDelivery = itemForm.offer === "FASTDELIVERY";

    setSaving(true);
    setSavingLabel(editingItem ? "Saving item..." : "Adding item...");
    try {
      if (editingItem) {
        // Update existing item in DB
        await updateMenuItem(editingItem, { ...itemForm, price, originalPrice, discount, fastDelivery });
        // Update local state
        setMenu((prev) =>
          prev.map((c) =>
            c.id !== activeCat
              ? c
              : { ...c, items: c.items.map((i) => (i.id === editingItem ? { ...i, ...itemForm, price, originalPrice, discount, fastDelivery } : i)) }
          )
        );
      } else {
        // Create new item in DB
        const dbItem = await createMenuItem(activeCat, restaurantId, { ...itemForm, price, originalPrice, discount, fastDelivery });
        // Update local state with DB-generated ID
        setMenu((prev) =>
          prev.map((c) =>
            c.id !== activeCat
              ? c
              : { ...c, items: [...c.items, { id: dbItem.id, ...itemForm, price, originalPrice, discount, fastDelivery, secret: false }] }
          )
        );
      }
      setShowItemModal(false);
      onSaved?.();
    } catch (err) {
      alert("Failed to save item: " + err.message);
    } finally {
      setSaving(false);
      setSavingLabel("");
    }
  }

  async function removeItem(itemId) {
    setSaving(true);
    setSavingLabel("Deleting...");
    try {
      await deleteMenuItem(itemId);
      setMenu((prev) => prev.map((c) => (c.id !== activeCat ? c : { ...c, items: c.items.filter((i) => i.id !== itemId) })));
      setConfirmDelete(null);
      onSaved?.();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setSaving(false);
      setSavingLabel("");
    }
  }

  async function toggleAvailability(itemId) {
    const item = menu.flatMap((c) => c.items).find((i) => i.id === itemId);
    if (!item) return;
    const newVal = item.available === false ? true : false;
    try {
      await updateMenuItem(itemId, { available: newVal });
      setMenu((prev) =>
        prev.map((c) =>
          c.id !== activeCat
            ? c
            : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, available: newVal } : i)) }
        )
      );
      onSaved?.();
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    setSaving(true);
    setSavingLabel("Adding category...");
    try {
      const dbCat = await createMenuCategory(restaurantId, newCatName.trim(), menu.length + 1);
      const newId = dbCat.id;
      setMenu((prev) => [...prev, { id: newId, category: newCatName.trim(), displayOrder: prev.length + 1, items: [] }]);
      setNewCatName("");
      setShowCatModal(false);
      setActiveCat(newId);
      onSaved?.();
    } catch (err) {
      alert("Failed to add category: " + err.message);
    } finally {
      setSaving(false);
      setSavingLabel("");
    }
  }

  async function removeCategory(catId) {
    setSaving(true);
    setSavingLabel("Deleting category...");
    try {
      await deleteMenuCategory(catId);
      setMenu((prev) => prev.filter((c) => c.id !== catId));
      setConfirmDeleteCat(null);
      if (activeCat === catId) setActiveCat(menu.find((c) => c.id !== catId)?.id || "");
      onSaved?.();
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    } finally {
      setSaving(false);
      setSavingLabel("");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">Menu Management</h1>
          {saving && (
            <span className="flex items-center gap-1.5 rounded-full bg-marigold/15 px-3 py-1 font-body text-xs font-medium text-marigold-dark">
              <Loader2 size={12} className="animate-spin" /> {savingLabel}
            </span>
          )}
        </div>
        <button onClick={() => setShowCatModal(true)} disabled={saving} className="flex items-center gap-1.5 rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-paper-dim disabled:opacity-50">
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="flex gap-6">
        {/* Categories sidebar */}
        <div className="w-44 shrink-0 hidden md:block">
          <div className="rounded border border-paper-line bg-white/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-paper-line bg-paper-dim/50 font-body text-xs font-semibold text-ink-soft uppercase tracking-wide">Categories</div>
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left font-body text-sm transition-colors ${
                  activeCat === cat.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
                }`}
              >
                <span className="truncate">{cat.category}</span>
                <span className={`text-[10px] ml-1 ${activeCat === cat.id ? "text-paper/60" : "text-ink-soft/60"}`}>{cat.items.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile category selector */}
        <div className="md:hidden mb-4 w-full">
          <select value={activeCat} onChange={(e) => setActiveCat(e.target.value)} className="w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm">
            {menu.map((cat) => <option key={cat.id} value={cat.id}>{cat.category} ({cat.items.length})</option>)}
          </select>
        </div>

        {/* Items panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">{activeCategory?.category || "No category"}</h2>
            <button onClick={openAddItem} disabled={saving} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-body text-xs font-semibold text-paper hover:bg-ink-soft disabled:opacity-50">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-2">
            {!activeCategory || activeCategory.items.length === 0 ? (
              <p className="py-10 text-center font-body text-sm text-ink-soft">No items yet. Add one above.</p>
            ) : (
              activeCategory.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded border border-paper-line bg-white/50 px-4 py-3">
                  {/* Image */}
                  <div className="h-14 w-14 shrink-0 rounded overflow-hidden bg-paper-dim">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><ImageIcon size={18} className="text-paper-line" /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${item.veg ? "bg-sage" : "bg-chili"}`} />
                      <p className="font-body text-sm font-semibold truncate">{item.name}</p>
                      {item.offer && (
                        <span className="rounded bg-marigold/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-marigold-dark uppercase">
                          {OFFER_TYPES.find((o) => o.id === item.offer)?.label || item.offer}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-body text-xs text-ink-soft truncate">{item.desc}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="tabular font-mono text-sm font-semibold">₹{item.price}</span>
                      {item.discount > 0 && (
                        <>
                          <span className="tabular font-mono text-xs text-ink-soft line-through">₹{item.originalPrice}</span>
                          <span className="font-body text-[10px] font-semibold text-chili">{item.discount}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleAvailability(item.id)} className={`rounded-full px-2.5 py-1 font-body text-[10px] font-semibold ${item.available === false ? "bg-paper-dim text-ink-soft" : "bg-sage/15 text-sage"}`}>
                      {item.available === false ? "86'd" : "Available"}
                    </button>
                    <button onClick={() => openEditItem(item)} className="rounded p-1.5 text-ink-soft hover:text-ink hover:bg-paper-dim"><Pencil size={13} /></button>
                    {confirmDelete === item.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => removeItem(item.id)} className="rounded bg-chili px-2 py-0.5 text-[10px] text-paper">Yes</button>
                        <button onClick={() => setConfirmDelete(null)} className="rounded bg-paper-dim px-2 py-0.5 text-[10px]">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(item.id)} className="rounded p-1.5 text-ink-soft hover:text-chili hover:bg-chili/10"><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Delete category */}
          {menu.length > 1 && (
            <div className="mt-6 border-t border-paper-line pt-4">
              {confirmDeleteCat === activeCat ? (
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-chili">Delete this entire category?</span>
                  <button onClick={() => removeCategory(activeCat)} disabled={saving} className="rounded bg-chili px-3 py-1 font-body text-[10px] text-paper font-semibold disabled:opacity-50">Yes, delete</button>
                  <button onClick={() => setConfirmDeleteCat(null)} className="font-body text-[10px] text-ink-soft underline">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteCat(activeCat)} className="font-body text-xs text-chili underline">Delete this category</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
          <div className="w-full max-w-sm rounded-lg p-6 shadow-lg" style={{ background: 'var(--color-paper)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Add Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-ink-soft hover:text-ink"><X size={18} /></button>
            </div>
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="e.g. Beverages" autoFocus onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCatModal(false)} className="rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft">Cancel</button>
              <button onClick={addCategory} disabled={saving} className="rounded-full bg-ink px-5 py-2 font-body text-xs font-semibold text-paper disabled:opacity-50">
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 overflow-y-auto py-8">
          <div className="w-full max-w-md rounded-lg p-6 shadow-lg mx-4" style={{ background: 'var(--color-paper)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">{editingItem ? "Edit Item" : "Add Item"}</h3>
              <button onClick={() => setShowItemModal(false)} className="text-ink-soft hover:text-ink"><X size={18} /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Item Name *</label>
                <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="e.g. Masala Chai" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Description</label>
                <input value={itemForm.desc} onChange={(e) => setItemForm({ ...itemForm, desc: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="Short description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Price (₹) *</label>
                  <input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Original Price (₹)</label>
                  <input type="number" value={itemForm.originalPrice} onChange={(e) => setItemForm({ ...itemForm, originalPrice: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="Same as price" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Discount %</label>
                  <input type="number" min="0" max="100" value={itemForm.discount} onChange={(e) => setItemForm({ ...itemForm, discount: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-ink-soft">Offer Type</label>
                  <select value={itemForm.offer} onChange={(e) => setItemForm({ ...itemForm, offer: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm">
                    <option value="">None</option>
                    {OFFER_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-ink-soft">Image URL</label>
                <input value={itemForm.imageUrl} onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} className="mt-1 w-full rounded border border-paper-line bg-white px-3 py-2 font-body text-sm" placeholder="https://..." />
                {itemForm.imageUrl && (
                  <div className="mt-2 h-20 w-20 rounded overflow-hidden border border-paper-line">
                    <img src={itemForm.imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                  <input type="radio" name="veg" checked={itemForm.veg === true} onChange={() => setItemForm({ ...itemForm, veg: true })} className="accent-sage" />
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sage" /> Veg</span>
                </label>
                <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                  <input type="radio" name="veg" checked={itemForm.veg === false} onChange={() => setItemForm({ ...itemForm, veg: false })} className="accent-chili" />
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chili" /> Non-veg</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-paper-line">
              <button onClick={() => setShowItemModal(false)} className="rounded-full border border-paper-line px-4 py-2 font-body text-xs font-semibold text-ink-soft">Cancel</button>
              <button onClick={saveItem} disabled={saving} className="rounded-full bg-ink px-5 py-2 font-body text-xs font-semibold text-paper disabled:opacity-50">
                {saving ? savingLabel : (editingItem ? "Save Changes" : "Add Item")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
