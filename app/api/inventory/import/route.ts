/**
 * Inventory Import API Endpoint
 * POST /api/inventory/import
 * Imports detected vehicles from a URL source
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAndExtract, normalizeVehicle } from "@/lib/scraper";
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
      // Scrape and extract
      const scrapeResult = await scrapeAndExtract(
        sourceUrl,
        dealershipId,
        fieldMapping || sourceData.field_mapping,
        { timeout: 30000 }
      );

      if (!scrapeResult) {
        throw new Error("Failed to scrape URL");
      }

      const vehicles = scrapeResult.vehicles;
      const errors: Array<{ row: number; error: string }> = [];

      // Process each vehicle
      for (let i = 0; i < vehicles.length; i++) {
        try {
          const vehicle = vehicles[i];

          // Validate required fields
          if (!vehicle.make || !vehicle.model) {
            errors.push({
              error: `Make and Model are required`,
              row: i + 1,
            });
            result.failed++;
            continue;
          }

          // Generate external ID (VIN > stock number > combination)
          const externalId =
            vehicle.vin || vehicle.stock_number || `${vehicle.make}-${vehicle.model}-${i}`;

          // Check if this vehicle already exists from this source
          const importRecord = await getImportRecord(sourceData.id, externalId);

          // Insert or update vehicle
          const vehicleData = {
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

          if (importRecord) {
            // Update existing vehicle
            const { error: updateError } = await supabase
              .from("vehicles")
              .update(vehicleData)
              .eq("id", importRecord.vehicle_id)
              .select()
              .single();

            if (updateError) {
              throw new Error(updateError.message);
            }

            result.success++;
            result.importedIds.push(importRecord.vehicle_id);
          } else {
            // Create new vehicle
            const { data: insertedVehicle, error: insertError } = await supabase
              .from("vehicles")
              .insert(vehicleData)
              .select()
              .single();

            if (insertError) {
              throw new Error(insertError.message);
            }

            if (insertedVehicle) {
              result.importedIds.push(insertedVehicle.id);
              result.success++;

              // Create import record
              await createVehicleImportRecord(
                insertedVehicle.id,
                sourceData.id,
                dealershipId,
                externalId,
                vehicle.raw || {}
              );
            }
          }
        } catch (err) {
          result.failed++;
          errors.push({
            error: err instanceof Error ? err.message : "Unknown error",
            row: i + 1,
          });
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
