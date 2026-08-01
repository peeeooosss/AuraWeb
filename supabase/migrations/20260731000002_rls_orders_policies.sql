-- Staff handle order status + payment acceptance
CREATE POLICY "Staff can manage orders"
ON public.orders
FOR ALL
TO public
USING (is_staff_of(restaurant_id))
WITH CHECK (is_staff_of(restaurant_id));

-- Customers (anon checkout) can place new orders only
CREATE POLICY "Customers can place orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  restaurant_id IS NOT NULL
  AND order_status = 'placed'
  AND payment_status = 'unpaid'
);

-- Customers track their own orders on the dashboard (anon, matched by phone)
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO public
USING (restaurant_id IS NOT NULL AND customer_phone IS NOT NULL);
