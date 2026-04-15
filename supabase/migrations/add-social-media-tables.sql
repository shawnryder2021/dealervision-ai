-- Social Accounts Table (stores OAuth credentials for social platforms)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'twitter')),
  provider_user_id TEXT NOT NULL,
  account_name TEXT,

  -- OAuth tokens (encrypted in real deployment, plaintext here for demo)
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT, -- For Twitter v1.1 API
  refresh_token TEXT,
  token_expires_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_provider_per_dealership UNIQUE(dealership_id, provider, provider_user_id)
);

-- Published Posts Table (tracks assets published to social)
CREATE TABLE IF NOT EXISTS published_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES generated_assets(id) ON DELETE SET NULL,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,

  -- Post metadata
  platform TEXT NOT NULL,
  post_url TEXT,
  post_id TEXT,
  caption TEXT,

  -- Scheduling
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,

  -- Performance metrics
  metrics JSONB DEFAULT '{}'::JSONB,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'published', 'failed')),
  error_message TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can only access social accounts for their dealership"
  ON social_accounts
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for published_posts
CREATE POLICY "Users can only access published posts for their dealership"
  ON published_posts
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_social_accounts_dealership ON social_accounts(dealership_id);
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX idx_published_posts_dealership ON published_posts(dealership_id);
CREATE INDEX idx_published_posts_asset ON published_posts(asset_id);
CREATE INDEX idx_published_posts_status ON published_posts(status);
CREATE INDEX idx_published_posts_published_at ON published_posts(published_at DESC);
