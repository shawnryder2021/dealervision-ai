import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Vehicle } from "@/lib/types";

interface ImportRow {
  year?: string | number;
  make?: string;
  model?: string;
  trim?: string;
  price?: string | number;
  mileage?: string | number;
  vin?: string;
  stock_number?: string;
  status?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  importedIds: string[];
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { vehicles: vehicleRows } = body;

    if (!Array.isArray(vehicleRows) || vehicleRows.length === 0) {
      return NextResponse.json(
        { error: "No vehicles provided" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      importedIds: [],
    };

    // Process each vehicle
    for (let i = 0; i < vehicleRows.length; i++) {
      const row = vehicleRows[i] as ImportRow;

      try {
        // Validate required fields
        if (!row.make || !row.model) {
          throw new Error("Make and Model are required");
        }

        // Build vehicle object
        const vehicleData = {
          dealership_id: dealershipId,
          year: row.year ? parseInt(String(row.year)) : null,
          make: String(row.make).trim(),
          model: String(row.model).trim(),
          trim: row.trim ? String(row.trim).trim() : null,
          price: row.price ? parseFloat(String(row.price)) : null,
          mileage: row.mileage ? parseInt(String(row.mileage)) : null,
          vin: row.vin ? String(row.vin).trim().toUpperCase() : null,
          stock_number: row.stock_number ? String(row.stock_number).trim() : null,
          status: (["available", "sold", "coming_soon", "featured"].includes(
            String(row.status)
          )
            ? row.status
            : "available") as Vehicle["status"],
          photos: [] as string[],
          tags: [] as string[],
          details: {} as Record<string, unknown>,
        };

        // Insert vehicle
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
        }
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Log the import
    await supabase.from("usage_logs").insert({
      dealership_id: dealershipId,
      action: "vehicle_import",
      credits_used: 0,
      metadata: {
        total: vehicleRows.length,
        success: result.success,
        failed: result.failed,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
