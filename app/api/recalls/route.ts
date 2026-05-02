import { NextResponse, type NextRequest } from "next/server";

// NHTSA Recalls API (free, no auth)
// Docs: https://api.nhtsa.gov/

interface NhtsaRecall {
  NHTSACampaignNumber?: string;
  Manufacturer?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  Notes?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get("vin");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");

    let url: string;
    if (vin) {
      url = `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`;
    } else if (make && model && year) {
      url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(
        make
      )}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
    } else {
      return NextResponse.json(
        { error: "Provide either ?vin=… or ?make=&model=&year=" },
        { status: 400 }
      );
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `NHTSA API error: ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    const results: NhtsaRecall[] = Array.isArray(data?.results) ? data.results : [];
    return NextResponse.json({
      count: results.length,
      recalls: results.map((r) => ({
        campaignNumber: r.NHTSACampaignNumber,
        manufacturer: r.Manufacturer,
        reportReceivedDate: r.ReportReceivedDate,
        component: r.Component,
        summary: r.Summary,
        consequence: r.Consequence,
        remedy: r.Remedy,
        notes: r.Notes,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
