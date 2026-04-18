-- Leads table for landing page contact form submissions
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  landing_page_id UUID,          -- optional reference to which landing page
  landing_page_title TEXT,        -- human-readable page name for display
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  vehicle_interest TEXT,          -- which vehicle they're interested in
  source TEXT DEFAULT 'landing_page',  -- for future: 'landing_page' | 'widget' | 'api'
  read_at TIMESTAMP,              -- null = unread
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Only members of the dealership can read their leads
CREATE POLICY "Dealership members can view their leads"
  ON leads FOR SELECT
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Allow public (unauthenticated) lead submissions via service role
-- The API route uses service role key to insert
-- No INSERT policy needed for service role

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_dealership ON leads(dealership_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(dealership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_unread ON leads(dealership_id, read_at) WHERE read_at IS NULL;
