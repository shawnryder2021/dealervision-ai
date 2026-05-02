-- OEM Co-op Compliance: associate a dealership with a manufacturer brand
-- so generated assets follow the brand's advertising guidelines.

ALTER TABLE IF EXISTS dealerships
  ADD COLUMN IF NOT EXISTS oem_brand TEXT;

COMMENT ON COLUMN dealerships.oem_brand IS
  'When set, all generated images include OEM co-op compliance instructions (logo, fonts, layout, disclaimers).';
