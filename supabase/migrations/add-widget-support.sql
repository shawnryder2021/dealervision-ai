-- Conversion Widgets: embeddable lead-gen tools (AI chat, trade-in estimator, test-drive booking)
-- 1) leads.metadata     — structured payload per widget (trade details, chat summary, requested slot)
-- 2) dealerships.widget_settings — per-dealership widget config (enabled widgets, chat greeting, etc.)
-- 3) appointments       — test-drive booking requests the dealer confirms

-- ── 1. leads.metadata ───────────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ── 2. dealerships.widget_settings ───────────────────────────────────────────
ALTER TABLE dealerships ADD COLUMN IF NOT EXISTS widget_settings JSONB DEFAULT '{}'::jsonb;

-- ── 3. appointments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_dealership ON appointments(dealership_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(dealership_id, status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Dealership members can read/manage their appointments.
-- Public (widget) inserts go through the service role, which bypasses RLS — no INSERT policy needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments'
      AND policyname='Dealership members can manage appointments'
  ) THEN
    CREATE POLICY "Dealership members can manage appointments"
      ON appointments FOR ALL TO authenticated
      USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

COMMENT ON TABLE appointments IS 'Test-drive booking requests captured by the embeddable booking widget.';
COMMENT ON COLUMN leads.metadata IS 'Structured per-source payload (trade-in details, chat transcript summary, requested slot).';
COMMENT ON COLUMN dealerships.widget_settings IS 'Per-dealership conversion-widget config: enabled widgets, chat greeting, accent overrides.';
