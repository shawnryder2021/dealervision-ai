-- Global platform settings shared across all dealerships
-- Stores defaults that can be changed by super admins.

CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_image_model TEXT NOT NULL DEFAULT 'kie-nano-banana'
    CHECK (default_image_model IN ('kie-nano-banana', 'openai-gpt-image-2')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

INSERT INTO platform_settings (id, default_image_model)
VALUES (1, 'kie-nano-banana')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage platform settings"
  ON platform_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE platform_settings IS 'Global platform defaults managed by super admins.';
COMMENT ON COLUMN platform_settings.default_image_model IS 'Global fallback image model for generation when dealership override is missing.';
