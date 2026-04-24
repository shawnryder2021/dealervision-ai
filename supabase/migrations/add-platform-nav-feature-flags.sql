-- Add configurable app navigation feature flags for platform admin

ALTER TABLE IF EXISTS platform_settings
  ADD COLUMN IF NOT EXISTS app_nav_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE platform_settings
SET app_nav_flags = COALESCE(app_nav_flags, '{}'::jsonb)
WHERE id = 1;

COMMENT ON COLUMN platform_settings.app_nav_flags IS 'Global feature flags that control visibility of dashboard navigation links.';
