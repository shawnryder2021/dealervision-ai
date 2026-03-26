import { NextResponse } from "next/server";

/**
 * Searches for a reference image of a specific vehicle to improve AI generation accuracy.
 * Uses Google Custom Search or falls back to constructing a known stock image URL pattern.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const trim = searchParams.get("trim");
    const color = searchParams.get("color");

    if (!make || !model) {
      return NextResponse.json(
        { error: "make and model are required" },
        { status: 400 }
      );
    }

    const query = [year, make, model, trim, color, "press photo official"]
      .filter(Boolean)
      .join(" ");

    // Try Google Image Search via SerpAPI or similar
    // For now, use a curated set of reliable automotive image sources
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:l,itp:photo`;

    // Use manufacturer press image patterns as fallback reference
    const referencePrompt = buildReferencePrompt(
      year || "",
      make,
      model,
      trim || "",
      color || ""
    );

    return NextResponse.json({
      query,
      referencePrompt,
      searchUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Builds a highly specific reference prompt to guide AI generation
 * toward the correct vehicle appearance.
 */
function buildReferencePrompt(
  year: string,
  make: string,
  model: string,
  trim: string,
  color: string
): string {
  const vehicle = [year, make, model, trim].filter(Boolean).join(" ");

  // Vehicle-specific design cues for popular makes
  const designCues = getDesignCues(make, model, year);

  const parts = [
    `Accurate depiction of a ${vehicle}`,
    color ? `in ${color} exterior color` : "",
    designCues ? `with ${designCues}` : "",
    `matching the exact real-world body style, proportions, and design details of the ${year || "current"} model year ${make} ${model}`,
    "Photorealistic, factory press photo quality",
  ];

  return parts.filter(Boolean).join(". ") + ".";
}

function getDesignCues(make: string, model: string, year: string): string {
  const key = `${make.toLowerCase()}-${model.toLowerCase()}`;
  const y = parseInt(year) || 2025;

  const cues: Record<string, string> = {
    // Volkswagen
    "volkswagen-taos": y >= 2025
      ? "redesigned front grille with horizontal light bar, updated LED headlights, wider stance, refreshed bumper design"
      : "compact crossover SUV body, VW emblem on grille, LED headlights, clean angular lines",
    "volkswagen-atlas": "three-row midsize SUV, bold VW grille, LED headlights, muscular fender arches",
    "volkswagen-jetta": "compact sedan, VW front grille, LED headlights, clean side profile",
    "volkswagen-tiguan": "compact SUV, VW grille, LED headlights, athletic proportions",
    "volkswagen-id.4": "electric SUV, closed-off grille, LED light strip, aerodynamic design, EV styling",
    "volkswagen-atlas cross sport": "coupe-style midsize SUV, sloping roofline, VW grille",
    "volkswagen-golf": "hatchback, iconic VW design, LED headlights, compact proportions",
    "volkswagen-golf gti": "hot hatch, honeycomb grille, red accents, dual exhaust, sporty bumper",
    // Toyota
    "toyota-camry": "midsize sedan, bold front grille, swept-back headlights, flowing side profile",
    "toyota-corolla": "compact sedan, sleek design, LED headlights, modern Toyota grille",
    "toyota-rav4": "compact SUV, angular design, two-tone roof option, rugged lower cladding",
    "toyota-highlander": "three-row midsize SUV, bold grille, floating roofline",
    "toyota-tacoma": "midsize pickup truck, bold front end, functional design",
    "toyota-tundra": "full-size pickup truck, wide grille, muscular stance",
    "toyota-4runner": "body-on-frame SUV, rugged design, off-road capability",
    // Honda
    "honda-civic": "compact sedan/hatchback, low hood, horizontal grille, clean lines",
    "honda-accord": "midsize sedan, fastback roofline, chrome grille accent",
    "honda-cr-v": "compact SUV, bold grille, upright stance, LED headlights",
    "honda-pilot": "three-row SUV, boxy design, rugged appearance",
    "honda-hr-v": "subcompact SUV, coupe-like roofline, LED lights",
    // Ford
    "ford-f-150": "full-size pickup, bold grille, C-clamp headlights, muscular body",
    "ford-mustang": "sports car, long hood, short deck, aggressive stance, tri-bar taillights",
    "ford-bronco": "off-road SUV, round headlights, removable top, retro-modern design",
    "ford-explorer": "three-row SUV, athletic design, LED headlights",
    "ford-escape": "compact SUV, sleek design, Ford grille",
    "ford-maverick": "compact pickup truck, unibody design, modern styling",
    // Chevrolet
    "chevrolet-silverado": "full-size pickup, bold front end, bowtie grille",
    "chevrolet-equinox": "compact SUV, split headlights, modern design",
    "chevrolet-traverse": "three-row SUV, wide grille, family proportions",
    "chevrolet-corvette": "mid-engine sports car, aggressive low stance, angular design",
    "chevrolet-tahoe": "full-size SUV, commanding presence, chrome accents",
    // BMW
    "bmw-3 series": "sport sedan, kidney grille, angel eye headlights, athlete proportions",
    "bmw-5 series": "executive sedan, large kidney grille, LED headlights, elegant lines",
    "bmw-x3": "compact luxury SUV, kidney grille, sporty stance",
    "bmw-x5": "midsize luxury SUV, bold kidney grille, commanding presence",
    // Mercedes-Benz
    "mercedes-benz-c-class": "luxury sedan, star emblem, sweeping lines, LED headlights",
    "mercedes-benz-e-class": "executive sedan, three-pointed star, elegant proportions",
    "mercedes-benz-gle": "midsize luxury SUV, bold grille, smooth styling",
    // Hyundai
    "hyundai-tucson": "compact SUV, parametric hidden lights, angular body panels",
    "hyundai-santa fe": "midsize SUV, H-shaped DRLs, boxy modern design",
    "hyundai-elantra": "compact sedan, parametric jewel grille, angular design",
    "hyundai-palisade": "three-row SUV, cascading grille, premium design",
    // Kia
    "kia-telluride": "three-row SUV, tiger nose grille, boxy premium design",
    "kia-sportage": "compact SUV, boomerang DRLs, bold two-tone design",
    "kia-forte": "compact sedan, tiger nose grille, sporty lines",
    // Nissan
    "nissan-rogue": "compact SUV, V-motion grille, floating roofline",
    "nissan-altima": "midsize sedan, V-motion grille, sporty profile",
    "nissan-pathfinder": "three-row SUV, V-motion grille, rugged design",
    // Subaru
    "subaru-outback": "lifted wagon/SUV, rugged cladding, symmetrical AWD stance",
    "subaru-forester": "compact SUV, boxy design, practical proportions",
    "subaru-crosstrek": "subcompact SUV, raised ride height, rugged styling",
    // Jeep
    "jeep-wrangler": "iconic off-road SUV, seven-slot grille, round headlights, removable doors/top",
    "jeep-grand cherokee": "midsize luxury SUV, seven-slot grille, premium design",
    "jeep-compass": "compact SUV, seven-slot grille, modern styling",
    // Tesla
    "tesla-model 3": "electric sedan, no grille, minimalist design, glass roof",
    "tesla-model y": "electric SUV, no grille, crossover proportions, glass roof",
    "tesla-model s": "electric luxury sedan, sleek design, no grille",
    "tesla-model x": "electric luxury SUV, falcon wing doors, no grille",
    // Ram
    "ram-1500": "full-size pickup, split headlights, bold RAM lettering grille",
    // GMC
    "gmc-sierra": "full-size pickup, bold GMC grille, premium design",
    "gmc-yukon": "full-size SUV, bold GMC grille, commanding presence",
    // Audi
    "audi-a4": "luxury sedan, singleframe grille, LED headlights, quattro badge",
    "audi-q5": "luxury compact SUV, singleframe grille, LED matrix headlights",
    // Lexus
    "lexus-rx": "luxury midsize SUV, spindle grille, L-shaped DRLs",
    "lexus-es": "luxury sedan, spindle grille, elegant design",
  };

  return cues[key] || "";
}
