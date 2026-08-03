-- Arena — deduct credits from user_plans.
-- Upserts a default free-plan row (50 credits) when the user has no plan yet,
-- then decrements the balance with a floor of 0.
-- Called via: POST /rest/v1/rpc/deduct_credits

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  INSERT INTO user_plans (user_id, plan, status, credits_balance, created_at, updated_at)
  VALUES (p_user_id, 'free', 'active', GREATEST(50 - COALESCE(p_credits, 0), 0), now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET credits_balance = GREATEST(user_plans.credits_balance - COALESCE(p_credits, 0), 0),
        updated_at = now()
  RETURNING credits_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) TO authenticated;
