-- Email subscribers list
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'manual',  -- 'manual' | 'lead_form' | 'import'
  UNIQUE (dealership_id, email)
);

-- Email campaigns (sent emails)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_body TEXT NOT NULL,
  template_id TEXT,           -- which template was used
  asset_id UUID,              -- generated asset used as hero image
  asset_url TEXT,             -- cached image URL
  status TEXT DEFAULT 'draft', -- 'draft' | 'sent'
  recipient_count INT DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealership members can manage subscribers"
  ON email_subscribers FOR ALL
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Dealership members can manage email campaigns"
  ON email_campaigns FOR ALL
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_subscribers_dealership ON email_subscribers(dealership_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(dealership_id) WHERE unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_campaigns_dealership ON email_campaigns(dealership_id, created_at DESC);
