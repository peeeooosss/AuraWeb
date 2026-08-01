import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function normalizeOrder(order) {
  return {
    ...order,
    table: order.table_number,
    status: order.order_status,
    type: order.order_type,
    total: Number(order.total) || 0,
    subtotal: Number(order.subtotal) || 0,
    taxAmount: Number(order.tax_amount) || 0,
    serviceCharge: Number(order.service_charge) || 0,
    customerName: order.customer_name || "Walk-in",
    customerPhone: order.customer_phone || "",
    items: Array.isArray(order.items) ? order.items : [],
    placedAt: order.created_at ? new Date(order.created_at).toLocaleTimeString() : "",
    placedDate: order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
  };
}

export default function useRestaurantOrders(restaurantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setOrders([]);
    } else {
      setError("");
      setOrders((data || []).map(normalizeOrder));
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!restaurantId) return undefined;
    const channel = supabase
      .channel(`owner-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        fetchOrders
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [restaurantId, fetchOrders]);

  return { orders, loading, error, refreshOrders: fetchOrders };
}
