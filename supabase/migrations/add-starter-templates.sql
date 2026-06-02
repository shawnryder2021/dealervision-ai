-- Starter Templates: a platform-curated, GLOBAL gallery of example marketing
-- pieces. Each row pairs a preview image with the generation settings used to
-- create it. Dealers browse and "use" a template, which prefills the Generate
-- form (they bind their own vehicle and regenerate).
--
-- Global (no dealership_id): the same curated library is shared with every dealer.
-- Reads: any authenticated user. Writes: super admins only (enforced in the API
-- via service-role client + isSuperAdmin; RLS blocks all anon/authed writes).

CREATE TABLE IF NOT EXISTS starter_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,                         -- e.g. "Vehicle Spotlight", "Sales Event", "Seasonal"
  preview_image_url TEXT NOT NULL,              -- the example image
  -- Generation settings the dealer's pick will prefill:
  content_type    TEXT NOT NULL,
  channel         TEXT,
  style           TEXT,
  scene_location  TEXT,
  headline        TEXT,
  subheadline     TEXT,
  cta             TEXT,
  prompt_notes    TEXT,                         -- the "prompt used" shown to the dealer
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_starter_templates_active
  ON starter_templates (is_active, sort_order);

ALTER TABLE starter_templates ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read the active library.
DROP POLICY IF EXISTS "Authenticated can read starter templates" ON starter_templates;
CREATE POLICY "Authenticated can read starter templates"
  ON starter_templates FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies: writes happen only via the service-role
-- client in the admin API (which checks isSuperAdmin). Service role bypasses RLS.
