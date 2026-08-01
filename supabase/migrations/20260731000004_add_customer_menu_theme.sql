-- Add customer_menu_theme column to restaurants table
-- Stores the owner's chosen theme for the customer-facing menu.
-- Values: 'classic' (default), 'midnight', 'modern'.

ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS customer_menu_theme text NOT NULL DEFAULT 'classic';
