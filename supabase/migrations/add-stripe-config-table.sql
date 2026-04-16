-- Stripe Configuration Management
-- Stores Stripe API credentials and configuration managed by platform admins

CREATE TABLE IF NOT EXISTS stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- API credentials
  secret_key TEXT NOT NULL,                -- sk_test_* or sk_live_*
  publishable_key TEXT NOT NULL,           -- pk_test_* or pk_live_*
  webhook_secret TEXT NOT NULL,            -- whsec_* from webhook endpoint

  -- Account metadata
  account_id TEXT,                         -- Stripe account ID (for verification)
  test_mode BOOLEAN NOT NULL DEFAULT true, -- true=test, false=live

  -- Configuration tracking
  configured_at TIMESTAMPTZ DEFAULT now(),
  configured_by TEXT NOT NULL,             -- Email of admin who configured

  -- Testing & monitoring
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,                   -- 'success' | 'failed'
  last_test_message TEXT,                  -- Error message if failed

  -- Constraints: Only one active config
  CONSTRAINT only_one_active_config
    UNIQUE (CASE WHEN id IS NOT NULL THEN 1 END)
);

CREATE INDEX idx_stripe_config_test_mode ON stripe_config(test_mode);
CREATE INDEX idx_stripe_config_configured_by ON stripe_config(configured_by);

-- Grant access only via RLS policy
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can view Stripe config
CREATE POLICY "Only super admins can access stripe config"
  ON stripe_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND revoked_at IS NULL
    )
  );

-- Allow super admins to manage config
CREATE POLICY "Super admins can update stripe config"
  ON stripe_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND revoked_at IS NULL
    )
  );

-- Create helper function to get the current Stripe config
-- Used by API routes to load credentials
CREATE OR REPLACE FUNCTION get_stripe_config()
RETURNS TABLE (
  secret_key TEXT,
  publishable_key TEXT,
  webhook_secret TEXT,
  test_mode BOOLEAN
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT secret_key, publishable_key, webhook_secret, test_mode
  FROM stripe_config
  ORDER BY configured_at DESC
  LIMIT 1;
$$;

COMMENT ON TABLE stripe_config IS 'Stripe API credentials. Managed by platform admins only.';
COMMENT ON FUNCTION get_stripe_config IS 'Returns current Stripe configuration for API use.';
