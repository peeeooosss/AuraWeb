-- Arena — user plan subscriptions (Free / Basic / Growth / Pro)
-- Backed by one-time Razorpay orders that grant a plan for 30 days.

CREATE TABLE IF NOT EXISTS user_plans (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',       -- free / basic / growth / pro
  status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active / expired
  valid_until TIMESTAMPTZ,                        -- NULL = lifetime
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_plans_plan ON user_plans(plan);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plan" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manage plans" ON user_plans
  FOR ALL USING (true);
