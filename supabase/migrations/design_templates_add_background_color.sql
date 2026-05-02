ALTER TABLE IF EXISTS design_templates
  ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';

COMMENT ON COLUMN design_templates.background_color IS
  'Canvas background color rendered behind all elements.';
