-- Fix balance precision: NUMERIC(12,2) rounds micro-costs to zero
ALTER TABLE api_keys ALTER COLUMN balance TYPE NUMERIC(16,6);

-- Atomic balance deduction RPC function
-- Called via: POST /rest/v1/rpc/deduct_balance
-- Body: { "p_key_id": "uuid", "p_cost": 1.234567 }
-- Returns: new balance (numeric) or -1 if insufficient funds / key not found
CREATE OR REPLACE FUNCTION deduct_balance(p_key_id UUID, p_cost NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  SELECT balance INTO current_balance
  FROM api_keys
  WHERE id = p_key_id AND active = true;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  IF current_balance < p_cost THEN
    RETURN -1;
  END IF;

  new_balance := current_balance - p_cost;

  UPDATE api_keys
  SET balance = new_balance
  WHERE id = p_key_id;

  RETURN new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_balance(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_balance(UUID, NUMERIC) TO authenticated;
