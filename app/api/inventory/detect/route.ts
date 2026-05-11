/**
 * Field Detection API Endpoint
 * POST /api/inventory/detect
 * Analyzes a URL and detects vehicle fields
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAndExtract, scrapeViaSitemap } from "@/lib/scraper";
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

    // Scrape and extract — try HTML first (short timeout), then sitemap fallback.
    // Many modern dealer sites serve an HTML shell with no vehicle data — fail
    // fast so we reach the sitemap strategy without burning the full 30 s.
    let result = await scrapeAndExtract(sourceUrl, dealershipId, fieldMapping, {
      timeout: 8000,
    });

    if (!result) {
      // Fallback: many modern dealer sites (SM360, CDK, Dealer.com) render inventory
      // via JavaScript. Their sitemap contains individual vehicle URLs we can parse.
      result = await scrapeViaSitemap(sourceUrl, dealershipId, {
        fetchDetails: "sample", // fetch 5 detail pages for a rich preview (price/mileage/VIN)
      });
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to read inventory from this page. The site may render inventory via JavaScript. Try importing via CSV instead, or contact support.",
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
