import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/db/coupons";

// Simple in-memory rate limiting (for demonstration)
// In production, use Redis or database-backed rate limiting
const validationAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = validationAttempts.get(ip);

  if (!record || now > record.resetTime) {
    validationAttempts.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (record.count >= 10) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many validation attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { code, plan } = await request.json();

    // Validate input
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (code.length > 50) {
      return NextResponse.json(
        { error: "Coupon code is too long" },
        { status: 400 }
      );
    }

    // Validate coupon
    const result = await validateCoupon(code.trim(), plan);

    return NextResponse.json({
      valid: result.valid,
      coupon: result.coupon,
      discount_amount: result.discount_amount,
      discount_percent: result.discount_percent,
      error: result.error,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
