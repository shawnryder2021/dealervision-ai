-- Fix FK constraints on usage_logs and planned_content so that deleting
-- a generated_asset automatically removes related rows (ON DELETE CASCADE).
-- Previously set to NO ACTION, which blocked all asset deletions from the library.

ALTER TABLE usage_logs
  DROP CONSTRAINT usage_logs_asset_id_fkey,
  ADD CONSTRAINT usage_logs_asset_id_fkey
    FOREIGN KEY (asset_id) REFERENCES generated_assets(id) ON DELETE CASCADE;

ALTER TABLE planned_content
  DROP CONSTRAINT planned_content_asset_id_fkey,
  ADD CONSTRAINT planned_content_asset_id_fkey
    FOREIGN KEY (asset_id) REFERENCES generated_assets(id) ON DELETE CASCADE;
