/**
 * Inventory Import API Endpoint
 * POST /api/inventory/import
 * Imports detected vehicles from a URL source
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAndExtract, scrapeViaSitemap, normalizeVehicle } from "@/lib/scraper";
import {
  createInventorySource,
  updateSourceSyncStatus,
  createSyncLog,
  updateSyncLog,
  createVehicleImportRecord,
  getImportRecord,
} from "@/lib/db/inventory";
import { FieldMapping } from "@/lib/field-detector";

interface ImportRequest {
  sourceUrl: string;
  sourceName: string;
  fieldMapping?: FieldMapping;
  sourceId?: string; // If updating existing source
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  importedIds: string[];
  syncLogId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's dealership
    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "No dealership found" },
        { status: 400 }
      );
    }

    const dealershipId = profile.dealership_id;

    // Parse request
    const body = await request.json() as ImportRequest;
    const { sourceUrl, sourceName, fieldMapping, sourceId } = body;

    if (!sourceUrl || !sourceName) {
      return NextResponse.json(
        { error: "sourceUrl and sourceName are required" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      importedIds: [],
      syncLogId: "",
    };

    // Create or get inventory source
    let source;
    if (sourceId) {
      // Update existing source
      source = await supabase
        .from("inventory_sources")
        .select()
        .eq("id", sourceId)
        .single();

      if (!source.data) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 }
        );
      }
    } else {
      // Create new source
      const newSource = await createInventorySource(
        dealershipId,
        sourceUrl,
        sourceName,
        fieldMapping
      );
      source = { data: newSource };
    }

    const sourceData = source.data;

    // Create sync log
    const syncLog = await createSyncLog(
      sourceData.id,
      dealershipId,
      "manual",
      "running"
    );
    result.syncLogId = syncLog.id;

    try {
      // Scrape and extract — HTML first (fast fail), then sitemap fallback for
      // JS-rendered sites. Use short timeouts so we have time left for DB writes
      // within the serverless function limit (~10 s on Netlify).
      let scrapeResult = await scrapeAndExtract(
        sourceUrl,
        dealershipId,
        fieldMapping || sourceData.field_mapping,
        { timeout: 5000 }
      );

      if (!scrapeResult) {
        // Sitemap strategy: save URL-slug data immediately for every vehicle,
        // then opportunistically enrich with detail-page data within budget.
        // Keeping the budget tight (3 s) guarantees the function completes —
        // any vehicle whose detail page wasn't fetched still gets year/make/model
        // from its URL slug, and can be enriched later.
        scrapeResult = await scrapeViaSitemap(sourceUrl, dealershipId, {
          fetchDetails: "all",
          maxVehicles: 200,
          detailBudgetMs: 3000,
        });
      }

      if (!scrapeResult) {
        throw new Error("Failed to scrape URL. The site may render inventory via JavaScript — try the sitemap strategy or CSV import.");
      }

      const vehicles = scrapeResult.vehicles;
      const errors: Array<{ row: number; error: string }> = [];

      // Build the vehicle records (filtering invalid ones first)
      type VehicleRecord = {
        index: number;
        externalId: string;
        data: ReturnType<typeof buildVehicleData>;
        raw: Record<string, unknown>;
      };

      function buildVehicleData(vehicle: typeof vehicles[number]) {
        return {
          dealership_id: dealershipId,
          year: vehicle.year || null,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim || null,
          price: vehicle.price || null,
          mileage: vehicle.mileage || null,
          vin: vehicle.vin || null,
          stock_number: vehicle.stock_number || null,
          status: vehicle.status || "available",
          photos: vehicle.photos || [],
          tags: [] as string[],
          details: vehicle.raw || {},
        };
      }

      const records: VehicleRecord[] = [];
      vehicles.forEach((vehicle, i) => {
        if (!vehicle.make || !vehicle.model) {
          errors.push({ error: "Make and Model are required", row: i + 1 });
          result.failed++;
          return;
        }
        const externalId =
          vehicle.vin || vehicle.stock_number || `${vehicle.make}-${vehicle.model}-${i}`;
        records.push({
          index: i,
          externalId,
          data: buildVehicleData(vehicle),
          raw: vehicle.raw || {},
        });
      });

      // For new sources (the common case), skip the existing-record lookup —
      // there can't be any existing records to update. This saves ~95 parallel
      // DB queries (1-3s) on the critical path.
      const isResync = !!sourceId;
      const existingByExternalId = new Map<string, string>(); // externalId -> vehicle_id

      if (isResync) {
        const results = await Promise.all(
          records.map(async (r) => ({
            externalId: r.externalId,
            existing: await getImportRecord(sourceData.id, r.externalId),
          }))
        );
        for (const { externalId, existing } of results) {
          if (existing) existingByExternalId.set(externalId, existing.vehicle_id);
        }
      }

      // Split into updates (existing) and inserts (new)
      const toUpdate = records.filter((r) => existingByExternalId.has(r.externalId));
      const toInsert = records.filter((r) => !existingByExternalId.has(r.externalId));

      // BULK INSERT: one DB round-trip for all new vehicles, instead of 95.
      // This is the single biggest perf win.
      if (toInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from("vehicles")
          .insert(toInsert.map((r) => r.data))
          .select("id");

        if (insertError) {
          // If bulk insert fails, surface the error rather than partial state
          errors.push({ error: `Bulk insert failed: ${insertError.message}`, row: 0 });
          result.failed += toInsert.length;
        } else if (inserted) {
          // Map results back to records by order (Supabase preserves insert order)
          inserted.forEach((row, i) => {
            if (i < toInsert.length) {
              result.importedIds.push(row.id);
              result.success++;
              // Fire-and-forget import record creation (off the critical path)
              createVehicleImportRecord(
                row.id,
                sourceData.id,
                dealershipId,
                toInsert[i].externalId,
                toInsert[i].raw
              ).catch(() => { /* DB layer logs */ });
            }
          });
        }
      }

      // Updates: parallel batches of 20 (rare path — only for resyncs)
      if (toUpdate.length > 0) {
        const BATCH = 20;
        for (let i = 0; i < toUpdate.length; i += BATCH) {
          const batch = toUpdate.slice(i, i + BATCH);
          await Promise.all(
            batch.map(async (record) => {
              const vehicleId = existingByExternalId.get(record.externalId)!;
              try {
                const { error: updateError } = await supabase
                  .from("vehicles")
                  .update(record.data)
                  .eq("id", vehicleId);
                if (updateError) throw new Error(updateError.message);
                result.success++;
                result.importedIds.push(vehicleId);
              } catch (err) {
                result.failed++;
                errors.push({
                  error: err instanceof Error ? err.message : "Unknown error",
                  row: record.index + 1,
                });
              }
            })
          );
        }
      }

      // Update sync log with results
      await updateSyncLog(syncLog.id, {
        status: errors.length > 0 ? "partial" : "success",
        totalFound: vehicles.length,
        newAdded: result.success,
        updated: 0,
        errors: errors.length > 0 ? errors.map(e => ({ message: e.error, row: e.row })) : undefined,
      });

      // Update source status
      await updateSourceSyncStatus(
        sourceData.id,
        errors.length > 0 ? "partial" : "success",
        result.success
      );

      // Log the import
      await supabase.from("usage_logs").insert({
        dealership_id: dealershipId,
        action: "inventory_import",
        credits_used: 0,
        metadata: {
          sourceId: sourceData.id,
          sourceUrl,
          total: vehicles.length,
          success: result.success,
          failed: result.failed,
        },
      });

      result.errors = errors;
      return NextResponse.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Import failed";

      // Update sync log with error
      await updateSyncLog(syncLog.id, {
        status: "failed",
        errors: [{ message: errorMessage }],
      });

      // Update source status
      await updateSourceSyncStatus(sourceData.id, "failed", 0, errorMessage);

      throw error;
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
