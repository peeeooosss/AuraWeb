-- Wallet top-ups audit table for B2B API key wallet

CREATE TABLE IF NOT EXISTS wallet_topups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_topups_user ON wallet_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topups_key ON wallet_topups(api_key_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topups_order ON wallet_topups(razorpay_order_id);

ALTER TABLE wallet_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own topups" ON wallet_topups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role insert topups" ON wallet_topups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update topups" ON wallet_topups
  FOR UPDATE WITH CHECK (true);
