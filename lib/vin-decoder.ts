export interface DecodedVehicle {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  body_class: string | null;
  drive_type: string | null;
  engine: string | null;
  fuel_type: string | null;
  transmission: string | null;
  doors: number | null;
  plant_city: string | null;
  plant_country: string | null;
}

interface NHTSAResult {
  Variable: string;
  Value: string | null;
}

const VARIABLE_MAP: Record<string, keyof DecodedVehicle> = {
  "Model Year": "year",
  "Make": "make",
  "Model": "model",
  "Trim": "trim",
  "Body Class": "body_class",
  "Drive Type": "drive_type",
  "Fuel Type - Primary": "fuel_type",
  "Transmission Style": "transmission",
  "Doors": "doors",
  "Plant City": "plant_city",
  "Plant Country": "plant_country",
};

/**
 * Decode the model year from VIN position 10 (standard ISO 3779).
 * NHTSA sometimes omits this field, so we derive it as a fallback.
 */
export function decodeYearFromVin(vin: string): number | null {
  const char = vin[9]?.toUpperCase(); // position 10 is index 9
  if (!char) return null;

  // Model year encoding per SAE J17/ISO 3779
  // Letters skip I, O, Q, U, Z
  const table: Record<string, number[]> = {
    A: [1980, 2010], B: [1981, 2011], C: [1982, 2012], D: [1983, 2013],
    E: [1984, 2014], F: [1985, 2015], G: [1986, 2016], H: [1987, 2017],
    J: [1988, 2018], K: [1989, 2019], L: [1990, 2020], M: [1991, 2021],
    N: [1992, 2022], P: [1993, 2023], R: [1994, 2024], S: [1995, 2025],
    T: [1996, 2026], V: [1997, 2027], W: [1998, 2028], X: [1999, 2029],
    Y: [2000, 2030],
    "1": [2001], "2": [2002], "3": [2003], "4": [2004], "5": [2005],
    "6": [2006], "7": [2007], "8": [2008], "9": [2009],
  };

  const options = table[char];
  if (!options) return null;
  if (options.length === 1) return options[0];

  // Pick the most plausible year: prefer years ≤ current year + 1
  const currentYear = new Date().getFullYear();
  return options.filter((y) => y <= currentYear + 1).at(-1) ?? options[0];
}

/**
 * Decode a VIN using the free NHTSA Vehicle API.
 */
export async function decodeVIN(vin: string): Promise<DecodedVehicle> {
  const cleanVin = vin.trim().toUpperCase();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    throw new Error("Invalid VIN format. A VIN must be exactly 17 characters (letters and numbers, excluding I, O, Q).");
  }

  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanVin}?format=json`
  );

  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status}`);
  }

  const json = await response.json();
  const results: Record<string, string> = json.Results?.[0] || {};

  // Build engine description from components
  const engineParts = [
    results["Displacement (L)"] ? `${results["Displacement (L)"]}L` : null,
    results["Engine Number of Cylinders"] ? `${results["Engine Number of Cylinders"]}-cyl` : null,
    results["Engine Model"] || null,
  ].filter(Boolean);

  // Year: prefer NHTSA value, fall back to VIN position 10 calculation
  const nthsaYear = results["Model Year"] ? parseInt(results["Model Year"], 10) : null;
  const year = nthsaYear || decodeYearFromVin(cleanVin);

  const decoded: DecodedVehicle = {
    vin: cleanVin,
    year,
    make: results["Make"] || null,
    model: results["Model"] || null,
    trim: results["Trim"] || null,
    body_class: results["Body Class"] || null,
    drive_type: results["Drive Type"] || null,
    engine: engineParts.length > 0 ? engineParts.join(" ") : null,
    fuel_type: results["Fuel Type - Primary"] || null,
    transmission: results["Transmission Style"] || null,
    doors: results["Doors"] ? parseInt(results["Doors"], 10) : null,
    plant_city: results["Plant City"] || null,
    plant_country: results["Plant Country"] || null,
  };

  if (!decoded.make && !decoded.model) {
    throw new Error("Could not decode VIN. Please check the number and try again.");
  }

  return decoded;
}
