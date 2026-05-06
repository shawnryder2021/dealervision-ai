-- Add contact/address columns to dealerships table if not already present
ALTER TABLE dealerships
  ADD COLUMN IF NOT EXISTS phone     TEXT,
  ADD COLUMN IF NOT EXISTS website   TEXT,
  ADD COLUMN IF NOT EXISTS address   TEXT,
  ADD COLUMN IF NOT EXISTS city      TEXT;
