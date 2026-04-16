-- Stripe Billing Tables
-- Adds subscription management, usage metering, and plan definitions.
-- Subscriptions are per-dealership (shared across all team members).

-- ─── Plan definitions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT,

  name TEXT NOT NULL,                    -- 'Starter', 'Professional', 'Enterprise'
  slug TEXT NOT NULL UNIQUE,             -- 'starter', 'professional', 'enterprise'
  description TEXT,
  price_monthly_cents INT NOT NULL,      -- 2999 = $29.99/mo
  is_active BOOLEAN DEFAULT TRUE,

  -- Monthly limits (NULL = unlimited)
  monthly_assets_limit INT,
  monthly_pages_limit INT,
  monthly_posts_limit INT,
  max_team_members INT,
  features JSONB DEFAULT '{}'::JSONB,    -- e.g. {"social_publish": true, "analytics": true}

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed plan rows (price IDs to be filled in from Stripe dashboard)
INSERT INTO subscription_plans
  (stripe_price_id, stripe_product_id, name, slug, description, price_monthly_cents,
   monthly_assets_limit, monthly_pages_limit, monthly_posts_limit, max_team_members, features)
VALUES
  ('price_starter_placeholder',      NULL, 'Starter',      'starter',
   'Perfect for solo dealers getting started with AI marketing',
   2900, 50, 5, 20, 2,
   '{"social_publish": false, "analytics": false, "batch_generate": true}'::JSONB),

  ('price_professional_placeholder', NULL, 'Professional', 'professional',
   'For active dealerships needing high volume and social publishing',
   9900, 500, 50, 200, 10,
   '{"social_publish": true, "analytics": true, "batch_generate": true, "url_import": true}'::JSONB),

  ('price_enterprise_placeholder',   NULL, 'Enterprise',   'enterprise',
   'Unlimited everything for large groups and multi-rooftop dealers',
   29900, NULL, NULL, NULL, NULL,
   '{"social_publish": true, "analytics": true, "batch_generate": true, "url_import": true, "priority_support": true}'::JSONB)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ─── Subscriptions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT REFERENCES subscription_plans(stripe_price_id),

  -- Status mirrors Stripe subscription statuses
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN (
      'incomplete', 'incomplete_expired', 'trialing',
      'active', 'past_due', 'canceled', 'unpaid', 'paused'
    )),

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Stripe billing portal session cache
  portal_url TEXT,
  portal_url_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_dealership
  ON subscriptions(dealership_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions(stripe_customer_id);

-- ─── Usage metrics ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,              -- First day of month: '2026-04-01'

  assets_generated     INT NOT NULL DEFAULT 0,
  landing_pages_created INT NOT NULL DEFAULT 0,
  social_posts_published INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(dealership_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_dealership_month
  ON usage_metrics(dealership_id, month_year DESC);

-- ─── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_usage_metrics_updated_at
  BEFORE UPDATE ON usage_metrics
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── RPC: atomic usage increment ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_usage_metrics(
  p_dealership_id UUID,
  p_month_year    DATE,
  p_assets        INT DEFAULT 0,
  p_pages         INT DEFAULT 0,
  p_posts         INT DEFAULT 0
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO usage_metrics (dealership_id, month_year,
    assets_generated, landing_pages_created, social_posts_published)
  VALUES (p_dealership_id, p_month_year, p_assets, p_pages, p_posts)
  ON CONFLICT (dealership_id, month_year) DO UPDATE SET
    assets_generated      = usage_metrics.assets_generated      + EXCLUDED.assets_generated,
    landing_pages_created = usage_metrics.landing_pages_created + EXCLUDED.landing_pages_created,
    social_posts_published= usage_metrics.social_posts_published+ EXCLUDED.social_posts_published,
    updated_at = now();
END;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Subscription plans are public (anyone can read pricing)
CREATE POLICY "Plans are publicly readable"
  ON subscription_plans FOR SELECT USING (TRUE);

-- Subscriptions: dealership members only
CREATE POLICY "Users can view their dealership subscription"
  ON subscriptions FOR SELECT
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Usage: dealership members only
CREATE POLICY "Users can view their dealership usage"
  ON usage_metrics FOR SELECT
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));
