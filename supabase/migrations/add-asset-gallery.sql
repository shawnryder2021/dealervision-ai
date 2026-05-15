-- Multi-angle gallery support: groups generated_assets that belong to the same
-- vehicle photo set (e.g., 8 angles produced in one batch).
ALTER TABLE generated_assets
  ADD COLUMN IF NOT EXISTS gallery_id UUID,
  ADD COLUMN IF NOT EXISTS gallery_angle TEXT;

-- Speed up lookups for "all assets in this gallery"
CREATE INDEX IF NOT EXISTS idx_generated_assets_gallery
  ON generated_assets (dealership_id, gallery_id)
  WHERE gallery_id IS NOT NULL;

COMMENT ON COLUMN generated_assets.gallery_id IS
  'Optional UUID grouping assets that belong to one multi-angle vehicle gallery.';
COMMENT ON COLUMN generated_assets.gallery_angle IS
  'Which angle this asset represents within the gallery (e.g., "front-3-4", "rear", "wheel-closeup").';
