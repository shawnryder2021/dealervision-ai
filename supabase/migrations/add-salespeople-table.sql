-- Salesperson personal pages: each dealer can have N salespeople with public landing pages.

CREATE TABLE IF NOT EXISTS salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER,
  languages TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  social JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salespeople_unique_slug UNIQUE (dealership_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_salespeople_dealership ON salespeople(dealership_id);
CREATE INDEX IF NOT EXISTS idx_salespeople_active ON salespeople(dealership_id, is_active) WHERE is_active = true;

ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='salespeople'
      AND policyname='Dealership members can manage salespeople'
  ) THEN
    CREATE POLICY "Dealership members can manage salespeople"
      ON salespeople FOR ALL TO authenticated
      USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='salespeople'
      AND policyname='Public can view active salespeople'
  ) THEN
    CREATE POLICY "Public can view active salespeople"
      ON salespeople FOR SELECT TO anon
      USING (is_active = true);
  END IF;
END $$;

COMMENT ON TABLE salespeople IS 'Per-dealership salesperson profiles for personal landing pages.';
