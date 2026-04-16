-- Activity Events Table (persists team activity feed per dealership)
-- Previously stored in localStorage only. This migration moves the activity
-- feed to a real durable, multi-tenant, RLS-protected table.
--
-- Column shape matches the existing ActivityEvent TypeScript interface in
-- /lib/activity.ts so the DB layer in /lib/db/activity.ts can insert/select
-- rows without translation.

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- Actor (who did this)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,

  -- Action taken + what entity it targeted
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('asset', 'vehicle', 'landing_page', 'settings', 'template')
  ),
  entity_id TEXT,

  -- Free-form context
  details JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access activity for their own dealership
CREATE POLICY "Users can view activity for their dealership"
  ON activity_events
  FOR SELECT
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity for their dealership"
  ON activity_events
  FOR INSERT
  WITH CHECK (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Primary read pattern: activity feed ordered by recency per dealership
CREATE INDEX IF NOT EXISTS idx_activity_events_feed
  ON activity_events(dealership_id, created_at DESC);

-- Secondary read patterns: filter by entity type or actor
CREATE INDEX IF NOT EXISTS idx_activity_events_entity
  ON activity_events(dealership_id, entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_user
  ON activity_events(dealership_id, user_id, created_at DESC);
