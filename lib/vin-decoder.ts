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

  const decoded: DecodedVehicle = {
    vin: cleanVin,
    year: results["Model Year"] ? parseInt(results["Model Year"], 10) : null,
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
