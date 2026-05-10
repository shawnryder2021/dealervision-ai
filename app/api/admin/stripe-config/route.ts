/**
 * Admin Stripe Configuration API
 * Manages Stripe API credentials and webhook configuration
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isSuperAdmin,
  getStripeConfig,
  updateStripeConfig,
  recordStripeTest,
} from "@/lib/db/admin";
import Stripe from "stripe";

// GET - Retrieve current Stripe configuration (masked)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const config = await getStripeConfig();

    if (!config) {
      return NextResponse.json({
        config: null,
        message: "No Stripe configuration found",
      });
    }

    // Mask the webhook secret for display; has_secret_key already computed in getStripeConfig
    const maskedConfig = {
      ...config,
      webhook_secret:
        config.webhook_secret.length > 15
          ? config.webhook_secret.substring(0, 10) +
            "..." +
            config.webhook_secret.substring(config.webhook_secret.length - 5)
          : config.webhook_secret,
    };

    return NextResponse.json({ config: maskedConfig });
  } catch (error) {
    console.error("Error fetching Stripe config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update Stripe configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { secret_key, publishable_key, webhook_secret, test_mode, action } =
      body;

    // If action is "test", test the connection
    if (action === "test") {
      try {
        const stripe = new Stripe(secret_key, {
          apiVersion: "2025-02-24.acacia",
        });

        // Verify the API key works by fetching account info
        const account = await stripe.accounts.retrieve();

        // Record successful test
        await recordStripeTest("success", "Connection verified");

        return NextResponse.json({
          success: true,
          message: "Stripe connection verified",
          account_id: account.id,
        });
      } catch (testError) {
        const message =
          testError instanceof Error ? testError.message : "Unknown error";
        await recordStripeTest("failed", message);

        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 400 }
        );
      }
    }

    // Otherwise, update the configuration.
    // Only include secret_key if the caller actually provided a non-empty value —
    // otherwise the existing stored key is preserved.
    const config = await updateStripeConfig(
      {
        ...(secret_key ? { secret_key } : {}),
        publishable_key,
        webhook_secret,
        test_mode: test_mode ?? true,
      },
      user.email
    );

    if (!config) {
      return NextResponse.json(
        { error: "Failed to update configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stripe configuration updated",
    });
  } catch (error) {
    console.error("Error updating Stripe config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
