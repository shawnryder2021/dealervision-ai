/**
 * Field Detection API Endpoint
 * POST /api/inventory/detect
 * Analyzes a URL and detects vehicle fields
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAndExtract } from "@/lib/scraper";
import {
  detectFields,
  validateMapping,
  DetectedField,
  FieldMapping,
} from "@/lib/field-detector";

interface DetectRequest {
  sourceUrl: string;
  fieldMapping?: FieldMapping;
}

interface DetectResponse {
  success: boolean;
  detectedFields?: DetectedField[];
  suggestedMapping?: FieldMapping;
  vehicles?: any[];
  preview?: {
    year?: number | null;
    make?: string;
    model?: string;
    trim?: string;
    price?: number | null;
  }[];
  confidence?: number;
  itemCount?: number;
  validationStatus?: {
    valid: boolean;
    missingRequired: string[];
    warnings: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<DetectResponse>> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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
        { success: false, error: "No dealership found" },
        { status: 400 }
      );
    }

    const dealershipId = profile.dealership_id;

    // Parse request
    const body = (await request.json()) as DetectRequest;
    const { sourceUrl, fieldMapping } = body;

    if (!sourceUrl) {
      return NextResponse.json(
        { success: false, error: "sourceUrl is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(sourceUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Scrape and extract
    const result = await scrapeAndExtract(
      sourceUrl,
      dealershipId,
      fieldMapping,
      {
        timeout: 30000,
      }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to scrape URL. The page may not contain inventory data or may be blocking automated access.",
        },
        { status: 400 }
      );
    }

    // Detect fields
    const detectionResult = detectFields(result.vehicles as any[]);

    // Validate mapping
    const validationStatus = validateMapping(detectionResult.suggestedMapping);

    // Generate preview (first 5 vehicles)
    const preview = (result.vehicles as any[])
      .slice(0, 5)
      .map((v) => ({
        year: v.year || null,
        make: v.make,
        model: v.model,
        trim: v.trim,
        price: v.price || null,
      }));

    // Log the detection
    await supabase.from("usage_logs").insert({
      dealership_id: dealershipId,
      action: "inventory_detect",
      credits_used: 0,
      metadata: {
        sourceUrl,
        itemCount: result.detectionInfo.itemCount,
        vehiclesDetected: result.vehicles.length,
        confidence: detectionResult.confidence,
      },
    });

    return NextResponse.json({
      success: true,
      detectedFields: detectionResult.detectedFields,
      suggestedMapping: detectionResult.suggestedMapping,
      vehicles: result.vehicles,
      preview,
      confidence: detectionResult.confidence,
      itemCount: result.detectionInfo.itemCount,
      validationStatus,
    });
  } catch (error) {
    console.error("Detection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Detection failed",
      },
      { status: 500 }
    );
  }
}
