/**
 * Simple vehicle picker options — a flat list of common makes and, for the
 * mainstream brands, their popular model names. Used by the create flow's
 * Year / Make / Model dropdowns so a dealership can generate visuals for any
 * vehicle without first importing inventory.
 *
 * Makes that aren't in MODELS_BY_MAKE simply get a free-text model field.
 */

export const VEHICLE_MAKES: string[] = [
  "Acura",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Acura: ["ILX", "Integra", "TLX", "RDX", "MDX", "ZDX"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "Q3", "Q5", "Q7", "Q8", "e-tron", "Q4 e-tron"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX"],
  Buick: ["Encore", "Encore GX", "Envision", "Enclave", "Envista"],
  Cadillac: ["CT4", "CT5", "XT4", "XT5", "XT6", "Escalade", "LYRIQ"],
  Chevrolet: [
    "Spark", "Malibu", "Trax", "Trailblazer", "Equinox", "Equinox EV", "Blazer", "Blazer EV",
    "Traverse", "Tahoe", "Suburban", "Colorado", "Silverado 1500", "Silverado 2500HD", "Camaro", "Corvette", "Bolt EUV",
  ],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Dodge: ["Charger", "Challenger", "Durango", "Hornet"],
  Fiat: ["500X", "500e"],
  Ford: [
    "Fiesta", "Focus", "Fusion", "Mustang", "Mustang Mach-E", "EcoSport", "Escape", "Bronco Sport", "Bronco",
    "Edge", "Explorer", "Expedition", "Ranger", "F-150", "F-150 Lightning", "F-250", "Maverick", "Transit",
  ],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  GMC: ["Terrain", "Acadia", "Yukon", "Yukon XL", "Canyon", "Sierra 1500", "Sierra 2500HD", "Hummer EV"],
  Honda: ["Civic", "Accord", "Insight", "HR-V", "CR-V", "Passport", "Pilot", "Ridgeline", "Odyssey", "Prologue"],
  Hyundai: [
    "Accent", "Elantra", "Sonata", "Venue", "Kona", "Kona Electric", "Tucson", "Santa Fe", "Santa Cruz",
    "Palisade", "Ioniq 5", "Ioniq 6",
  ],
  Infiniti: ["Q50", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["XE", "XF", "E-PACE", "F-PACE", "I-PACE", "F-TYPE"],
  Jeep: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Grand Cherokee L", "Wrangler", "Gladiator", "Wagoneer", "Grand Wagoneer"],
  Kia: ["Rio", "Forte", "K5", "Soul", "Seltos", "Sportage", "Sorento", "Telluride", "Carnival", "Niro", "EV6", "EV9"],
  "Land Rover": ["Range Rover Evoque", "Range Rover Velar", "Range Rover Sport", "Range Rover", "Discovery Sport", "Discovery", "Defender"],
  Lexus: ["IS", "ES", "LS", "UX", "NX", "RX", "GX", "LX", "RZ"],
  Lincoln: ["Corsair", "Nautilus", "Aviator", "Navigator"],
  Mazda: ["Mazda3", "CX-30", "CX-5", "CX-50", "CX-70", "CX-90", "MX-5 Miata", "CX-9"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLB", "GLC", "GLE", "GLS", "EQB", "EQE", "EQS"],
  Mini: ["Cooper", "Cooper Clubman", "Countryman"],
  Mitsubishi: ["Mirage", "Outlander", "Outlander Sport", "Eclipse Cross"],
  Nissan: ["Versa", "Sentra", "Altima", "Maxima", "Kicks", "Rogue", "Murano", "Pathfinder", "Armada", "Frontier", "Titan", "Leaf", "Ariya", "Z"],
  Porsche: ["718 Cayman", "718 Boxster", "911", "Panamera", "Macan", "Cayenne", "Taycan"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Subaru: ["Impreza", "Legacy", "WRX", "Crosstrek", "Forester", "Outback", "Ascent", "BRZ", "Solterra"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Toyota: [
    "Corolla", "Camry", "Prius", "Crown", "GR86", "GR Corolla", "GR Supra", "Corolla Cross", "C-HR",
    "RAV4", "Venza", "Highlander", "Grand Highlander", "4Runner", "Sequoia", "Land Cruiser", "Tacoma", "Tundra",
    "Sienna", "bZ4X",
  ],
  Volkswagen: ["Jetta", "Golf GTI", "Golf R", "Arteon", "Taos", "Tiguan", "Atlas", "Atlas Cross Sport", "ID.4", "ID.Buzz"],
  Volvo: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40 Recharge", "EX30", "EX90"],
};
