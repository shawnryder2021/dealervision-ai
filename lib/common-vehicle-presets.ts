/**
 * Common vehicle presets shown in the vehicle selector when a dealership
 * has no real inventory loaded yet. Lets users generate marketing visuals
 * for popular models without needing to import inventory first.
 *
 * Each preset gets a synthetic id of the form "preset:<slug>" so the
 * create flow can detect it and pass inline vehicle data instead of
 * a real vehicle_id (which would 404 against the DB).
 */

export interface CommonVehiclePreset {
  id: string; // "preset:2026-toyota-camry-se"
  year: number;
  make: string;
  model: string;
  trim?: string;
  segment: "Sedan" | "SUV" | "Truck" | "EV" | "Sports" | "Luxury";
}

// Bias toward 2024–2026 model years so visuals feel current.
// Mix of segments and brands so any dealership can find something close.
export const COMMON_VEHICLE_PRESETS: CommonVehiclePreset[] = [
  // Sedans
  { id: "preset:2026-toyota-camry-se", year: 2026, make: "Toyota", model: "Camry", trim: "SE", segment: "Sedan" },
  { id: "preset:2026-honda-accord-sport", year: 2026, make: "Honda", model: "Accord", trim: "Sport", segment: "Sedan" },
  { id: "preset:2026-honda-civic-ex", year: 2026, make: "Honda", model: "Civic", trim: "EX", segment: "Sedan" },
  { id: "preset:2026-toyota-corolla-le", year: 2026, make: "Toyota", model: "Corolla", trim: "LE", segment: "Sedan" },
  { id: "preset:2025-hyundai-elantra-sel", year: 2025, make: "Hyundai", model: "Elantra", trim: "SEL", segment: "Sedan" },
  { id: "preset:2025-nissan-sentra-sv", year: 2025, make: "Nissan", model: "Sentra", trim: "SV", segment: "Sedan" },
  { id: "preset:2026-volkswagen-jetta-se", year: 2026, make: "Volkswagen", model: "Jetta", trim: "SE", segment: "Sedan" },

  // SUVs / Crossovers
  { id: "preset:2026-toyota-rav4-xle", year: 2026, make: "Toyota", model: "RAV4", trim: "XLE", segment: "SUV" },
  { id: "preset:2026-honda-cr-v-ex-l", year: 2026, make: "Honda", model: "CR-V", trim: "EX-L", segment: "SUV" },
  { id: "preset:2026-toyota-highlander-xle", year: 2026, make: "Toyota", model: "Highlander", trim: "XLE", segment: "SUV" },
  { id: "preset:2026-honda-pilot-touring", year: 2026, make: "Honda", model: "Pilot", trim: "Touring", segment: "SUV" },
  { id: "preset:2026-mazda-cx-5-preferred", year: 2026, make: "Mazda", model: "CX-5", trim: "Preferred", segment: "SUV" },
  { id: "preset:2026-hyundai-tucson-sel", year: 2026, make: "Hyundai", model: "Tucson", trim: "SEL", segment: "SUV" },
  { id: "preset:2026-kia-sportage-lx", year: 2026, make: "Kia", model: "Sportage", trim: "LX", segment: "SUV" },
  { id: "preset:2026-kia-telluride-ex", year: 2026, make: "Kia", model: "Telluride", trim: "EX", segment: "SUV" },
  { id: "preset:2026-hyundai-santa-fe-limited", year: 2026, make: "Hyundai", model: "Santa Fe", trim: "Limited", segment: "SUV" },
  { id: "preset:2026-subaru-outback-premium", year: 2026, make: "Subaru", model: "Outback", trim: "Premium", segment: "SUV" },
  { id: "preset:2026-jeep-grand-cherokee-limited", year: 2026, make: "Jeep", model: "Grand Cherokee", trim: "Limited", segment: "SUV" },
  { id: "preset:2026-ford-explorer-xlt", year: 2026, make: "Ford", model: "Explorer", trim: "XLT", segment: "SUV" },
  { id: "preset:2026-chevrolet-equinox-lt", year: 2026, make: "Chevrolet", model: "Equinox", trim: "LT", segment: "SUV" },
  { id: "preset:2026-volkswagen-tiguan-se", year: 2026, make: "Volkswagen", model: "Tiguan", trim: "SE", segment: "SUV" },
  { id: "preset:2026-volkswagen-atlas-se", year: 2026, make: "Volkswagen", model: "Atlas", trim: "SE", segment: "SUV" },
  { id: "preset:2026-nissan-rogue-sv", year: 2026, make: "Nissan", model: "Rogue", trim: "SV", segment: "SUV" },

  // Trucks
  { id: "preset:2026-ford-f-150-xlt", year: 2026, make: "Ford", model: "F-150", trim: "XLT", segment: "Truck" },
  { id: "preset:2026-chevrolet-silverado-1500-lt", year: 2026, make: "Chevrolet", model: "Silverado 1500", trim: "LT", segment: "Truck" },
  { id: "preset:2026-ram-1500-big-horn", year: 2026, make: "Ram", model: "1500", trim: "Big Horn", segment: "Truck" },
  { id: "preset:2026-toyota-tacoma-trd-sport", year: 2026, make: "Toyota", model: "Tacoma", trim: "TRD Sport", segment: "Truck" },
  { id: "preset:2026-toyota-tundra-sr5", year: 2026, make: "Toyota", model: "Tundra", trim: "SR5", segment: "Truck" },
  { id: "preset:2026-gmc-sierra-1500-elevation", year: 2026, make: "GMC", model: "Sierra 1500", trim: "Elevation", segment: "Truck" },

  // EVs
  { id: "preset:2026-tesla-model-3-long-range", year: 2026, make: "Tesla", model: "Model 3", trim: "Long Range", segment: "EV" },
  { id: "preset:2026-tesla-model-y-long-range", year: 2026, make: "Tesla", model: "Model Y", trim: "Long Range", segment: "EV" },
  { id: "preset:2026-ford-mustang-mach-e-premium", year: 2026, make: "Ford", model: "Mustang Mach-E", trim: "Premium", segment: "EV" },
  { id: "preset:2026-hyundai-ioniq-5-sel", year: 2026, make: "Hyundai", model: "Ioniq 5", trim: "SEL", segment: "EV" },
  { id: "preset:2026-volkswagen-id4-pro", year: 2026, make: "Volkswagen", model: "ID.4", trim: "Pro", segment: "EV" },
  { id: "preset:2026-chevrolet-equinox-ev-lt", year: 2026, make: "Chevrolet", model: "Equinox EV", trim: "LT", segment: "EV" },

  // Sports / Performance
  { id: "preset:2026-ford-mustang-gt", year: 2026, make: "Ford", model: "Mustang", trim: "GT", segment: "Sports" },
  { id: "preset:2026-chevrolet-corvette-stingray", year: 2026, make: "Chevrolet", model: "Corvette", trim: "Stingray", segment: "Sports" },
  { id: "preset:2026-honda-civic-type-r", year: 2026, make: "Honda", model: "Civic", trim: "Type R", segment: "Sports" },
  { id: "preset:2026-volkswagen-golf-gti", year: 2026, make: "Volkswagen", model: "Golf GTI", trim: "S", segment: "Sports" },
  { id: "preset:2026-toyota-gr86", year: 2026, make: "Toyota", model: "GR86", trim: "Premium", segment: "Sports" },

  // Luxury
  { id: "preset:2026-bmw-3-series-330i", year: 2026, make: "BMW", model: "3 Series", trim: "330i", segment: "Luxury" },
  { id: "preset:2026-bmw-x5-xdrive40i", year: 2026, make: "BMW", model: "X5", trim: "xDrive40i", segment: "Luxury" },
  { id: "preset:2026-mercedes-c-class-c300", year: 2026, make: "Mercedes-Benz", model: "C-Class", trim: "C 300", segment: "Luxury" },
  { id: "preset:2026-mercedes-gle-450", year: 2026, make: "Mercedes-Benz", model: "GLE", trim: "450", segment: "Luxury" },
  { id: "preset:2026-audi-q5-premium-plus", year: 2026, make: "Audi", model: "Q5", trim: "Premium Plus", segment: "Luxury" },
  { id: "preset:2026-lexus-rx-350-premium", year: 2026, make: "Lexus", model: "RX", trim: "350 Premium", segment: "Luxury" },
];

export const PRESET_SEGMENTS = ["Sedan", "SUV", "Truck", "EV", "Sports", "Luxury"] as const;

export function isPresetId(id: string | undefined): boolean {
  return !!id && id.startsWith("preset:");
}

export function getPresetById(id: string): CommonVehiclePreset | undefined {
  return COMMON_VEHICLE_PRESETS.find((p) => p.id === id);
}
