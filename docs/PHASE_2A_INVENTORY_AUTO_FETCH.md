# Phase 2A: Inventory Auto-Fetch Implementation

## Overview

Phase 2A implements one-time inventory import from URL with automatic field detection. Users can now:

1. Enter a dealership inventory URL
2. Automatically detect vehicle fields (year, make, model, price, etc.)
3. Preview detected vehicles
4. Import vehicles with one click

## Implementation Status

✅ **COMPLETE** - All components built and ready for testing

## Architecture

### Core Components

#### 1. Web Scraping Engine (`/lib/scraper.ts`)
- **`scrapeUrl(url, options)`** - Fetches and parses HTML from URL
- **`detectVehicleItems($)`** - Identifies vehicle containers using common CSS patterns
- **`extractVehicles($, items, fieldMapping)`** - Extracts vehicle data from items
- **`normalizeVehicle(raw, dealershipId)`** - Converts to Vehicle schema

**Key Features:**
- Automatic vehicle item detection
- Heuristic-based field extraction (patterns for year, make, model, price, mileage, VIN, stock number)
- Photo URL extraction
- Configurable CSS selector mapping

#### 2. Field Detection Engine (`/lib/field-detector.ts`)
- **`detectFields(vehicles)`** - Analyzes sample vehicles to infer field mappings
- **`validateMapping(mapping)`** - Validates required/recommended fields
- **`suggestSelectors(fieldName)`** - Suggests CSS selectors for common fields
- **`scoreMappingQuality(mapping)`** - Scores mapping confidence

**Detection Patterns:**
- Year: 4-digit numbers (1900-2100)
- Make: Common manufacturer names (Toyota, Ford, Honda, etc.)
- Model: Next word(s) after make
- Trim: Text in parentheses or after model
- Price: Dollar amounts ($X,XXX)
- Mileage: Numbers followed by "mi" or "miles"
- VIN: 17-character alphanumeric codes
- Stock Number: Alphanumeric codes after "Stock #" or similar

#### 3. Database Layer (`/lib/db/inventory.ts`)
- **`getInventorySources(dealershipId)`** - List all sources
- **`createInventorySource(...)`** - Create new source record
- **`updateInventorySource(...)`** - Update source configuration
- **`updateSourceSyncStatus(...)`** - Update sync results
- **`createSyncLog(...)`** - Record sync execution
- **`updateSyncLog(...)`** - Update sync results
- **`createVehicleImportRecord(...)`** - Track imported vehicles

#### 4. API Endpoints

**POST /api/inventory/detect**
- Input: `{ sourceUrl, fieldMapping? }`
- Output: `{ success, detectedFields[], suggestedMapping, vehicles[], preview[], confidence, itemCount }`
- Purpose: Detect fields without importing

**POST /api/inventory/import**
- Input: `{ sourceUrl, sourceName, fieldMapping?, sourceId? }`
- Output: `{ success, failed, errors[], importedIds[], syncLogId }`
- Purpose: Import vehicles from URL into database

**GET /api/inventory/sources**
- Output: `{ sources[] }`
- Purpose: List all sources for dealership

**DELETE /api/inventory/sources**
- Input: `{ sourceId }`
- Purpose: Delete source

#### 5. User Interface (`/app/(dashboard)/dashboard/vehicles/import-from-url/page.tsx`)
- Step 1: URL & Detection - Enter URL, click "Detect Fields"
- Step 2: Preview & Configure - View detected vehicles, enter source name, customize mapping
- Step 3: Results - Show import success/failure details

## Database Schema

```sql
-- Track inventory imports from URLs
CREATE TABLE inventory_sources (
  id UUID PRIMARY KEY,
  dealership_id UUID REFERENCES dealerships(id),
  source_type TEXT, -- 'generic_scrape', 'csv_endpoint', 'xml_feed'
  source_url TEXT,
  source_name TEXT,
  field_mapping JSONB,
  auto_sync_enabled BOOLEAN,
  sync_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  sync_time TIME,
  last_sync_at TIMESTAMP,
  last_sync_status TEXT, -- 'success', 'partial', 'failed', 'pending'
  vehicles_imported_count INT,
  last_error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Track sync history
CREATE TABLE inventory_sync_logs (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES inventory_sources(id),
  dealership_id UUID REFERENCES dealerships(id),
  sync_type TEXT, -- 'manual', 'scheduled'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT, -- 'running', 'success', 'partial', 'failed'
  total_found INT,
  new_added INT,
  updated INT,
  removed INT,
  errors JSONB,
  created_at TIMESTAMP
);

-- Map imported vehicles to sources
CREATE TABLE vehicle_import_records (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  source_id UUID REFERENCES inventory_sources(id),
  dealership_id UUID REFERENCES dealerships(id),
  external_id TEXT, -- VIN, stock number, or URL slug
  original_data JSONB, -- Raw scraped data
  imported_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Dependencies Required

Add to `package.json`:

```bash
npm install cheerio@^1.0.0 @types/cheerio --save
```

This adds:
- `cheerio` - Fast HTML parser for Node.js
- `@types/cheerio` - TypeScript type definitions

## User Flow

### One-Time Import

```
1. User navigates to /dashboard/vehicles/import-from-url
2. Enters dealership inventory URL (e.g., "https://example.com/inventory")
3. Clicks "Detect Fields"
4. Platform:
   - Fetches HTML from URL
   - Detects vehicle items (divs, tables, etc.)
   - Extracts fields using heuristics
   - Returns: field list, confidence scores, preview
5. User reviews preview and optionally customizes field mapping
6. Enters source name (e.g., "Main Website")
7. Clicks "Import Vehicles"
8. Platform:
   - Scrapes URL again with finalized mapping
   - Creates vehicles in database
   - Deduplicates using VIN/stock number
   - Returns: success count, errors
9. User sees results and can view imported vehicles
```

## Testing Checklist

### Phase 2A Testing

- [ ] **Detection Accuracy**
  - [ ] Test with real dealer website
  - [ ] Verify field detection confidence > 80% for required fields
  - [ ] Check that preview shows correct vehicles

- [ ] **Import Success**
  - [ ] Import 10+ vehicles from test URL
  - [ ] Verify vehicles appear in inventory list
  - [ ] Check vehicle details (year, make, model, price)
  - [ ] Verify photos are extracted (if available on source)

- [ ] **Error Handling**
  - [ ] Test with invalid URL (should show error)
  - [ ] Test with website that blocks scraping (should show helpful error)
  - [ ] Test with malformed vehicle data (should skip rows with errors)

- [ ] **UI/UX**
  - [ ] Progress indicators work correctly
  - [ ] Back button works between steps
  - [ ] Success/error messages are clear
  - [ ] Can import multiple sources
  - [ ] Source list displays correctly

- [ ] **Database**
  - [ ] inventory_sources created with correct data
  - [ ] inventory_sync_logs track execution
  - [ ] vehicle_import_records prevent duplicates
  - [ ] RLS policies work correctly

### Example Test URLs

Try these dealer websites for testing:

1. **Simple HTML Layout** - Small dealership with clean HTML
2. **Complex Table Layout** - Dealership using data tables
3. **Grid/Card Layout** - Modern dealership with card-based design

## Known Limitations

1. **JavaScript-Rendered Content** - Cannot parse sites that require JavaScript execution
   - Future: Add Puppeteer support for JS-heavy sites
   
2. **Anti-Scraping Measures** - Some sites may block automated requests
   - Mitigation: User-agent rotation, respect robots.txt
   
3. **Custom Field Layouts** - Very custom HTML layouts may not be detected
   - Solution: User can manually provide CSS selectors for field mapping

4. **Photo Extraction** - Photos are stored as URLs (not re-hosted)
   - Future: Phase 2B will add ImgBB re-hosting

## Next Steps (Phase 2B)

1. **Scheduled Auto-Sync**
   - Set up cron jobs for daily/weekly/monthly syncs
   - Change detection (new vehicles, price updates, sold vehicles)
   - Auto-remove stale vehicles

2. **Photo Re-Hosting**
   - Async queue for ImgBB uploads
   - Fallback if ImgBB fails
   - Track bandwidth usage

3. **Sync Monitoring**
   - Dashboard widget showing last sync time
   - Error alerts and retry options
   - Sync history with detailed logs

4. **Field Mapping Improvements**
   - Manual field mapping UI with test preview
   - Saved mappings per source
   - Field mapping templates

## Performance Notes

- **Timeout**: 30 seconds per URL scrape (configurable)
- **Batch Processing**: Vehicles processed sequentially with error handling
- **Database**: Bulk inserts with deduplication checks
- **Photo Extraction**: Non-blocking (stored as URLs for now)

## Monitoring & Debugging

### Enable Detailed Logging

The API endpoints log to console.error() and include usage_logs table entries:

```typescript
await supabase.from("usage_logs").insert({
  dealership_id: dealershipId,
  action: "inventory_detect", // or "inventory_import"
  credits_used: 0,
  metadata: {
    sourceUrl,
    itemCount,
    vehiclesDetected,
    confidence,
  },
});
```

### Common Issues & Solutions

**Issue: "Failed to scrape URL"**
- Solution: Site may block automated requests
- Try: Different URL, or ask user to check robots.txt

**Issue: Low confidence in field detection**
- Solution: Custom HTML layout not recognized
- Try: Manual field mapping UI (Phase 2B)

**Issue: Photos not extracted**
- Solution: Images may be lazy-loaded or CDN-hosted
- Note: URLs are stored, not re-hosted (Phase 2B feature)

**Issue: Timeout errors**
- Solution: URL takes > 30 seconds to load
- Try: Increase timeout in scrapeAndExtract options

## Code Examples

### Basic Usage

```typescript
// Detect fields from URL
const result = await fetch("/api/inventory/detect", {
  method: "POST",
  body: JSON.stringify({ sourceUrl: "https://dealer.com/inventory" }),
});
const detection = await result.json();

// Import with detected mapping
const importResult = await fetch("/api/inventory/import", {
  method: "POST",
  body: JSON.stringify({
    sourceUrl: "https://dealer.com/inventory",
    sourceName: "Main Website",
    fieldMapping: detection.suggestedMapping,
  }),
});
const imported = await importResult.json();
console.log(`Imported ${imported.success} vehicles`);
```

### Custom Field Mapping

```typescript
const customMapping = {
  year: ".vehicle-year",
  make: ".vehicle-make",
  model: ".vehicle-model",
  price: ".price-tag",
  mileage: ".odometer",
};

const importResult = await fetch("/api/inventory/import", {
  method: "POST",
  body: JSON.stringify({
    sourceUrl: "https://dealer.com/inventory",
    sourceName: "Custom Mapping Test",
    fieldMapping: customMapping,
  }),
});
```

## Files Created/Modified

### Created

- `/supabase/migrations/add-inventory-sources-tables.sql` - Database schema
- `/lib/scraper.ts` - Web scraping engine
- `/lib/field-detector.ts` - Field detection heuristics
- `/lib/db/inventory.ts` - Database functions
- `/app/api/inventory/detect/route.ts` - Detection API
- `/app/api/inventory/import/route.ts` - Import API
- `/app/api/inventory/sources/route.ts` - Sources management API
- `/app/(dashboard)/dashboard/vehicles/import-from-url/page.tsx` - UI component
- `/docs/PHASE_2A_INVENTORY_AUTO_FETCH.md` - This file

### Modified

- `/app/(dashboard)/dashboard/vehicles/page.tsx` - Added "Import from URL" button

## Success Criteria

✅ Feature is complete when:
1. Users can enter a URL and get field detection
2. Users can preview and import vehicles
3. Imported vehicles appear in inventory
4. Error messages are clear and helpful
5. Database tracks sources and syncs
6. All TypeScript compiles without errors
7. Tests pass for various dealer website layouts
