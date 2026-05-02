-- State Disclaimer Library: associate a dealership with a US state so generated
-- assets auto-include state-specific advertising disclaimers.

ALTER TABLE IF EXISTS dealerships
  ADD COLUMN IF NOT EXISTS state_code TEXT;

COMMENT ON COLUMN dealerships.state_code IS
  'Two-letter US state code. When set, generated images include state-specific dealer-advertising disclaimers.';
