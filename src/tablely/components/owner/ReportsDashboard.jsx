import { TrendingUp, ShoppingBag, DollarSign, Clock, UtensilsCrossed, Table2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TicketCard from "../TicketCard";

const COLORS = ["#e8a33d", "#4c7a5d", "#1c4d55", "#c1432f", "#c07c1f"];

export default function ReportsDashboard({ analytics }) {
  const peakDay = analytics.dailyRevenue.reduce(
    (max, day) => (!max || day.revenue > max.revenue ? day : max),
    null
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-5">Reports &amp; Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <TicketCard>
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-sage" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Completed revenue</p></div>
          <p className="font-display text-2xl font-semibold">₹{analytics.totalRevenue.toLocaleString()}</p>
          <p className="font-body text-[10px] text-ink-soft mt-1">From completed orders</p>
        </TicketCard>
        <TicketCard>
          <div className="flex items-center gap-2 mb-1"><ShoppingBag size={14} className="text-marigold-dark" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Completed orders</p></div>
          <p className="font-display text-2xl font-semibold">{analytics.totalOrders}</p>
          <p className="font-body text-[10px] text-ink-soft mt-1">Real restaurant data</p>
        </TicketCard>
        <TicketCard>
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-teal-soft" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Average order</p></div>
          <p className="font-display text-2xl font-semibold">₹{analytics.averageOrderValue.toLocaleString()}</p>
          <p className="font-body text-[10px] text-ink-soft mt-1">Per completed order</p>
        </TicketCard>
        <TicketCard>
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-chili" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Peak day</p></div>
          <p className="font-display text-2xl font-semibold">{peakDay?.day || "No data"}</p>
          <p className="font-body text-[10px] text-ink-soft mt-1">{peakDay ? `₹${peakDay.revenue.toLocaleString()} revenue` : "Complete orders to unlock"}</p>
        </TicketCard>
      </div>

      {analytics.totalOrders === 0 ? (
        <TicketCard>
          <div className="py-12 text-center">
            <ShoppingBag size={28} className="mx-auto text-ink-soft" />
            <p className="mt-3 font-display text-lg font-semibold">Analytics will appear after your first completed order</p>
            <p className="mt-1 font-body text-sm text-ink-soft">No sample data is shown in the live Owner Dashboard.</p>
          </div>
        </TicketCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2">
              <TicketCard>
                <p className="font-display text-base font-semibold mb-4">Daily revenue</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ded2ab" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#2b2d33" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#2b2d33" }} />
                      <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#e8a33d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TicketCard>
            </div>
            <TicketCard>
              <p className="font-display text-base font-semibold mb-4">Top dishes</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.topItems} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="units" nameKey="name">
                      {analytics.topItems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} units`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {analytics.topItems.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2 font-body text-xs">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-ink-soft truncate flex-1">{item.name}</span>
                    <span className="tabular font-mono text-ink-soft">{item.units}</span>
                  </div>
                ))}
              </div>
            </TicketCard>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <TicketCard>
              <div className="flex items-center gap-2"><UtensilsCrossed size={14} className="text-marigold-dark" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Best category</p></div>
              <p className="mt-3 font-display text-xl font-semibold">{analytics.topCategories[0]?.name || "No data"}</p>
              <p className="mt-1 font-body text-xs text-ink-soft">{analytics.topCategories[0] ? `${analytics.topCategories[0].units} units · ₹${analytics.topCategories[0].revenue.toLocaleString()}` : "Category data will appear after completed orders."}</p>
            </TicketCard>
            <TicketCard>
              <div className="flex items-center gap-2"><Table2 size={14} className="text-sage" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Best table</p></div>
              <p className="mt-3 font-display text-xl font-semibold">{analytics.tablePerformance[0]?.name || "No data"}</p>
              <p className="mt-1 font-body text-xs text-ink-soft">{analytics.tablePerformance[0] ? `₹${analytics.tablePerformance[0].revenue.toLocaleString()} · ${analytics.tablePerformance[0].orders} orders` : "Table data will appear after completed orders."}</p>
            </TicketCard>
            <TicketCard>
              <div className="flex items-center gap-2"><Clock size={14} className="text-chili" /><p className="font-body text-xs uppercase tracking-wide text-ink-soft">Peak hour</p></div>
              <p className="mt-3 font-display text-xl font-semibold">{analytics.peakHour}</p>
              <p className="mt-1 font-body text-xs text-ink-soft">Based on completed order times</p>
            </TicketCard>
          </div>

          <TicketCard>
            <p className="font-display text-base font-semibold mb-4">Daily orders</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ded2ab" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#2b2d33" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#2b2d33" }} />
                  <Tooltip formatter={(value) => [`${value} orders`, "Orders"]} />
                  <Bar dataKey="orders" fill="#4c7a5d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TicketCard>
        </>
      )}
    </div>
  );
}
