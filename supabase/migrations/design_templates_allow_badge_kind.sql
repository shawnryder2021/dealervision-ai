-- Allow design_templates.kind='badge' for user-saved reusable composites.
ALTER TABLE IF EXISTS design_templates DROP CONSTRAINT IF EXISTS design_templates_kind_check;
ALTER TABLE IF EXISTS design_templates
  ADD CONSTRAINT design_templates_kind_check CHECK (kind IN ('template', 'draft', 'badge'));
