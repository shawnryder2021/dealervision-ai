-- Brand Memory: an accumulating knowledge profile per dealership.
-- Injected into every generation (images, descriptions, captions, copy) so the
-- platform "learns" the dealership over time. This is context injection (RAG-style),
-- not model fine-tuning.
--
-- Shape of brand_memory JSONB:
-- {
--   "manual_notes":   "freeform text the dealer writes about themselves",
--   "learned_summary":"AI-generated paragraph distilled from recent activity (dealer-approved)",
--   "preferences": {
--     "tones":          ["confident", "value-driven"],
--     "styles":         ["modern", "premium"],
--     "channels":       ["instagram-post", "facebook-post"],
--     "featured_models":["F-150", "Civic"],
--     "recurring_offers":["0% APR", "$0 down"]
--   },
--   "updated_at": "ISO timestamp"
-- }

ALTER TABLE dealerships
  ADD COLUMN IF NOT EXISTS brand_memory JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN dealerships.brand_memory IS
  'Accumulating dealership knowledge profile (manual notes + AI-learned summary + preferences) injected into generations.';
