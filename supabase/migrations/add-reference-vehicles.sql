-- Admin-curated reference vehicle photos used to improve AI generation accuracy.
-- When a user generates content for "2024 Ford F-150 King Ranch", the platform
-- looks up matching reference photos (best-match: trim → model+year → model)
-- and passes them as image_input to the generation provider so the rendered
-- vehicle visually matches the real-world body, trim details, and proportions.
--
-- This is a PLATFORM-wide library (not per-dealership). Every dealership
-- benefits from the same curated reference set. Only super admins can write.

CREATE TABLE IF NOT EXISTS reference_vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year            INT NOT NULL,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  -- trim is nullable: a NULL trim entry applies to ALL trims of that year/make/model
  trim            TEXT,
  -- color is nullable: helpful when a reference is color-specific
  color           TEXT,
  image_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  -- Admin-only context: "side profile", "front 3/4", "interior dashboard", etc.
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Speed up the year/make/model/trim lookup used at generation time
CREATE INDEX IF NOT EXISTS idx_reference_vehicles_lookup
  ON reference_vehicles (make, model, year, trim)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_reference_vehicles_created
  ON reference_vehicles (created_at DESC);

-- RLS: read is open to any authenticated user, write is super-admin-only.
ALTER TABLE reference_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reference_vehicles_select_authenticated" ON reference_vehicles;
CREATE POLICY "reference_vehicles_select_authenticated"
  ON reference_vehicles
  FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "reference_vehicles_insert_super_admin" ON reference_vehicles;
CREATE POLICY "reference_vehicles_insert_super_admin"
  ON reference_vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Use auth.jwt()->>'email' instead of joining auth.users — authenticated
    -- users don't have permission to read auth.users directly.
    EXISTS (
      SELECT 1
      FROM super_admins sa
      WHERE sa.email = (auth.jwt()->>'email')
        AND sa.revoked_at IS NULL
    )
  );

DROP POLICY IF EXISTS "reference_vehicles_update_super_admin" ON reference_vehicles;
CREATE POLICY "reference_vehicles_update_super_admin"
  ON reference_vehicles
  FOR UPDATE
  TO authenticated
  USING (
    -- Use auth.jwt()->>'email' instead of joining auth.users — authenticated
    -- users don't have permission to read auth.users directly.
    EXISTS (
      SELECT 1
      FROM super_admins sa
      WHERE sa.email = (auth.jwt()->>'email')
        AND sa.revoked_at IS NULL
    )
  );

DROP POLICY IF EXISTS "reference_vehicles_delete_super_admin" ON reference_vehicles;
CREATE POLICY "reference_vehicles_delete_super_admin"
  ON reference_vehicles
  FOR DELETE
  TO authenticated
  USING (
    -- Use auth.jwt()->>'email' instead of joining auth.users — authenticated
    -- users don't have permission to read auth.users directly.
    EXISTS (
      SELECT 1
      FROM super_admins sa
      WHERE sa.email = (auth.jwt()->>'email')
        AND sa.revoked_at IS NULL
    )
  );

COMMENT ON TABLE reference_vehicles IS
  'Platform-wide library of admin-uploaded reference photos for AI generation accuracy. Looked up at generate-time by year/make/model/trim.';
COMMENT ON COLUMN reference_vehicles.trim IS
  'NULL means the reference applies to all trims of that year/make/model.';
COMMENT ON COLUMN reference_vehicles.color IS
  'Optional. NULL means the reference is color-agnostic.';
