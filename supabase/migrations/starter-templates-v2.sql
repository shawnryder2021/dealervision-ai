-- Starter Templates v2: dealer-saved templates, usage tracking, seasonal
-- collections, favorites, and multi-channel packs.

-- ── New columns ────────────────────────────────────────────────────────────────
ALTER TABLE starter_templates
  -- NULL = platform-curated (global); set = that dealership's own template.
  ADD COLUMN IF NOT EXISTS dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0,
  -- Seasonal collection name, e.g. "Black Friday".
  ADD COLUMN IF NOT EXISTS collection TEXT,
  -- Visibility window (NULL = always visible).
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  -- Extra channels for multi-channel packs (primary `channel` stays).
  ADD COLUMN IF NOT EXISTS channels TEXT[];

CREATE INDEX IF NOT EXISTS idx_starter_templates_dealership
  ON starter_templates (dealership_id, is_active);

-- ── Atomic use counter ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_starter_template_use(p_template_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE starter_templates
     SET use_count = use_count + 1
   WHERE id = p_template_id;
$$;

-- ── Favorites ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_favorites (
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  template_id   UUID NOT NULL REFERENCES starter_templates(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dealership_id, template_id)
);

ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealership members manage own favorites" ON template_favorites;
CREATE POLICY "Dealership members manage own favorites"
  ON template_favorites FOR ALL
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));
