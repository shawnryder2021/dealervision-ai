/**
 * Inventory Database Functions
 * Handles CRUD operations for inventory sources and sync tracking
 */

import { createClient } from "@/lib/supabase/client";
import { FieldMapping } from "@/lib/field-detector";

export type InventorySource = any;
export type InventorySyncLog = any;
export type VehicleImportRecord = any;

/**
 * Get all inventory sources for a dealership
 */
export async function getInventorySources(
  dealershipId: string
): Promise<InventorySource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_sources")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a specific inventory source
 */
export async function getInventorySource(
  sourceId: string
): Promise<InventorySource | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Create a new inventory source
 */
export async function createInventorySource(
  dealershipId: string,
  sourceUrl: string,
  sourceName: string,
  fieldMapping?: FieldMapping,
  sourceType = "generic_scrape"
): Promise<InventorySource> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_sources")
    .insert({
      dealership_id: dealershipId,
      source_url: sourceUrl,
      source_name: sourceName,
      source_type: sourceType,
      field_mapping: fieldMapping || {},
      auto_sync_enabled: false,
      sync_frequency: "weekly",
      sync_time: "02:00:00",
    })
    .select()
    .single();

  if (error) throw error;
  return data as InventorySource;
}

/**
 * Update inventory source metadata
 */
export async function updateInventorySource(
  sourceId: string,
  updates: {
    sourceName?: string;
    sourceUrl?: string;
    fieldMapping?: FieldMapping;
    autoSyncEnabled?: boolean;
    syncFrequency?: string;
    syncTime?: string;
  }
): Promise<InventorySource> {
  const supabase = createClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.sourceName !== undefined) {
    updateData.source_name = updates.sourceName;
  }
  if (updates.sourceUrl !== undefined) {
    updateData.source_url = updates.sourceUrl;
  }
  if (updates.fieldMapping !== undefined) {
    updateData.field_mapping = updates.fieldMapping;
  }
  if (updates.autoSyncEnabled !== undefined) {
    updateData.auto_sync_enabled = updates.autoSyncEnabled;
  }
  if (updates.syncFrequency !== undefined) {
    updateData.sync_frequency = updates.syncFrequency;
  }
  if (updates.syncTime !== undefined) {
    updateData.sync_time = updates.syncTime;
  }

  const { data, error } = await supabase
    .from("inventory_sources")
    .update(updateData)
    .eq("id", sourceId)
    .select()
    .single();

  if (error) throw error;
  return data as InventorySource;
}

/**
 * Update sync status for a source
 */
export async function updateSourceSyncStatus(
  sourceId: string,
  status: "success" | "partial" | "failed" | "pending",
  vehicleCount: number,
  errorMessage?: string
): Promise<InventorySource> {
  const supabase = createClient();

  const updateData: Record<string, any> = {
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
    vehicles_imported_count: vehicleCount,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage) {
    updateData.last_error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from("inventory_sources")
    .update(updateData)
    .eq("id", sourceId)
    .select()
    .single();

  if (error) throw error;
  return data as InventorySource;
}

/**
 * Delete an inventory source
 */
export async function deleteInventorySource(sourceId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("inventory_sources")
    .delete()
    .eq("id", sourceId);

  if (error) throw error;
}

/**
 * Create a sync log entry
 */
export async function createSyncLog(
  sourceId: string,
  dealershipId: string,
  syncType: "manual" | "scheduled",
  status: "running" | "success" | "partial" | "failed"
): Promise<InventorySyncLog> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_sync_logs")
    .insert({
      source_id: sourceId,
      dealership_id: dealershipId,
      sync_type: syncType,
      status,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as InventorySyncLog;
}

/**
 * Update sync log with results
 */
export async function updateSyncLog(
  logId: string,
  updates: {
    status: "running" | "success" | "partial" | "failed";
    totalFound?: number;
    newAdded?: number;
    updated?: number;
    removed?: number;
    errors?: Array<{ message: string; row?: number }>;
  }
): Promise<InventorySyncLog> {
  const supabase = createClient();

  const updateData: Record<string, any> = {
    status: updates.status,
    completed_at: new Date().toISOString(),
  };

  if (updates.totalFound !== undefined) {
    updateData.total_found = updates.totalFound;
  }
  if (updates.newAdded !== undefined) {
    updateData.new_added = updates.newAdded;
  }
  if (updates.updated !== undefined) {
    updateData.updated = updates.updated;
  }
  if (updates.removed !== undefined) {
    updateData.removed = updates.removed;
  }
  if (updates.errors) {
    updateData.errors = updates.errors;
  }

  const { data, error } = await supabase
    .from("inventory_sync_logs")
    .update(updateData)
    .eq("id", logId)
    .select()
    .single();

  if (error) throw error;
  return data as InventorySyncLog;
}

/**
 * Get sync logs for a source
 */
export async function getSyncLogs(
  sourceId: string,
  limit = 20
): Promise<InventorySyncLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_sync_logs")
    .select("*")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Create or update vehicle import record
 */
export async function createVehicleImportRecord(
  vehicleId: string,
  sourceId: string,
  dealershipId: string,
  externalId: string,
  originalData: Record<string, any>
): Promise<VehicleImportRecord> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicle_import_records")
    .upsert(
      {
        vehicle_id: vehicleId,
        source_id: sourceId,
        dealership_id: dealershipId,
        external_id: externalId,
        original_data: originalData,
        imported_at: new Date().toISOString(),
      },
      {
        onConflict: "source_id,external_id",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data as VehicleImportRecord;
}

/**
 * Get import record for a vehicle and source
 */
export async function getImportRecord(
  sourceId: string,
  externalId: string
): Promise<VehicleImportRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicle_import_records")
    .select("*")
    .eq("source_id", sourceId)
    .eq("external_id", externalId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Get all import records for a source
 */
export async function getImportRecordsForSource(
  sourceId: string
): Promise<VehicleImportRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicle_import_records")
    .select("*")
    .eq("source_id", sourceId);

  if (error) throw error;
  return data || [];
}

/**
 * Delete import records for source (cleanup before re-sync)
 */
export async function deleteImportRecordsForSource(
  sourceId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("vehicle_import_records")
    .delete()
    .eq("source_id", sourceId);

  if (error) throw error;
}
