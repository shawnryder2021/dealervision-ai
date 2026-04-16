/**
 * Inventory Sources List API Endpoint
 * GET /api/inventory/sources - List all sources for dealership
 * DELETE /api/inventory/sources/[sourceId] - Delete a source
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getInventorySources,
  deleteInventorySource,
} from "@/lib/db/inventory";

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Get all sources
    const sources = await getInventorySources(dealershipId);

    return NextResponse.json({
      sources: sources.map((s) => ({
        id: s.id,
        sourceName: s.source_name,
        sourceUrl: s.source_url,
        sourceType: s.source_type,
        lastSyncAt: s.last_sync_at,
        lastSyncStatus: s.last_sync_status,
        vehicleCount: s.vehicles_imported_count,
        autoSyncEnabled: s.auto_sync_enabled,
        syncFrequency: s.sync_frequency,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error("List sources error:", error);
    return NextResponse.json(
      { error: "Failed to list sources" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

    // Get source ID from URL
    const url = new URL(request.url);
    const sourceId = url.searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Delete source
    await deleteInventorySource(sourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete source error:", error);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
