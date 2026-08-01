const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "ready"];

function isCompleted(order) {
  return order.status === "completed" || order.order_status === "completed";
}

function isCancelled(order) {
  return order.status === "cancelled" || order.order_status === "cancelled";
}

function orderDate(order) {
  return new Date(order.completed_at || order.created_at || 0);
}

function categoryLookup(menu = []) {
  const lookup = new Map();
  menu.forEach((category) => {
    (category.items || []).forEach((item) => {
      lookup.set(String(item.id), { id: category.id, name: category.category });
    });
  });
  return lookup;
}

function itemDetails(item, lookup) {
  const fallback = lookup.get(String(item.id));
  return {
    id: item.id || item.name,
    name: item.name || "Unknown item",
    categoryId: item.category_id || item.categoryId || fallback?.id || "unknown",
    categoryName: item.category_name || item.categoryName || item.category || fallback?.name || "Uncategorized",
    quantity: Number(item.qty) || 0,
    revenue: (Number(item.price) || 0) * (Number(item.qty) || 0),
  };
}

export function calculateAnalytics(orders = [], menu = []) {
  const lookup = categoryLookup(menu);
  const completed = orders.filter(isCompleted);
  const paidCompleted = completed.filter((order) => order.payment_status === "paid");
  const active = orders.filter((order) => ACTIVE_STATUSES.includes(order.status || order.order_status));
  const cancelled = orders.filter(isCancelled);
  const todayKey = new Date().toDateString();
  const todayCompleted = completed.filter((order) => orderDate(order).toDateString() === todayKey);
  const allItems = completed.flatMap((order) => (order.items || []).map((item) => itemDetails(item, lookup)));

  const itemMap = new Map();
  const categoryMap = new Map();
  const tableMap = new Map();
  const dailyMap = new Map();
  const hourMap = new Map();

  completed.forEach((order) => {
    const date = orderDate(order);
    const day = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const table = order.table || order.table_number || "Takeaway";
    const tableEntry = tableMap.get(table) || { name: table, orders: 0, revenue: 0 };
    tableEntry.orders += 1;
    tableEntry.revenue += order.total || 0;
    tableMap.set(table, tableEntry);

    const dayEntry = dailyMap.get(day) || { day, revenue: 0, orders: 0 };
    dayEntry.revenue += order.total || 0;
    dayEntry.orders += 1;
    dailyMap.set(day, dayEntry);

    const hour = date.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  allItems.forEach((item) => {
    const itemEntry = itemMap.get(item.id) || { id: item.id, name: item.name, units: 0, revenue: 0 };
    itemEntry.units += item.quantity;
    itemEntry.revenue += item.revenue;
    itemMap.set(item.id, itemEntry);

    const categoryEntry = categoryMap.get(item.categoryId) || { id: item.categoryId, name: item.categoryName, units: 0, revenue: 0 };
    categoryEntry.units += item.quantity;
    categoryEntry.revenue += item.revenue;
    categoryMap.set(item.categoryId, categoryEntry);
  });

  const dailyRevenue = Array.from(dailyMap.values()).reverse();
  const topItems = Array.from(itemMap.values()).sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, 5);
  const topCategories = Array.from(categoryMap.values()).sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  const tablePerformance = Array.from(tableMap.values()).sort((a, b) => b.revenue - a.revenue);
  const peakHourEntry = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);
  const collectedRevenue = paidCompleted.reduce((sum, order) => sum + order.total, 0);
  const uniqueCustomers = new Set(orders.map((order) => order.customerPhone).filter(Boolean));

  return {
    completed,
    paidCompleted,
    active,
    cancelled,
    todayCompleted,
    totalRevenue,
    collectedRevenue,
    totalOrders: completed.length,
    activeOrders: active.length,
    averageOrderValue: completed.length ? Math.round(totalRevenue / completed.length) : 0,
    todayRevenue: todayCompleted.reduce((sum, order) => sum + order.total, 0),
    customerCount: uniqueCustomers.size,
    dailyRevenue,
    topItems,
    topCategories,
    tablePerformance,
    peakHour: peakHourEntry ? `${String(peakHourEntry[0]).padStart(2, "0")}:00` : "No data",
  };
}

export function buildCustomerAnalytics(orders = []) {
  const customers = new Map();
  orders.forEach((order) => {
    const phone = order.customerPhone || "unknown";
    if (phone === "unknown" && !order.customerName) return;
    const entry = customers.get(phone) || {
      id: phone,
      name: order.customerName || "Customer",
      phone: phone === "unknown" ? "" : phone,
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: "",
    };
    entry.totalOrders += 1;
    entry.totalSpent += order.total || 0;
    if (!entry.lastVisit || new Date(order.created_at) > new Date(entry.lastVisitValue || 0)) {
      entry.lastVisitValue = order.created_at;
      entry.lastVisit = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";
    }
    customers.set(phone, entry);
  });

  return Array.from(customers.values()).map((customer) => ({
    ...customer,
    loyaltyTier: customer.totalSpent >= 10000 ? "Gold" : customer.totalSpent >= 5000 ? "Silver" : "Bronze",
  }));
}
