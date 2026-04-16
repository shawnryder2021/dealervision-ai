-- Inventory Sources Table (tracks URL sources for auto-import)
CREATE TABLE IF NOT EXISTS inventory_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- Source metadata
  source_type TEXT DEFAULT 'generic_scrape' CHECK (source_type IN ('generic_scrape', 'csv_endpoint', 'xml_feed')),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,

  -- Field mapping configuration (CSS selectors or XPath patterns)
  field_mapping JSONB DEFAULT '{}'::JSONB,

  -- Auto-sync configuration
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_frequency TEXT CHECK (sync_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
  sync_time TIME DEFAULT '02:00:00', -- When to run scheduled sync

  -- Status tracking
  last_sync_at TIMESTAMP,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'pending')) DEFAULT 'pending',
  vehicles_imported_count INT DEFAULT 0,
  last_error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Inventory Sync Logs (track history of each sync execution)
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES inventory_sources(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- Sync metadata
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'scheduled')),
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,

  -- Results
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  total_found INT,
  new_added INT DEFAULT 0,
  updated INT DEFAULT 0,
  removed INT DEFAULT 0,

  -- Error tracking
  errors JSONB DEFAULT '[]'::JSONB, -- Array of error objects

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Vehicle Import Records (map imported vehicles to sources for deduplication)
CREATE TABLE IF NOT EXISTS vehicle_import_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES inventory_sources(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,

  -- External ID from source (VIN, stock number, or URL slug)
  external_id TEXT NOT NULL,

  -- Raw scraped data before normalization
  original_data JSONB DEFAULT '{}'::JSONB,

  -- Tracking
  imported_at TIMESTAMP DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT now(),

  -- Unique constraint: one vehicle per source per external ID
  CONSTRAINT unique_import_record UNIQUE(source_id, external_id)
);

-- Enable RLS
ALTER TABLE inventory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_import_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_sources
CREATE POLICY "Users can only access inventory sources for their dealership"
  ON inventory_sources
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for inventory_sync_logs
CREATE POLICY "Users can only access sync logs for their dealership"
  ON inventory_sync_logs
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for vehicle_import_records
CREATE POLICY "Users can only access import records for their dealership"
  ON vehicle_import_records
  FOR ALL
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_inventory_sources_dealership ON inventory_sources(dealership_id);
CREATE INDEX idx_inventory_sources_auto_sync ON inventory_sources(dealership_id, auto_sync_enabled) WHERE auto_sync_enabled = true;
CREATE INDEX idx_inventory_sources_updated_at ON inventory_sources(updated_at DESC);

CREATE INDEX idx_inventory_sync_logs_source ON inventory_sync_logs(source_id);
CREATE INDEX idx_inventory_sync_logs_dealership ON inventory_sync_logs(dealership_id);
CREATE INDEX idx_inventory_sync_logs_status ON inventory_sync_logs(status);
CREATE INDEX idx_inventory_sync_logs_created_at ON inventory_sync_logs(created_at DESC);

CREATE INDEX idx_vehicle_import_records_source ON vehicle_import_records(source_id);
CREATE INDEX idx_vehicle_import_records_vehicle ON vehicle_import_records(vehicle_id);
CREATE INDEX idx_vehicle_import_records_external_id ON vehicle_import_records(source_id, external_id);
