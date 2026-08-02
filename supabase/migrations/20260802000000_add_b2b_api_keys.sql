-- TryAuraAI — B2B API Key & Usage Tracking
-- Supports both B2C (Supabase JWT) and B2B (aurai_live_ API keys) auth flows.

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  monthly_limit INT DEFAULT 100,
  rate_limit INT DEFAULT 50,                -- requests per day
  plan VARCHAR(50) DEFAULT 'starter',       -- starter / growth / enterprise
  balance NUMERIC(12,2) DEFAULT 0,          -- INR wallet balance
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint VARCHAR(100),
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost NUMERIC(12,6) DEFAULT 0,
  model_routed VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own usage" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role insert usage" ON usage_logs
  FOR INSERT WITH CHECK (true);
