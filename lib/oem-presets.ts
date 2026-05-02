// OEM Co-op Compliance presets.
// When a dealership has `oem_brand` set, generated images include strict brand-guideline
// instructions designed to align with manufacturer co-op advertising programs.
// (Does not constitute pre-approval — dealers must still submit to OEM for reimbursement.)

export type OemBrandKey =
  | "ford"
  | "toyota"
  | "honda"
  | "chevrolet"
  | "gmc"
  | "ram"
  | "jeep"
  | "nissan"
  | "hyundai"
  | "kia"
  | "subaru"
  | "mazda"
  | "volkswagen"
  | "bmw"
  | "mercedes"
  | "audi"
  | "lexus"
  | "acura"
  | "cadillac"
  | "tesla";

export interface OemPreset {
  key: OemBrandKey;
  label: string;
  primaryColor: string;
  approvedFonts: string;
  logoRule: string;
  layoutRule: string;
  legalDisclaimer: string;
  toneRule: string;
}

export const OEM_PRESETS: Record<OemBrandKey, OemPreset> = {
  ford: {
    key: "ford",
    label: "Ford",
    primaryColor: "#003478",
    approvedFonts: "Ford F-1 / Antenna sans-serif family",
    logoRule:
      "Place the official Ford Blue Oval logo in the top-right corner with clear space equal to half the logo height on all sides. Logo must be the standard blue (#003478) on light backgrounds or white on dark.",
    layoutRule:
      "Bold, confident, modern layout. Large typography. White or Ford Blue dominant. No rainbow gradients, no neon. Vehicle is the hero — at least 50% of the visual weight.",
    legalDisclaimer:
      'Include a small legal line: "See dealer for details. Not all buyers will qualify. Offer subject to credit approval."',
    toneRule: "Tone: confident, capable, American-built. Avoid luxury/fashion language.",
  },
  toyota: {
    key: "toyota",
    label: "Toyota",
    primaryColor: "#EB0A1E",
    approvedFonts: "Toyota Type sans-serif (Helvetica Neue acceptable substitute)",
    logoRule:
      "Place the Toyota three-ellipse logo (red #EB0A1E or black) in the top-left or top-right with clear space equal to one full logo height. Never tilt, recolor, or distort.",
    layoutRule:
      "Clean, white-dominant background. Generous white space. Red used as accent only — never as full background. Large vehicle photo, minimal overlay graphics.",
    legalDisclaimer:
      'Include the standard Toyota disclaimer placeholder: "Subject to credit approval. See participating dealer for details. Toyota Financial Services."',
    toneRule: "Tone: dependable, family-oriented, value-focused. Never aggressive or boastful.",
  },
  honda: {
    key: "honda",
    label: "Honda",
    primaryColor: "#CC0000",
    approvedFonts: "Honda Sans (Helvetica Neue acceptable substitute)",
    logoRule:
      "Honda 'H' mark in red (#CC0000) on white, or white on red. Top corner placement. Clear space = full H-height on all sides.",
    layoutRule:
      "Clean modern layout, white-dominant. Red as accent. Vehicle prominent. No tropical or 'lifestyle exotic' backgrounds — keep it grounded and real.",
    legalDisclaimer:
      'Include placeholder disclaimer: "See dealer for complete details. Subject to credit approval through Honda Financial Services."',
    toneRule: "Tone: smart, reliable, modern. Never over-the-top.",
  },
  chevrolet: {
    key: "chevrolet",
    label: "Chevrolet",
    primaryColor: "#FFC72C",
    approvedFonts: "Louis Chevrolet display (Helvetica Neue substitute) for headlines",
    logoRule:
      "Gold Bowtie logo on light backgrounds; white-outlined Bowtie on dark. Top corner placement with clear space equal to logo height.",
    layoutRule:
      "Bold, American, work-and-play. Strong contrast. Vehicle is hero. Avoid pastel palettes.",
    legalDisclaimer:
      'Include: "See dealer for terms. Tax, title, license extra. Subject to credit approval."',
    toneRule: "Tone: rugged, capable, all-American.",
  },
  gmc: {
    key: "gmc",
    label: "GMC",
    primaryColor: "#C8102E",
    approvedFonts: "GMC Display family (Helvetica Neue substitute)",
    logoRule:
      "Red GMC logo (#C8102E) prominent in top corner. Clear space equal to logo height. Never distort.",
    layoutRule:
      "Premium truck aesthetic — dark/charcoal backgrounds work well. Vehicle dominant. Industrial textures acceptable.",
    legalDisclaimer:
      'Include: "See dealer for details. Tax, title, license extra. Subject to credit approval."',
    toneRule: "Tone: premium, professional-grade, capable.",
  },
  ram: {
    key: "ram",
    label: "Ram",
    primaryColor: "#000000",
    approvedFonts: "Ram Stencil for headlines, sans-serif body",
    logoRule:
      "Ram's-head logo prominent in top corner. Black or chrome treatment. Clear space = logo height.",
    layoutRule:
      "Bold, gritty, industrial. Dark dominant. Vehicle is the hero, often shown in action (mud, towing, jobsite).",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval."',
    toneRule: "Tone: tough, no-nonsense, built to work.",
  },
  jeep: {
    key: "jeep",
    label: "Jeep",
    primaryColor: "#006847",
    approvedFonts: "Jeep wordmark for logo, sans-serif elsewhere",
    logoRule:
      "Jeep wordmark in standard typography (no recoloring). Seven-slot grille is sacred — never crop or distort.",
    layoutRule:
      "Outdoor, adventurous, rugged. Dirt, trails, mountains acceptable. Avoid urban-only scenes.",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval."',
    toneRule: "Tone: adventurous, capable, freedom-oriented.",
  },
  nissan: {
    key: "nissan",
    label: "Nissan",
    primaryColor: "#C3002F",
    approvedFonts: "Nissan Brand sans-serif",
    logoRule:
      "Nissan logo in red or black, top corner, clear space equal to logo height.",
    layoutRule:
      "Modern, dynamic, approachable. Red as accent. Clean composition.",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval."',
    toneRule: "Tone: innovative, modern, dynamic.",
  },
  hyundai: {
    key: "hyundai",
    label: "Hyundai",
    primaryColor: "#002C5F",
    approvedFonts: "Hyundai Sans Head / Hyundai Sans Text",
    logoRule:
      "Slanted-H Hyundai logo in dark blue or white. Top corner with proper clear space.",
    layoutRule:
      "Modern, progressive, value-forward. Blue dominant. Clean typography.",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval through HMF."',
    toneRule: "Tone: progressive, value, modern design.",
  },
  kia: {
    key: "kia",
    label: "Kia",
    primaryColor: "#05141F",
    approvedFonts: "KiaSignature / Kia Signature Fine",
    logoRule:
      "New flowing 'KIA' wordmark. Black on light or white on dark. Generous clear space.",
    layoutRule:
      "Bold, modern, design-forward. Strong typography. Vehicle prominent.",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval."',
    toneRule: "Tone: design-forward, bold, modern.",
  },
  subaru: {
    key: "subaru",
    label: "Subaru",
    primaryColor: "#002F87",
    approvedFonts: "Helvetica Neue or approved sans-serif",
    logoRule: "Subaru six-star logo in blue or white. Top corner.",
    layoutRule:
      "Outdoor, adventurous, family-friendly. Real outdoor scenes — mountains, dogs, gear.",
    legalDisclaimer: 'Include: "See dealer for details."',
    toneRule: "Tone: love, adventure, family, outdoors.",
  },
  mazda: {
    key: "mazda",
    label: "Mazda",
    primaryColor: "#101010",
    approvedFonts: "Mazda Type Sans",
    logoRule: "Mazda 'M' logo in chrome/silver or black on light. Top corner.",
    layoutRule:
      "Premium, refined, KODO design language. Black/dark dominant. Vehicle as art.",
    legalDisclaimer: 'Include: "See dealer for details."',
    toneRule: "Tone: refined, driver-focused, elevated.",
  },
  volkswagen: {
    key: "volkswagen",
    label: "Volkswagen",
    primaryColor: "#001E50",
    approvedFonts: "VW Head / VW Text",
    logoRule: "VW circle logo in dark blue or white. Top corner with proper clear space.",
    layoutRule: "Clean, modern, German-engineered feel. Blue dominant.",
    legalDisclaimer: 'Include: "See dealer for details. Subject to credit approval."',
    toneRule: "Tone: precise, modern, accessible.",
  },
  bmw: {
    key: "bmw",
    label: "BMW",
    primaryColor: "#1C69D4",
    approvedFonts: "BMW Group / BMWTypeNext",
    logoRule:
      "BMW roundel logo prominent. Never recolor or distort. Top corner with proper clear space.",
    layoutRule: "Premium, performance-oriented. Black or white dominant. Blue accent.",
    legalDisclaimer: 'Include: "See dealer for details. BMW Financial Services."',
    toneRule: "Tone: ultimate driving machine — performance, precision, premium.",
  },
  mercedes: {
    key: "mercedes",
    label: "Mercedes-Benz",
    primaryColor: "#000000",
    approvedFonts: "Corporate A / Corporate S",
    logoRule:
      "Three-pointed star logo in black or silver. Top corner. Generous clear space.",
    layoutRule: "Luxury, refined, minimalist. Black/silver dominant. Vehicle as sculpture.",
    legalDisclaimer: 'Include: "See dealer for details. Mercedes-Benz Financial Services."',
    toneRule: "Tone: best or nothing — luxury, engineering, prestige.",
  },
  audi: {
    key: "audi",
    label: "Audi",
    primaryColor: "#000000",
    approvedFonts: "Audi Type",
    logoRule:
      "Four-rings logo in black or white. Top corner with proper clear space.",
    layoutRule: "Minimalist, technical, premium. Heavy use of black + white. Red accent only.",
    legalDisclaimer: 'Include: "See dealer for details. Audi Financial Services."',
    toneRule: "Tone: Vorsprung durch Technik — progress through technology.",
  },
  lexus: {
    key: "lexus",
    label: "Lexus",
    primaryColor: "#1A1A1A",
    approvedFonts: "Nobel / Lexus brand sans-serif",
    logoRule: "Lexus 'L' logo in chrome or black. Top corner.",
    layoutRule: "Luxury, refined, Japanese precision. Black dominant. Vehicle as art object.",
    legalDisclaimer: 'Include: "See dealer for details. Lexus Financial Services."',
    toneRule: "Tone: experience amazing — luxury craftsmanship.",
  },
  acura: {
    key: "acura",
    label: "Acura",
    primaryColor: "#000000",
    approvedFonts: "Acura Bespoke",
    logoRule: "Acura caliper-A logo in chrome or white. Top corner.",
    layoutRule: "Premium-performance, sharp angles, dark dominant.",
    legalDisclaimer: 'Include: "See dealer for details. Acura Financial Services."',
    toneRule: "Tone: precision crafted performance.",
  },
  cadillac: {
    key: "cadillac",
    label: "Cadillac",
    primaryColor: "#000000",
    approvedFonts: "Cadillac Gothic / Cadillac Serif",
    logoRule:
      "Cadillac shield/wreath logo prominent. Black/silver/gold treatment. Top corner.",
    layoutRule: "Bold, American luxury. Black dominant with gold or silver accents.",
    legalDisclaimer: 'Include: "See dealer for details."',
    toneRule: "Tone: American luxury — dare greatly.",
  },
  tesla: {
    key: "tesla",
    label: "Tesla",
    primaryColor: "#CC0000",
    approvedFonts: "Gotham / sans-serif",
    logoRule:
      "Tesla 'T' wordmark in red or white. Minimal placement. Lots of clear space.",
    layoutRule: "Ultra-minimalist. White or pure black dominant. Vehicle alone, no decoration.",
    legalDisclaimer: 'Include: "See dealer for details."',
    toneRule: "Tone: minimalist, future-forward, zero clutter.",
  },
};

export const OEM_BRAND_OPTIONS = Object.values(OEM_PRESETS).map((p) => ({ value: p.key, label: p.label }));

export function buildOemComplianceBlock(brandKey: OemBrandKey): string {
  const p = OEM_PRESETS[brandKey];
  if (!p) return "";
  return [
    `\n\n=== ${p.label.toUpperCase()} CO-OP COMPLIANCE MODE ===`,
    `Primary brand color: ${p.primaryColor}.`,
    `Approved typography: ${p.approvedFonts}.`,
    `Logo placement rule: ${p.logoRule}`,
    `Layout rule: ${p.layoutRule}`,
    `Brand tone: ${p.toneRule}`,
    `Legal/disclaimer: ${p.legalDisclaimer}`,
    "Strictly avoid unapproved fonts, off-brand colors, decorative elements, or competitor mentions.",
    "=== END OEM COMPLIANCE ===",
  ].join("\n");
}
