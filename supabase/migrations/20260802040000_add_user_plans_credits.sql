-- Add credit columns to user_plans
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rollover_months INTEGER DEFAULT 0;

-- Update existing rows
UPDATE user_plans SET credits_balance = 300 WHERE plan = 'basic';
UPDATE user_plans SET credits_balance = 900 WHERE plan = 'growth';
UPDATE user_plans SET credits_balance = 3000 WHERE plan = 'pro';
UPDATE user_plans SET credits_granted_at = created_at WHERE credits_granted_at IS NULL;
UPDATE user_plans SET rollover_months = 3 WHERE plan = 'basic';
UPDATE user_plans SET rollover_months = 6 WHERE plan = 'growth';
UPDATE user_plans SET rollover_months = 12 WHERE plan = 'pro';