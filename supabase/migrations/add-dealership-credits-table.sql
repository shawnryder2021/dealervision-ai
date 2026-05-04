-- Dealership Credits System
-- Credits are manually allocated by admins and act as an alternative
-- to Stripe subscriptions. 1 credit = 1 asset generation.

-- ── Balance table (one row per dealership) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealership_credits (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id   UUID      UNIQUE NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  balance         INTEGER   NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_granted   INTEGER   NOT NULL DEFAULT 0,
  total_used      INTEGER   NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Transaction ledger ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id  UUID      NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  amount         INTEGER   NOT NULL,            -- positive = grant/adjustment, negative = usage
  type           TEXT      NOT NULL CHECK (type IN ('grant', 'usage', 'adjustment')),
  note           TEXT,
  admin_email    TEXT,                          -- who performed the action (null for system usage)
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credit_transactions_dealership
  ON credit_transactions(dealership_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE dealership_credits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions  ENABLE ROW LEVEL SECURITY;

-- Dealers can read their own balance
CREATE POLICY "Dealership members can view own credits"
  ON dealership_credits FOR SELECT
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Dealers can read their own transaction history
CREATE POLICY "Dealership members can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only the service role (admin API) can write to these tables
-- (service role bypasses RLS automatically — these policies exist
--  as an explicit deny for normal authenticated users)
CREATE POLICY "Authenticated users cannot modify credits"
  ON dealership_credits FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Authenticated users cannot modify credit transactions"
  ON credit_transactions FOR ALL
  USING (false)
  WITH CHECK (false);

-- ── Atomic deduct helper (called server-side, prevents race conditions) ───────
CREATE OR REPLACE FUNCTION deduct_one_credit(p_dealership_id UUID)
RETURNS INTEGER   -- returns new balance, or -1 if insufficient
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE dealership_credits
  SET
    balance     = balance - 1,
    total_used  = total_used + 1,
    updated_at  = NOW()
  WHERE dealership_id = p_dealership_id
    AND balance > 0
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Record the transaction
  INSERT INTO credit_transactions (dealership_id, amount, type, note)
  VALUES (p_dealership_id, -1, 'usage', 'Asset generation');

  RETURN v_new_balance;
END;
$$;
