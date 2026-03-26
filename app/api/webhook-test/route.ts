import { NextResponse } from "next/server";
import { fireWebhook } from "@/lib/webhook";
import type { Dealership } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { webhook_config, dealership_name } = await request.json();

    if (!webhook_config?.url) {
      return NextResponse.json(
        { error: "Webhook URL is required" },
        { status: 400 }
      );
    }

    // Build a minimal dealership object for the test
    const testDealership: Dealership = {
      id: "test",
      name: dealership_name || "Test Dealership",
      slug: "test",
      logo_url: null,
      tagline: null,
      brand_colors: { primary: "#003366", secondary: "#FFFFFF", accent: "#FF8C00" },
      contact: {
        phone: "(555) 123-4567",
        email: "test@dealership.com",
        website: "https://www.example.com",
        address: "123 Auto Mall Dr",
      },
      style_preferences: {},
      webhook_config: {
        ...webhook_config,
        enabled: true, // Force enabled for test
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const testPayload = {
      event: "test" as const,
      timestamp: new Date().toISOString(),
      image_url: "https://via.placeholder.com/1024x1024.png?text=DealerAdGen+Test",
      content_type: "vehicle-spotlight",
      channel: "instagram-post",
      aspect_ratio: "1:1",
      resolution: "1K",
      campaign: "Test Campaign",
      ...(webhook_config.include_prompt && {
        prompt: "This is a test webhook from DealerAdGen AI. If you received this, your webhook is configured correctly!",
      }),
      ...(webhook_config.include_vehicle && {
        vehicle: {
          year: 2025,
          make: "Volkswagen",
          model: "Atlas",
          trim: "SEL Premium",
          price: 42550,
          vin: "1VWSA7A37LC000001",
          stock_number: "A12345",
        },
      }),
      ...(webhook_config.include_dealership && {
        dealership: {
          name: dealership_name || "Test Dealership",
          phone: "(555) 123-4567",
          email: "test@dealership.com",
          website: "https://www.example.com",
          address: "123 Auto Mall Dr",
        },
      }),
      ...(webhook_config.include_user_email && {
        user_email: "user@dealership.com",
      }),
    };

    const result = await fireWebhook(testDealership, testPayload);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      error: result.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
