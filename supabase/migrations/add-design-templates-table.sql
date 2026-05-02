-- Canva-style design studio: layered designs (templates + drafts) for dealerships.

CREATE TABLE IF NOT EXISTS design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  created_by UUID,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'draft' CHECK (kind IN ('template', 'draft')),
  thumbnail_url TEXT,
  exported_url TEXT,
  canvas_size TEXT NOT NULL DEFAULT 'instagram-post',
  canvas_width INTEGER NOT NULL DEFAULT 1080,
  canvas_height INTEGER NOT NULL DEFAULT 1080,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_templates_dealership_kind
  ON design_templates(dealership_id, kind, updated_at DESC);

ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='design_templates'
      AND policyname='Dealership members manage their designs'
  ) THEN
    CREATE POLICY "Dealership members manage their designs"
      ON design_templates FOR ALL TO authenticated
      USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

COMMENT ON TABLE design_templates IS
  'Canva-style layered designs. kind=template are reusable; kind=draft are work-in-progress.';
