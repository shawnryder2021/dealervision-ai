import type { Dealership, Vehicle } from "./types";
import { CHANNEL_PRESETS } from "./constants";
import { buildOemComplianceBlock, type OemBrandKey } from "./oem-presets";
import { buildStateDisclaimerBlock } from "./state-disclaimers";
import { buildSceneBlock } from "./scene-presets";

interface PromptContext {
  content_type: string;
  channel: string;
  dealership: Dealership;
  vehicle?: Vehicle | null;
  headline?: string;
  subheadline?: string;
  cta?: string;
  style: string;
  event_name?: string;
  event_dates?: string;
  offer_details?: string;
  service_offer?: string;
  service_details?: string;
  testimonial_text?: string;
  testimonial_author?: string;
  rating?: number;
  custom_prompt?: string;
  include_vehicle_year?: string;
  include_vehicle_model?: string;
  /** ID from SCENE_PRESETS — sets where/how the vehicle is photographed */
  scene_location?: string;
}

function getChannelFormatting(channelId: string): string {
  const channel = CHANNEL_PRESETS.find((c) => c.id === channelId);
  if (!channel) return "";
  return `${channel.aspectRatio} format, optimized for ${channel.name}`;
}

function getVehicleDescription(vehicle: Vehicle): string {
  const parts = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
  ].filter(Boolean);
  return parts.join(" ");
}

function getVehicleAccuracyPrompt(vehicle: Vehicle): string {
  if (!vehicle.make || !vehicle.model) return "";
  const key = `${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}`;
  const y = vehicle.year || 2025;

  const cues: Record<string, string> = {
    "volkswagen-taos": y >= 2025
      ? "redesigned front grille with horizontal light bar, updated LED headlights, wider stance, refreshed bumper"
      : "compact crossover SUV, VW emblem grille, LED headlights, angular lines",
    "volkswagen-atlas": "three-row midsize SUV, bold VW grille, LED headlights, muscular fenders",
    "volkswagen-jetta": "compact sedan, VW front grille, LED headlights, clean profile",
    "volkswagen-tiguan": "compact SUV, VW grille, LED headlights, athletic proportions",
    "volkswagen-id.4": "electric SUV, closed-off grille, LED light strip, aerodynamic EV design",
    "volkswagen-golf gti": "hot hatch, honeycomb grille, red accents, dual exhaust",
    "toyota-camry": "midsize sedan, bold grille, swept-back headlights",
    "toyota-corolla": "compact sedan, sleek design, modern Toyota grille",
    "toyota-rav4": "compact SUV, angular design, rugged lower cladding",
    "toyota-highlander": "three-row midsize SUV, bold grille, floating roofline",
    "toyota-tacoma": "midsize pickup truck, bold front end",
    "toyota-tundra": "full-size pickup, wide grille, muscular stance",
    "honda-civic": "compact sedan, low hood, horizontal grille, clean lines",
    "honda-accord": "midsize sedan, fastback roofline, chrome accent",
    "honda-cr-v": "compact SUV, bold grille, upright stance",
    "honda-pilot": "three-row SUV, boxy design, rugged look",
    "ford-f-150": "full-size pickup, bold grille, C-clamp headlights",
    "ford-mustang": "sports car, long hood, short deck, tri-bar taillights",
    "ford-bronco": "off-road SUV, round headlights, retro-modern design",
    "ford-explorer": "three-row SUV, athletic design",
    "chevrolet-silverado": "full-size pickup, bowtie grille",
    "chevrolet-equinox": "compact SUV, split headlights, modern design",
    "chevrolet-corvette": "mid-engine sports car, aggressive low stance",
    "bmw-3 series": "sport sedan, kidney grille, angel eye headlights",
    "bmw-x5": "midsize luxury SUV, bold kidney grille",
    "mercedes-benz-c-class": "luxury sedan, star emblem, sweeping lines",
    "mercedes-benz-gle": "midsize luxury SUV, bold grille",
    "hyundai-tucson": "compact SUV, parametric hidden lights, angular panels",
    "hyundai-santa fe": "midsize SUV, H-shaped DRLs, boxy modern design",
    "kia-telluride": "three-row SUV, tiger nose grille, boxy premium",
    "kia-sportage": "compact SUV, boomerang DRLs, bold design",
    "nissan-rogue": "compact SUV, V-motion grille, floating roofline",
    "subaru-outback": "lifted wagon/SUV, rugged cladding",
    "jeep-wrangler": "off-road SUV, seven-slot grille, round headlights",
    "jeep-grand cherokee": "midsize luxury SUV, seven-slot grille",
    "tesla-model 3": "electric sedan, no grille, minimalist glass roof",
    "tesla-model y": "electric SUV, no grille, crossover proportions",
    "ram-1500": "full-size pickup, split headlights, RAM lettering grille",
    "audi-q5": "luxury compact SUV, singleframe grille, LED matrix headlights",
    "lexus-rx": "luxury midsize SUV, spindle grille, L-shaped DRLs",
  };

  const designCue = cues[key];
  if (designCue) {
    return `IMPORTANT: This is a ${getVehicleDescription(vehicle)} — accurately depict this exact model with its real-world design: ${designCue}. Match the correct body style, proportions, and distinctive features of this specific vehicle.`;
  }
  return `IMPORTANT: Accurately depict the real-world ${getVehicleDescription(vehicle)} with correct body style, proportions, and design details for this exact make, model, and year.`;
}

function getBrandContext(dealership: Dealership): string {
  const colors = dealership.brand_colors;
  const c = dealership.contact ?? {};
  const hasLogo = !!dealership.logo_url;

  const colorStr = `Brand colors: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
  const taglineStr = dealership.tagline ? ` Tagline: "${dealership.tagline}".` : "";

  // Footer contact info — when a logo is in the top-left, the dealership name
  // is already shown there, so don't repeat it in the footer. Just contact details.
  const footerParts: string[] = [];
  if (!hasLogo) footerParts.push(dealership.name);
  if (c.phone) footerParts.push(c.phone);
  if (c.website) footerParts.push(c.website.replace(/^https?:\/\//, ""));
  if (c.address) footerParts.push(c.address);

  const footerText = footerParts.join("  |  ");

  const socialParts: string[] = [];
  if (c.social?.instagram) socialParts.push(`IG: ${c.social.instagram}`);
  if (c.social?.facebook) socialParts.push(`FB: ${c.social.facebook}`);
  const socialStr =
    socialParts.length > 0
      ? ` Social handles (small text, footer-right): ${socialParts.join(", ")}.`
      : "";

  // ─── Layout zones ──────────────────────────────────────────────
  // Hard-locked structure so the AI never duplicates the logo or
  // hides it behind text. Three zones: HEADER → HERO → FOOTER.
  // ───────────────────────────────────────────────────────────────
  const layoutZones = `
    ═══ LAYOUT ZONES (mandatory) ═══
    [ZONE A — HEADER, top ~12%] ${hasLogo
      ? `Provided ${dealership.name} logo on a clean white rounded plate, top-left only.`
      : `Dealership name "${dealership.name}" as clean typography, top-left only.`} Headline goes top-right.
    [ZONE B — HERO, middle ~73%] Vehicle photo + price/headline overlays only. NO logos here.
    [ZONE C — FOOTER, bottom ~10%] Solid brand-color bar, TEXT ONLY: "${footerText}"${socialStr}
       The footer is a PHONE NUMBER + ADDRESS bar — that is its only purpose. NO logo image, NO logo plate, NO globe icon, NO brand mark, NO watermark, NO emblem, NO repeated dealership name graphic here. Just the contact text, centered.
    ═══════════════════════════════════
  `.trim();

  return `Dealership context: ${dealership.name}.${taglineStr} ${colorStr}${layoutZones}${getLocalContext(dealership)} Use primary color ${colors.primary} as the dominant brand color in overlays, banners, and accents.`;
}

/**
 * Logo lockdown — prepended to EVERY prompt as the very first instruction
 * so the AI processes it before anything else. This is the strongest
 * statement of the no-duplicate-logo rule because we've seen the AI
 * still invent a watermark logo in the footer despite earlier rules.
 */
function getLogoLockdown(dealership: Dealership): string {
  const hasLogo = !!dealership.logo_url;
  if (hasLogo) {
    // The logo is composited server-side AFTER generation, so the AI must
    // leave a clean reserved area in the top-left and add NO branding itself.
    return [
      "█████ ABSOLUTE BRANDING RULES — READ FIRST █████",
      "DO NOT generate, draw, paint, render, sketch, illustrate, or imagine ANY dealership logo, emblem, brand mark, monogram, shield, globe icon, ribbon, badge, watermark, corner stamp, or branded graphic ANYWHERE in this image. The official dealership logo will be added by a separate process AFTER you generate this image — your job is to leave it out entirely.",
      "RESERVE a clean empty area in the TOP-LEFT corner of the image (roughly the top-left 22% × 12% of the image). This area should be a smooth, low-detail portion of the background or scene — no headlines, no text, no subjects, no logos here. Just a clean, simple visual area where a logo will be placed later.",
      "ABSOLUTELY FORBIDDEN ANYWHERE in the image:",
      "- Any dealership logo, brand mark, emblem, badge, monogram, shield, globe, ribbon, watermark, ghost mark, or corner stamp.",
      "- The text 'dealership name' rendered as logo art with surrounding icons or graphics.",
      "- Any logo-shaped graphic, even decorative, in any corner or in the footer.",
      "- Any small icon-with-text combination that resembles a dealership identifier.",
      "Manufacturer logos (Toyota, Honda, Ford, etc.) are allowed ONLY where they naturally appear on the actual vehicle's grille and badging in the photograph — never added as overlays.",
      "If you are tempted to add a small branded watermark, mini-logo, or globe-icon-with-text near a corner — DO NOT. The image must be clean of all dealer branding so the real logo can be cleanly composited on top.",
      "█████████████████████████████████████████",
      "",
    ].join(" ");
  }
  return [
    "█████ ABSOLUTE BRANDING RULES — READ FIRST █████",
    "NO dealership logo, emblem, badge, globe icon, monogram, shield, ribbon, watermark, or invented brand mark anywhere in the image.",
    `The dealership name "${dealership.name}" may appear ONCE as plain typography in the top-left header. Nowhere else. NEVER as logo art with surrounding icons, plates, or graphics.`,
    "FORBIDDEN: any logo, icon, brand mark, emblem, or graphic element inside the footer.",
    "█████████████████████████████████████████",
    "",
  ].join(" ");
}

function getManufacturerStyleGuidance(make?: string): string {
  if (!make) return "";

  const key = make.toLowerCase();
  const brandGuidance: Record<string, string> = {
    honda: "Use clean Honda-inspired design language: practical, modern, confident layouts with precise sans-serif typography and restrained red accent usage.",
    volkswagen: "Use Volkswagen-inspired visual style: minimal, grid-based composition, balanced whitespace, modern sans-serif typography, and crisp blue/white brand cues.",
    ford: "Use Ford-inspired style cues: bold confidence, strong headline hierarchy, truck/SUV-ready utility vibe, and clear high-contrast typography.",
  };

  return brandGuidance[key]
    ? ` Manufacturer style direction: ${brandGuidance[key]}`
    : ` Manufacturer style direction: Match ${make} visual identity cues with consistent typography, layout rhythm, and brand-appropriate design details without copying protected logos.`;
}

/** Builds a local market context string injected into every prompt */
function getLocalContext(dealership: Dealership): string {
  const lc = dealership.local_context;
  if (!lc) return "";

  const parts: string[] = [];

  if (lc.inventory_type) {
    const inv = lc.inventory_type === "new" ? "new vehicles only"
      : lc.inventory_type === "used" ? "pre-owned/used vehicles only"
      : "both new and pre-owned vehicles";
    parts.push(`Dealership sells ${inv}`);
  }
  if (lc.manufacturer_brand && lc.inventory_type !== "used") {
    parts.push(`primary new-vehicle manufacturer focus: ${lc.manufacturer_brand}`);
    parts.push(getManufacturerStyleGuidance(lc.manufacturer_brand).trim());
  }
  if (lc.years_established) parts.push(lc.years_established);
  if (lc.communities_served) parts.push(`serving ${lc.communities_served}`);
  if (lc.landmarks) parts.push(`located near ${lc.landmarks}`);
  if (lc.personality) parts.push(lc.personality);
  if (lc.specialties) parts.push(`specialties: ${lc.specialties}`);
  if (lc.seasonal_notes) parts.push(`local climate/season context: ${lc.seasonal_notes}`);
  if (lc.community_involvement) parts.push(lc.community_involvement);
  if (lc.unique_selling_points) parts.push(`key selling points: ${lc.unique_selling_points}`);

  if (parts.length === 0) return "";
  return ` Local market context: ${parts.join("; ")}.`;
}

/** Returns the scene block for a context — handles local-landmark fallback */
function getSceneBlock(ctx: PromptContext): string {
  const landmark = ctx.dealership.local_context?.landmarks;
  return buildSceneBlock(ctx.scene_location, landmark || undefined);
}

/**
 * Core photographic quality footer — appended to every vehicle image.
 * Drives the AI toward clean, professional commercial automotive photography.
 */
const PHOTO_QUALITY =
  "Ultra-high-resolution commercial automotive photography. Shot with a 50mm prime lens at f/2.8, ISO 100. Perfect color accuracy and paint depth. No lens distortion. The vehicle is the absolute hero — no people, no distractions. Photo-realistic, not illustrated or painterly. Clean image: no watermarks, no stray text unless explicitly specified, no clutter. Professional post-production: color grading, panel reflections, tyre detail.";

const TEMPLATES: Record<string, (ctx: PromptContext) => string> = {
  "vehicle-spotlight": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "featured vehicle";
    const price = vehicle?.price ? `$${vehicle.price.toLocaleString()}` : "";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const scene = getSceneBlock(ctx);
    const hasScene = !!scene;
    const defaultScene = hasScene ? "" : "Clean, neutral background with soft gradient. Professional three-point automotive studio lighting. Slight ground-plane reflection beneath the vehicle.";
    const yearStr = vehicle?.year ? `${vehicle.year} ` : "";

    return [
      `Professional commercial automotive photography, ${getChannelFormatting(ctx.channel)}.`,
      `Hero shot of a ${vehicleDesc}. ${accuracy}`,
      vehicle?.year ? `This is a ${yearStr}model year vehicle — the year ${vehicle.year} must be clearly visible as styled text in the image.` : "",
      scene || defaultScene,
      `Photography style: ${ctx.style}.`,
      ctx.headline ? `Typography overlay — main headline: "${ctx.headline}".` : "",
      price ? `Display sale price prominently: "${price}".` : "",
      ctx.subheadline ? `Secondary text overlay: "${ctx.subheadline}".` : "",
      ctx.cta ? `Call-to-action button text: "${ctx.cta}".` : "",
      getBrandContext(ctx.dealership),
      PHOTO_QUALITY,
      "All text overlays must be razor-sharp, fully legible, and positioned within safe margins.",
    ].filter(Boolean).join(" ");
  },

  "sales-event": (ctx) => {
    const accuracy = ctx.vehicle ? getVehicleAccuracyPrompt(ctx.vehicle) : "";
    const scene = getSceneBlock(ctx);

    return [
      `High-impact automotive sales event graphic, ${getChannelFormatting(ctx.channel)}.`,
      `Bold headline: "${ctx.event_name || ctx.headline || "SPECIAL SALES EVENT"}" at ${ctx.dealership.name}.`,
      ctx.offer_details ? `Offer subheadline: "${ctx.offer_details}".` : "",
      ctx.event_dates ? `Event dates displayed prominently: "${ctx.event_dates}".` : "",
      ctx.vehicle
        ? `Feature a ${getVehicleDescription(ctx.vehicle)} as the hero vehicle. ${accuracy}`
        : "Feature a dynamic lineup of vehicles arranged attractively.",
      scene,
      `Visual style: ${ctx.style}, high-energy, bold typography, attention-commanding.`,
      ctx.cta ? `Call-to-action: "${ctx.cta}".` : "",
      getBrandContext(ctx.dealership),
      PHOTO_QUALITY,
      "All text must be crisp and fully legible.",
    ].filter(Boolean).join(" ");
  },

  "new-arrival": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "new vehicle";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const scene = getSceneBlock(ctx);
    const defaultScene = scene || "Dramatic studio with a cool-toned gradient sweep background. Spotlights emphasize the new paint and clean body lines. Ground reflection visible below.";

    return [
      `Exciting 'Just Arrived' vehicle announcement, ${getChannelFormatting(ctx.channel)}.`,
      `Featuring a brand-new ${vehicleDesc}. ${accuracy}`,
      defaultScene,
      ctx.headline ? `Headline text overlay: "${ctx.headline}".` : '"JUST ARRIVED" bold text overlay.',
      vehicle?.price ? `Price overlay: "$${vehicle.price.toLocaleString()}".` : "",
      ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : "",
      ctx.cta ? `CTA: "${ctx.cta}".` : "",
      `Style: ${ctx.style}, fresh, exciting, premium.`,
      getBrandContext(ctx.dealership),
      PHOTO_QUALITY,
      "All text sharp and fully legible.",
    ].filter(Boolean).join(" ");
  },

  "price-drop": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "select vehicle";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const scene = getSceneBlock(ctx);

    return [
      `Urgent 'PRICE REDUCED' automotive promotional graphic, ${getChannelFormatting(ctx.channel)}.`,
      `Featuring a ${vehicleDesc}. ${accuracy}`,
      scene || "Clean studio background. The vehicle is well-lit showing every detail.",
      ctx.headline ? `Bold attention-grabbing headline: "${ctx.headline}".` : '"PRICE REDUCED!" bold headline text.',
      ctx.offer_details ? `New price prominently displayed: "${ctx.offer_details}".` : "",
      ctx.cta ? `CTA: "${ctx.cta}".` : "",
      `Style: ${ctx.style}, urgent, bold, high-contrast typography.`,
      getBrandContext(ctx.dealership),
      PHOTO_QUALITY,
      "All text crisp and fully legible.",
    ].filter(Boolean).join(" ");
  },

  "inventory-showcase": (ctx) => {
    const scene = getSceneBlock(ctx);

    return [
      `Professional automotive inventory showcase, ${getChannelFormatting(ctx.channel)}.`,
      ctx.headline ? `Headline: "${ctx.headline}".` : `"Explore Our Inventory" at ${ctx.dealership.name}.`,
      scene || "Clean neutral background. Multiple vehicles arranged in an organized, visually appealing composition.",
      `Style: ${ctx.style}, organized grid or artistic collage layout.`,
      ctx.cta ? `CTA: "${ctx.cta}".` : "",
      getBrandContext(ctx.dealership),
      "Ultra-high-resolution commercial photography. Each vehicle clearly visible with accurate colour and detail. No clutter. Modern, professional automotive advertising design. All text legible.",
    ].filter(Boolean).join(" ");
  },

  "brand-post": (ctx) => {
    const scene = getSceneBlock(ctx);

    return [
      `Professional automotive dealership brand awareness post, ${getChannelFormatting(ctx.channel)}.`,
      ctx.headline
        ? `Central message: "${ctx.headline}".`
        : `Showcase ${ctx.dealership.name} as a trusted, community-focused automotive destination.`,
      ctx.subheadline ? `Supporting text: "${ctx.subheadline}".` : "",
      scene || "Welcoming dealership environment with vehicles tastefully displayed.",
      `Style: ${ctx.style}, warm, professional, trustworthy. Community-oriented.`,
      getBrandContext(ctx.dealership),
      "Photo-realistic commercial photography. People and environment feel genuine, not stock-photo generic. All text sharp and legible.",
    ].filter(Boolean).join(" ");
  },

  testimonial: (ctx) => {

    return [
      `Customer testimonial spotlight graphic, ${getChannelFormatting(ctx.channel)}.`,
      ctx.testimonial_text
        ? `Customer review quote: "${ctx.testimonial_text}"${ctx.testimonial_author ? ` — ${ctx.testimonial_author}` : ""}.`
        : "Glowing customer review highlight.",
      `${ctx.rating ?? 5}-star rating displayed with gold star icons.`,
      `Style: ${ctx.style}, trustworthy, clean, authentic.`,
      getBrandContext(ctx.dealership),
      "Elegant design. Quote displayed in a stylish callout box with clear typography. Gold stars prominent. All text sharp and legible.",
    ].filter(Boolean).join(" ");
  },

  "service-promo": (ctx) => {

    return [
      `Automotive service department promotional graphic, ${getChannelFormatting(ctx.channel)}.`,
      `${ctx.dealership.name} Service Centre.`,
      ctx.service_offer
        ? `Bold headline: "${ctx.service_offer}".`
        : ctx.headline
        ? `Bold headline: "${ctx.headline}".`
        : "Special service offer.",
      ctx.service_details ? `Offer details: "${ctx.service_details}".` : "",
      ctx.cta ? `CTA: "${ctx.cta}".` : "",
      `Style: ${ctx.style}, clean, trustworthy.`,
      getBrandContext(ctx.dealership),
      "Include a realistic automotive service scene — professional technician in branded uniform working on a vehicle, or clean service bay environment. High-resolution. All text crisp and fully legible.",
    ].filter(Boolean).join(" ");
  },

  financing: (ctx) => {
    const accuracy = ctx.vehicle ? getVehicleAccuracyPrompt(ctx.vehicle) : "";
    const scene = getSceneBlock(ctx);

    return [
      `Automotive financing offer graphic, ${getChannelFormatting(ctx.channel)}.`,
      ctx.headline ? `Bold headline: "${ctx.headline}".` : '"Special Financing Available."',
      ctx.offer_details ? `Offer details: "${ctx.offer_details}".` : "",
      ctx.vehicle ? `Featured vehicle: ${getVehicleDescription(ctx.vehicle)}. ${accuracy}` : "",
      scene,
      ctx.cta ? `CTA: "${ctx.cta}".` : "",
      `Style: ${ctx.style}, bold, clear numbers, trustworthy.`,
      getBrandContext(ctx.dealership),
      PHOTO_QUALITY,
      "Large, fully legible financial numbers and text. Clean, professional layout.",
    ].filter(Boolean).join(" ");
  },

  holiday: (ctx) => {

    return [
      `Branded holiday greeting post for automotive dealership, ${getChannelFormatting(ctx.channel)}.`,
      ctx.headline ? `Message: "${ctx.headline}".` : "Warm, heartfelt holiday greeting.",
      ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : "",
      `Style: ${ctx.style}, festive, warm, on-brand.`,
      getBrandContext(ctx.dealership),
      "Tasteful seasonal design — not overly busy. Professional, polished, celebratory feel. All text elegant and legible.",
    ].filter(Boolean).join(" ");
  },

  custom: (ctx) => {
    const scene = getSceneBlock(ctx);

    return [
      ctx.custom_prompt || ctx.headline || "Professional automotive marketing visual.",
      `${getChannelFormatting(ctx.channel)}.`,
      scene,
      `Style: ${ctx.style}.`,
      getBrandContext(ctx.dealership),
      "Professional quality, photo-realistic, all text crisp and legible, modern design.",
    ].filter(Boolean).join(" ");
  },
};

export function buildPrompt(context: PromptContext): string {
  const template = TEMPLATES[context.content_type];
  const includeParts: string[] = [];

  if (context.include_vehicle_year) {
    includeParts.push(`vehicle year "${context.include_vehicle_year}"`);
  }

  if (context.include_vehicle_model) {
    includeParts.push(`vehicle model "${context.include_vehicle_model}"`);
  }

  // Build mandatory text-overlay instructions for year / model
  let includePrompt = "";
  if (context.include_vehicle_year) {
    includePrompt += ` MANDATORY: Display the vehicle model year "${context.include_vehicle_year}" as a clearly legible, prominently styled text element in the image — do not omit it.`;
  }
  if (context.include_vehicle_model) {
    includePrompt += ` MANDATORY: Display the vehicle model name "${context.include_vehicle_model}" as a clearly legible text element in the image — do not omit it.`;
  }

  const rendered = template ? template(context) : TEMPLATES.custom(context);
  // Logo lockdown is the FIRST thing the AI reads — before the photography,
  // headline, or scene description — so the no-duplicate-logo rule has
  // maximum priority in attention.
  const lockdown = getLogoLockdown(context.dealership);
  const base = `${lockdown}${rendered} ${includePrompt}`.replace(/\s+/g, " ").trim();

  const ext = context.dealership as Dealership & {
    oem_brand?: OemBrandKey | null;
    state_code?: string | null;
  };
  let final = base;
  if (ext.oem_brand) final += buildOemComplianceBlock(ext.oem_brand);
  if (ext.state_code) final += buildStateDisclaimerBlock(ext.state_code);
  // Reinforce at the END too — bookend the prompt so the rule is the last
  // thing the AI reads as well as the first.
  if (context.dealership.logo_url) {
    final += " FINAL CHECK: Confirm the output image has exactly ONE dealership logo, in the top-left header only. No logo, icon, or brand mark in the footer or anywhere else. Footer is text-only.";
  } else {
    final += " FINAL CHECK: Confirm the output image has NO logo, emblem, badge, or invented brand mark anywhere. Dealership name appears only as plain typography.";
  }
  return final;
}

export function getAspectRatioForChannel(channelId: string): string {
  const channel = CHANNEL_PRESETS.find((c) => c.id === channelId);
  return channel?.aspectRatio || "1:1";
}

export function getResolutionForChannel(channelId: string): string {
  const channel = CHANNEL_PRESETS.find((c) => c.id === channelId);
  return channel?.resolution || "1K";
}
