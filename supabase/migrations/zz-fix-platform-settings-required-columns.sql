-- Ensure legacy environments have all required platform_settings columns for admin feature toggles.

CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_image_model TEXT NOT NULL DEFAULT 'openai-gpt-image-2'
    CHECK (default_image_model IN ('kie-nano-banana', 'openai-gpt-image-2')),
  app_nav_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE IF EXISTS platform_settings
  ADD COLUMN IF NOT EXISTS default_image_model TEXT,
  ADD COLUMN IF NOT EXISTS app_nav_flags JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE platform_settings
  ALTER COLUMN default_image_model SET DEFAULT 'openai-gpt-image-2',
  ALTER COLUMN app_nav_flags SET DEFAULT '{}'::jsonb,
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE platform_settings
SET default_image_model = COALESCE(default_image_model, 'openai-gpt-image-2'),
    app_nav_flags = COALESCE(app_nav_flags, '{}'::jsonb),
    updated_at = COALESCE(updated_at, now())
WHERE id = 1;

INSERT INTO platform_settings (id, default_image_model, app_nav_flags, updated_at)
VALUES (1, 'openai-gpt-image-2', '{}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings
  ALTER COLUMN default_image_model SET NOT NULL,
  ALTER COLUMN app_nav_flags SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_settings'
      AND policyname = 'Authenticated users can read platform settings'
  ) THEN
    CREATE POLICY "Authenticated users can read platform settings"
      ON platform_settings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_settings'
      AND policyname = 'Service role can manage platform settings'
  ) THEN
    CREATE POLICY "Service role can manage platform settings"
      ON platform_settings FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON COLUMN platform_settings.app_nav_flags IS 'Global feature flags that control visibility of dashboard navigation links.';
