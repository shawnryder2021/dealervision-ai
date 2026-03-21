import { NextResponse } from "next/server";
import { decodeVIN } from "@/lib/vin-decoder";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");

  if (!vin) {
    return NextResponse.json({ error: "VIN is required" }, { status: 400 });
  }

  try {
    const decoded = await decodeVIN(vin);
    return NextResponse.json(decoded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "VIN decode failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
