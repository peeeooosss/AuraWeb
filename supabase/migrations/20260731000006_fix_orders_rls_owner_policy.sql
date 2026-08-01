-- Drop existing customer insert policy and recreate with both payment statuses
DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;

CREATE POLICY "Customers can place orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  restaurant_id IS NOT NULL
  AND order_status = 'placed'
  AND (payment_status = 'unpaid' OR payment_status = 'pending_verification')
);

-- Drop and recreate owner policy
DROP POLICY IF EXISTS "Owner can manage orders" ON public.orders;

CREATE POLICY "Owner can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = orders.restaurant_id
    AND r.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = orders.restaurant_id
    AND r.owner_id = auth.uid()
  )
);
