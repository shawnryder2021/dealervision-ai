-- Custom backgrounds uploaded by dealerships for use with background swap
CREATE TABLE IF NOT EXISTS custom_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                         -- Dealer-friendly name (e.g., "Showroom Floor - Main Lot")
  image_url TEXT NOT NULL,                    -- ImgBB hosted URL of the background
  thumbnail_url TEXT,                         -- Smaller preview URL
  description TEXT,                           -- Optional: additional prompt context
  is_favorite BOOLEAN DEFAULT false,          -- Pinned backgrounds appear first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE custom_backgrounds ENABLE ROW LEVEL SECURITY;

-- Dealership members can view their own backgrounds
CREATE POLICY "Dealership members can view their custom backgrounds"
  ON custom_backgrounds FOR SELECT
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Dealership members can insert backgrounds for their dealership
CREATE POLICY "Dealership members can create custom backgrounds"
  ON custom_backgrounds FOR INSERT
  WITH CHECK (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Dealership members can update their own backgrounds
CREATE POLICY "Dealership members can update their custom backgrounds"
  ON custom_backgrounds FOR UPDATE
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Dealership members can delete their backgrounds
CREATE POLICY "Dealership members can delete their custom backgrounds"
  ON custom_backgrounds FOR DELETE
  USING (dealership_id IN (
    SELECT dealership_id FROM profiles WHERE id = auth.uid()
  ));

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_custom_backgrounds_dealership
  ON custom_backgrounds(dealership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_backgrounds_favorites
  ON custom_backgrounds(dealership_id, is_favorite, created_at DESC)
  WHERE is_favorite = true;
