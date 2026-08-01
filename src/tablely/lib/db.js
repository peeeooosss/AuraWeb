// Multi-tenant database layer using Supabase
import { supabase } from "./supabase";

const DEMO_ID = "demo";

// Get a single restaurant by ID
export async function getRestaurant(id) {
  if (id === DEMO_ID) {
    await seedDemo();
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Fetch related data
  const [menuRes, tablesRes, staffRes] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("restaurant_id", id).order("display_order"),
    supabase.from("restaurant_tables").select("*").eq("restaurant_id", id).order("table_number"),
    supabase.from("staff_profiles").select("*").eq("restaurant_id", id),
  ]);

  // Fetch menu items for each category
  const categories = menuRes.data || [];
  const menu = [];
  for (const cat of categories) {
    const { data: items } = await supabase
      .from("menu_items")
      .select("*")
      .eq("category_id", cat.id)
      .order("name");
    menu.push({
      id: cat.id,
      category: cat.name,
      displayOrder: cat.display_order,
      items: (items || []).map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        originalPrice: i.original_price,
        discount: i.discount || 0,
        offer: i.offer || null,
        veg: i.is_veg,
        desc: i.description || "",
        secret: i.is_secret || false,
        imageUrl: i.image_url || "",
        available: i.is_available,
        fastDelivery: i.is_fast_delivery || false,
      })),
    });
  }

  return {
    ...data,
    ownerName: data.owner_name || "",
    gstNumber: data.gst_number || "",
    whatsappGroupLink: data.whatsapp_group_link || "",
    upiId: data.upi_id || "",
    taxRate: data.tax_rate || 5,
    serviceChargeEnabled: data.service_charge_enabled || false,
    serviceChargeRate: data.service_charge_rate || 10,
    logoUrl: data.logo_url || "",
    whatsappKitchenNumber: data.whatsapp_kitchen_number || "",
    whatsappOwnerNumber: data.whatsapp_owner_number || "",
    googleReviewLink: data.google_review_link || "",
    customerMenuTheme: data.customer_menu_theme || "classic",
    menu,
    tables: (tablesRes.data || []).map((t) => ({
      id: t.table_number,
      name: t.table_number,
      seats: t.seats,
      status: t.status,
    })),
    staff: (staffRes.data || []).map((s) => ({
      id: s.id,
      name: s.display_name,
      username: s.username,
      role: s.staff_role,
      phone: s.phone || "",
      tablesServed: s.tables_served || 0,
      avgResponseMin: s.avg_response_min || 0,
      active: s.active,
    })),
  };
}

// Get all restaurants (for admin panel)
export async function getAllRestaurantList() {
  await seedDemo();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, owner_name, email, phone, tier, created_at, owner_id");

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    ownerName: r.owner_name || "",
    email: r.email,
    phone: r.phone,
    tier: r.tier,
    createdAt: r.created_at,
  }));
}

// Update restaurant data
export async function updateRestaurant(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
  if (updates.gstNumber !== undefined) dbUpdates.gst_number = updates.gstNumber;
  if (updates.whatsappGroupLink !== undefined) dbUpdates.whatsapp_group_link = updates.whatsappGroupLink;
  if (updates.upiId !== undefined) dbUpdates.upi_id = updates.upiId;
  if (updates.taxRate !== undefined) dbUpdates.tax_rate = updates.taxRate;
  if (updates.serviceChargeEnabled !== undefined) dbUpdates.service_charge_enabled = updates.serviceChargeEnabled;
  if (updates.serviceChargeRate !== undefined) dbUpdates.service_charge_rate = updates.serviceChargeRate;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
  if (updates.whatsappKitchenNumber !== undefined) dbUpdates.whatsapp_kitchen_number = updates.whatsappKitchenNumber;
  if (updates.whatsappOwnerNumber !== undefined) dbUpdates.whatsapp_owner_number = updates.whatsappOwnerNumber;
  if (updates.googleReviewLink !== undefined) dbUpdates.google_review_link = updates.googleReviewLink;
  if (updates.customerMenuTheme !== undefined) dbUpdates.customer_menu_theme = updates.customerMenuTheme;

  const { data, error } = await supabase
    .from("restaurants")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

// ─── Menu Categories CRUD ────────────────────────────────
export async function createMenuCategory(restaurantId, name, displayOrder = 1) {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, name, display_order: displayOrder })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMenuCategory(categoryId, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
  const { data, error } = await supabase
    .from("menu_categories")
    .update(dbUpdates)
    .eq("id", categoryId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenuCategory(categoryId) {
  // Items cascade-delete via foreign key; delete category itself
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId);
  if (error) throw new Error(error.message);
}

// ─── Menu Items CRUD ─────────────────────────────────────
export async function createMenuItem(categoryId, restaurantId, itemData) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: categoryId,
      restaurant_id: restaurantId,
      name: itemData.name,
      price: itemData.price,
      original_price: itemData.originalPrice ?? itemData.price,
      discount: itemData.discount ?? 0,
      offer: itemData.offer || null,
      is_veg: itemData.veg ?? true,
      description: itemData.desc ?? "",
      is_secret: itemData.secret ?? false,
      image_url: itemData.imageUrl || "",
      is_available: itemData.available ?? true,
      is_fast_delivery: itemData.fastDelivery ?? false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMenuItem(itemId, itemData) {
  const dbUpdates = {};
  if (itemData.name !== undefined) dbUpdates.name = itemData.name;
  if (itemData.price !== undefined) dbUpdates.price = itemData.price;
  if (itemData.originalPrice !== undefined) dbUpdates.original_price = itemData.originalPrice;
  if (itemData.discount !== undefined) dbUpdates.discount = itemData.discount;
  if (itemData.offer !== undefined) dbUpdates.offer = itemData.offer || null;
  if (itemData.veg !== undefined) dbUpdates.is_veg = itemData.veg;
  if (itemData.desc !== undefined) dbUpdates.description = itemData.desc;
  if (itemData.secret !== undefined) dbUpdates.is_secret = itemData.secret;
  if (itemData.imageUrl !== undefined) dbUpdates.image_url = itemData.imageUrl;
  if (itemData.available !== undefined) dbUpdates.is_available = itemData.available;
  if (itemData.fastDelivery !== undefined) dbUpdates.is_fast_delivery = itemData.fastDelivery;
  const { data, error } = await supabase
    .from("menu_items")
    .update(dbUpdates)
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenuItem(itemId) {
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

// ─── Staff CRUD ──────────────────────────────────────────
export async function createStaffMember({ username, password, name, role, phone, restaurantId }) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch("/api/staff/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username, password, name, role, phone, restaurantId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to create staff");
  return body;
}

export async function deleteStaffMember(staffId, restaurantId) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`/api/staff/delete?staffId=${staffId}&restaurantId=${restaurantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to delete staff");
  return body;
}

export async function toggleStaffActive(staffId, active) {
  const { error } = await supabase
    .from("staff_profiles")
    .update({ active })
    .eq("id", staffId);
  if (error) throw new Error(error.message);
}

// ─── Restaurant Tables CRUD ──────────────────────────────
export async function createTable(restaurantId, tableData) {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({
      restaurant_id: restaurantId,
      table_number: tableData.name,
      seats: tableData.seats || 4,
      status: "free",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTable(tableId, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.table_number = updates.name;
  if (updates.seats !== undefined) dbUpdates.seats = updates.seats;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  const { data, error } = await supabase
    .from("restaurant_tables")
    .update(dbUpdates)
    .eq("id", tableId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTable(tableId) {
  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", tableId);
  if (error) throw new Error(error.message);
}

// Delete a restaurant
export async function deleteRestaurant(id) {
  if (id === DEMO_ID) return false;

  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", id);

  return !error;
}

// Seed demo restaurant into Supabase if it doesn't exist
async function seedDemo() {
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", DEMO_ID)
    .single();

  if (existing) return;

  // Create demo restaurant (no owner_id — it's a public demo)
  const { error: restError } = await supabase.from("restaurants").insert({
    id: DEMO_ID,
    name: "Tablely Demo Cafe",
    owner_id: "00000000-0000-0000-0000-000000000000",
    address: "123 Cafe Street, Bandra West, Mumbai 400050",
    phone: "+919876543210",
    email: "hello@tablely.in",
    tier: "growth",
    tax_rate: 5,
    service_charge_enabled: false,
    service_charge_rate: 10,
    gst_number: "27AABCT1234F1Z5",
    upi_id: "tablely@upi",
  });

  if (restError) return;

  // Seed menu categories
  const { data: cats } = await supabase.from("menu_categories").insert([
    { restaurant_id: DEMO_ID, name: "Chai & Coffee", display_order: 1 },
    { restaurant_id: DEMO_ID, name: "Snacks", display_order: 2 },
    { restaurant_id: DEMO_ID, name: "Mains", display_order: 3 },
  ]).select();

  if (cats && cats.length >= 3) {
    await supabase.from("menu_items").insert([
      { restaurant_id: DEMO_ID, category_id: cats[0].id, name: "Adrak Chai", price: 30, original_price: 40, discount: 25, is_veg: true, description: "Ginger-forward, brewed strong.", is_fast_delivery: true },
      { restaurant_id: DEMO_ID, category_id: cats[0].id, name: "Filter Coffee", price: 40, original_price: 40, is_veg: true, description: "South Indian style.", is_fast_delivery: true },
      { restaurant_id: DEMO_ID, category_id: cats[1].id, name: "Samosa (2 pc)", price: 40, original_price: 40, is_veg: true, description: "Crispy potato samosa.", is_fast_delivery: true },
      { restaurant_id: DEMO_ID, category_id: cats[1].id, name: "Veg Toastie", price: 60, original_price: 60, is_veg: true, description: "Grilled veg sandwich." },
      { restaurant_id: DEMO_ID, category_id: cats[2].id, name: "Paneer Butter Masala + Rice", price: 190, original_price: 190, is_veg: true, description: "Rich creamy paneer with basmati rice." },
      { restaurant_id: DEMO_ID, category_id: cats[2].id, name: "Chicken Biryani", price: 220, original_price: 220, is_veg: false, description: "Hyderabadi style dum biryani." },
    ]);
  }

  // Seed tables
  await supabase.from("restaurant_tables").insert([
    { restaurant_id: DEMO_ID, table_number: "T1", seats: 4 },
    { restaurant_id: DEMO_ID, table_number: "T2", seats: 4 },
    { restaurant_id: DEMO_ID, table_number: "T3", seats: 4 },
    { restaurant_id: DEMO_ID, table_number: "T4", seats: 6 },
    { restaurant_id: DEMO_ID, table_number: "T5", seats: 2 },
  ]);
}
