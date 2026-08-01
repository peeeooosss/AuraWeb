-- Direct UPI payments to the restaurant owner's UPI ID
-- Orders are placed as "unpaid" and the owner confirms via the dashboard.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS upi_utr text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;
