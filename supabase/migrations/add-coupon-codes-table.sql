-- Create coupon_codes table for discount management
CREATE TABLE coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Coupon identification
  code TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Discount configuration
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_trial_days')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),

  -- Usage limits
  max_uses INT,
  current_uses INT DEFAULT 0,

  -- Plan applicability (null = all plans)
  applicable_plans TEXT[] DEFAULT NULL,

  -- Availability
  active BOOLEAN DEFAULT true,
  expiration_date TIMESTAMP,

  -- Metadata and tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Track coupon usage per dealership
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  subscription_id TEXT,
  discount_amount NUMERIC NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(coupon_id, dealership_id)
);

-- Create indexes for performance
CREATE INDEX idx_coupon_codes_active ON coupon_codes(active, expiration_date);
CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_usage_dealership ON coupon_usage(dealership_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);

-- Enable RLS
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupon_codes
-- Super admins can view all, create, update, delete
CREATE POLICY "Super admins can manage coupons"
  ON coupon_codes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE email IN (SELECT email FROM super_admins)));

-- Regular users cannot view coupon codes (they validate via API)

-- RLS Policies for coupon_usage
-- Dealerships can view their own coupon usage
CREATE POLICY "Dealerships can view their coupon usage"
  ON coupon_usage FOR SELECT
  USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

-- Super admins can view all coupon usage
CREATE POLICY "Super admins can view all coupon usage"
  ON coupon_usage FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE email IN (SELECT email FROM super_admins)));
