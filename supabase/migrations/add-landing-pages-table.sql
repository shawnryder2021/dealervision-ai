-- Landing Pages Table (persists promotional landing pages per dealership)
-- Previously stored in localStorage only; this migration moves them to a real
-- durable, multi-tenant, RLS-protected table.

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- Core content
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- Hero & messaging
  hero_image_url TEXT,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  description TEXT,

  -- Branding
  brand_colors JSONB DEFAULT '{}'::JSONB,

  -- Dealership info snapshot (denormalized for render speed + historical accuracy)
  dealership_name TEXT,
  dealership_phone TEXT,
  dealership_address TEXT,
  dealership_website TEXT,

  -- Optional featured vehicle
  vehicle JSONB,

  -- Features list + config
  features JSONB DEFAULT '[]'::JSONB,
  show_contact_form BOOLEAN DEFAULT true,
  show_map BOOLEAN DEFAULT false,
  custom_css TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_slug_per_dealership UNIQUE (dealership_id, slug)
);

-- Enable RLS
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access landing pages for their own dealership
CREATE POLICY "Users can access landing pages for their dealership"
  ON landing_pages
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_landing_pages_dealership
  ON landing_pages(dealership_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug
  ON landing_pages(dealership_id, slug);

CREATE INDEX IF NOT EXISTS idx_landing_pages_published
  ON landing_pages(dealership_id, status)
  WHERE status = 'published';

-- Update trigger keeps updated_at fresh automatically
CREATE OR REPLACE FUNCTION touch_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER trg_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION touch_landing_pages_updated_at();
