-- Allow authenticated owners to insert new restaurants (onboarding)
CREATE POLICY "owner_insert_restaurant"
ON public.restaurants FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Allow authenticated owners to update their own restaurant (billing, settings, tier)
CREATE POLICY "owner_update_restaurant"
ON public.restaurants FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Allow authenticated owners to delete their own restaurant
CREATE POLICY "owner_delete_restaurant"
ON public.restaurants FOR DELETE TO authenticated
USING (auth.uid() = owner_id);
