-- Public (anon) can read restaurant info so the customer QR portal shows
-- the owner's real menu instead of falling back to demo data.
CREATE POLICY "public_read_restaurants"
ON public.restaurants
FOR SELECT
TO public
USING (true);
