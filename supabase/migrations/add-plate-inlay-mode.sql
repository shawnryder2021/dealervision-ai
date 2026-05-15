-- Adds dealership-level license plate handling mode.
-- Determines how license plates are treated on generated/published vehicle assets:
--   - 'off'     : do nothing (default — no extra processing)
--   - 'blur'    : blur the license plate region for privacy
--   - 'branded' : replace the plate with a clean plate showing the dealership name
ALTER TABLE dealerships
  ADD COLUMN IF NOT EXISTS plate_inlay_mode TEXT
    NOT NULL
    DEFAULT 'off'
    CHECK (plate_inlay_mode IN ('off', 'blur', 'branded'));

COMMENT ON COLUMN dealerships.plate_inlay_mode IS
  'License plate handling: off (default), blur, or branded (replace with dealer name plate).';
