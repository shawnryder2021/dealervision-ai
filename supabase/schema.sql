-- DealerVision AI Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Dealerships
CREATE TABLE dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  tagline TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#FFFFFF", "accent": "#FF0000"}',
  contact JSONB DEFAULT '{}',
  style_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES dealerships(id),
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) NOT NULL,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  price DECIMAL(10,2),
  mileage INTEGER,
  vin TEXT,
  stock_number TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'coming_soon', 'featured')),
  photos TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Assets
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  content_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  storage_path TEXT,
  aspect_ratio TEXT,
  resolution TEXT,
  kie_task_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Credits / Usage Tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) NOT NULL,
  asset_id UUID REFERENCES generated_assets(id),
  action TEXT NOT NULL,
  credits_used DECIMAL(6,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicles_dealership ON vehicles(dealership_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_assets_dealership ON generated_assets(dealership_id);
CREATE INDEX idx_assets_status ON generated_assets(status);
CREATE INDEX idx_assets_content_type ON generated_assets(content_type);
CREATE INDEX idx_assets_kie_task ON generated_assets(kie_task_id);
CREATE INDEX idx_assets_created_at ON generated_assets(created_at DESC);
CREATE INDEX idx_usage_dealership ON usage_logs(dealership_id);

-- Row Level Security
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own dealership data
CREATE POLICY "Users can view own dealership"
  ON dealerships FOR SELECT
  USING (id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own dealership"
  ON dealerships FOR UPDATE
  USING (id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can view dealership vehicles"
  ON vehicles FOR ALL
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage dealership assets"
  ON generated_assets FOR ALL
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view dealership usage"
  ON usage_logs FOR SELECT
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

-- Allow service role to insert profiles and dealerships (for onboarding)
CREATE POLICY "Service role can insert dealerships"
  ON dealerships FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (true);
