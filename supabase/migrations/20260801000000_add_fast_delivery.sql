-- Add fast delivery flag to menu_items
ALTER TABLE menu_items ADD COLUMN is_fast_delivery BOOLEAN DEFAULT false;

-- Index for fast querying fast delivery items per restaurant
CREATE INDEX idx_menu_items_fast_delivery ON menu_items(restaurant_id, is_fast_delivery) WHERE is_fast_delivery = true;
