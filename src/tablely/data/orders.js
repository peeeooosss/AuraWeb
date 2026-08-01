// Mock live-order / table / staff / customer fixtures.
// In production these arrive over a websocket or polled endpoint per restaurant_id.

export const TABLES = [
  { id: "T1", seats: 4, status: "occupied" },
  { id: "T2", seats: 2, status: "occupied" },
  { id: "T3", seats: 4, status: "free" },
  { id: "T4", seats: 6, status: "occupied" },
  { id: "T5", seats: 2, status: "free" },
  { id: "T6", seats: 4, status: "cleaning" },
];

export const ORDERS = [
  {
    id: "0231",
    table: "T1",
    type: "dine-in",
    status: "accepted",
    placedAt: "8:42 PM",
    placedDate: "2026-07-22",
    customerName: "Priya Sharma",
    customerPhone: "+919820112345",
    items: [
      { name: "Paneer Butter Masala + Rice", qty: 1, price: 190 },
      { name: "Adrak Chai", qty: 2, price: 30 },
    ],
    total: 250,
    paymentMethod: "UPI",
  },
  {
    id: "0232",
    table: "T4",
    type: "dine-in",
    status: "preparing",
    placedAt: "8:47 PM",
    placedDate: "2026-07-22",
    customerName: "Rahul Verma",
    customerPhone: "+919819223456",
    items: [
      { name: "Chicken Maggi", qty: 2, price: 110 },
      { name: "Cold Coffee Frappe", qty: 2, price: 90 },
    ],
    total: 400,
    paymentMethod: "UPI",
  },
  {
    id: "0233",
    table: "T2",
    type: "takeaway",
    status: "ready",
    placedAt: "8:50 PM",
    placedDate: "2026-07-22",
    customerName: "Anita Desai",
    customerPhone: "+919876554321",
    items: [
      { name: "Veg Cheese Toastie", qty: 1, price: 90 },
      { name: "Filter Coffee", qty: 1, price: 40 },
    ],
    total: 130,
    paymentMethod: "Cash",
  },
  {
    id: "0234",
    table: "T1",
    type: "dine-in",
    status: "completed",
    placedAt: "7:15 PM",
    placedDate: "2026-07-22",
    customerName: "Vikram Joshi",
    customerPhone: "+919987665432",
    items: [
      { name: "Samosa (2 pc)", qty: 2, price: 40 },
      { name: "Adrak Chai", qty: 1, price: 30 },
    ],
    total: 110,
    paymentMethod: "UPI",
  },
  {
    id: "0230",
    table: "T3",
    type: "dine-in",
    status: "completed",
    placedAt: "6:30 PM",
    placedDate: "2026-07-22",
    customerName: "Neha Gupta",
    customerPhone: "+919801122334",
    items: [
      { name: "Egg Curry + Rice", qty: 1, price: 160 },
      { name: "Cold Coffee Frappe", qty: 1, price: 90 },
    ],
    total: 250,
    paymentMethod: "UPI",
  },
  {
    id: "0225",
    table: "T5",
    type: "takeaway",
    status: "completed",
    placedAt: "5:45 PM",
    placedDate: "2026-07-21",
    customerName: "Amit Patel",
    customerPhone: "+919900112233",
    items: [
      { name: "Paneer Butter Masala + Rice", qty: 2, price: 190 },
    ],
    total: 380,
    paymentMethod: "Cash",
  },
  {
    id: "0224",
    table: "T2",
    type: "dine-in",
    status: "completed",
    placedAt: "4:20 PM",
    placedDate: "2026-07-21",
    customerName: "Sara Khan",
    customerPhone: "+919812345678",
    items: [
      { name: "Samosa (2 pc)", qty: 1, price: 40 },
      { name: "Filter Coffee", qty: 2, price: 40 },
    ],
    total: 120,
    paymentMethod: "UPI",
  },
  {
    id: "0223",
    table: "T1",
    type: "dine-in",
    status: "completed",
    placedAt: "2:10 PM",
    placedDate: "2026-07-21",
    customerName: "Deepak Nair",
    customerPhone: "+919765432109",
    items: [
      { name: "Chicken Maggi", qty: 1, price: 110 },
      { name: "Adrak Chai", qty: 2, price: 30 },
    ],
    total: 170,
    paymentMethod: "UPI",
  },
  {
    id: "0220",
    table: "T4",
    type: "dine-in",
    status: "completed",
    placedAt: "9:00 PM",
    placedDate: "2026-07-20",
    customerName: "Kavita Rao",
    customerPhone: "+919898989898",
    items: [
      { name: "Egg Curry + Rice", qty: 2, price: 160 },
      { name: "Veg Cheese Toastie", qty: 1, price: 90 },
    ],
    total: 410,
    paymentMethod: "UPI",
  },
  {
    id: "0219",
    table: "T6",
    type: "takeaway",
    status: "completed",
    placedAt: "7:30 PM",
    placedDate: "2026-07-20",
    customerName: "Rohan Mehta",
    customerPhone: "+919700123456",
    items: [
      { name: "Adrak Chai", qty: 3, price: 30 },
      { name: "Samosa (2 pc)", qty: 2, price: 40 },
    ],
    total: 170,
    paymentMethod: "Cash",
  },
];

export const STAFF = [
  { id: "s1", name: "Ramesh", role: "Waiter", phone: "+919810000001", tablesServed: 14, avgResponseMin: 3.1, active: true },
  { id: "s2", name: "Sunita", role: "Waiter", phone: "+919810000002", tablesServed: 11, avgResponseMin: 2.4, active: true },
  { id: "s3", name: "Farhan", role: "Kitchen", phone: "+919810000003", tablesServed: 22, avgResponseMin: 5.6, active: true },
];

export const CUSTOMERS = [
  { id: "c1", name: "Priya Sharma", phone: "+919820112345", lastVisit: "2026-07-22", totalOrders: 12, totalSpent: 2840, loyaltyTier: "Gold" },
  { id: "c2", name: "Rahul Verma", phone: "+919819223456", lastVisit: "2026-07-22", totalOrders: 8, totalSpent: 1960, loyaltyTier: "Silver" },
  { id: "c3", name: "Anita Desai", phone: "+919876554321", lastVisit: "2026-07-22", totalOrders: 23, totalSpent: 5670, loyaltyTier: "Gold" },
  { id: "c4", name: "Vikram Joshi", phone: "+919987665432", lastVisit: "2026-07-22", totalOrders: 5, totalSpent: 890, loyaltyTier: "Bronze" },
  { id: "c5", name: "Neha Gupta", phone: "+919801122334", lastVisit: "2026-07-22", totalOrders: 15, totalSpent: 3450, loyaltyTier: "Gold" },
  { id: "c6", name: "Amit Patel", phone: "+919900112233", lastVisit: "2026-07-21", totalOrders: 3, totalSpent: 620, loyaltyTier: "Bronze" },
  { id: "c7", name: "Sara Khan", phone: "+919812345678", lastVisit: "2026-07-21", totalOrders: 7, totalSpent: 1340, loyaltyTier: "Silver" },
  { id: "c8", name: "Deepak Nair", phone: "+919765432109", lastVisit: "2026-07-21", totalOrders: 10, totalSpent: 2100, loyaltyTier: "Silver" },
  { id: "c9", name: "Kavita Rao", phone: "+919898989898", lastVisit: "2026-07-20", totalOrders: 18, totalSpent: 4200, loyaltyTier: "Gold" },
  { id: "c10", name: "Rohan Mehta", phone: "+919700123456", lastVisit: "2026-07-20", totalOrders: 2, totalSpent: 340, loyaltyTier: "Bronze" },
];

export const REVIEWS = [
  { id: "r1", stars: 2, text: "Order took too long and chai was cold.", table: "T4", rescued: false },
  { id: "r2", stars: 5, text: "Best filter coffee in the area!", table: "T2", rescued: null },
  { id: "r3", stars: 2, text: "Wrong item delivered, had to send it back.", table: "T6", rescued: true },
];

export const WALLET = {
  balance: 184.4,
  utilitySentToday: 62,
  marketingSentToday: 4,
};

export const REPORTS_DATA = {
  dailyRevenue: [
    { day: "Mon", revenue: 4200, orders: 28 },
    { day: "Tue", revenue: 3800, orders: 24 },
    { day: "Wed", revenue: 5100, orders: 35 },
    { day: "Thu", revenue: 2900, orders: 19 },
    { day: "Fri", revenue: 6700, orders: 45 },
    { day: "Sat", revenue: 8400, orders: 58 },
    { day: "Sun", revenue: 7200, orders: 49 },
  ],
  topItems: [
    { name: "Adrak Chai", count: 156 },
    { name: "Samosa (2 pc)", count: 98 },
    { name: "Filter Coffee", count: 87 },
    { name: "Paneer Butter Masala + Rice", count: 72 },
    { name: "Chicken Maggi", count: 65 },
  ],
};
