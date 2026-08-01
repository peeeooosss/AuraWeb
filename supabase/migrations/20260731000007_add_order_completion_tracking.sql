ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_restaurant_created_idx
ON public.orders (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_restaurant_status_idx
ON public.orders (restaurant_id, order_status);
