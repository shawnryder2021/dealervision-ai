import type { Dealership, Vehicle } from "./types";
import { CHANNEL_PRESETS } from "./constants";
import { buildOemComplianceBlock, type OemBrandKey } from "./oem-presets";
import { buildStateDisclaimerBlock } from "./state-disclaimers";

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

  const colorStr = `Brand colors: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
  const taglineStr = dealership.tagline ? ` Tagline: "${dealership.tagline}".` : "";

  // Build the contact footer overlay text
  const footerParts: string[] = [dealership.name];
  if (c.phone) footerParts.push(c.phone);
  if (c.website) footerParts.push(c.website.replace(/^https?:\/\//, ""));
  if (c.address) footerParts.push(c.address);

  const footerText = footerParts.join("  |  ");

  // Also collect any social handles for optional display
  const socialParts: string[] = [];
  if (c.social?.instagram) socialParts.push(`IG: ${c.social.instagram}`);
  if (c.social?.facebook) socialParts.push(`FB: ${c.social.facebook}`);
  const socialStr =
    socialParts.length > 0
      ? ` Social handles to display if space allows: ${socialParts.join(", ")}.`
      : "";

  const contactStr =
    footerParts.length > 1
      ? ` IMPORTANT: Include a clean professional footer bar at the bottom of the image with this text displayed clearly and legibly: "${footerText}".${socialStr}`
      : "";

  return `Dealership: ${dealership.name}.${taglineStr} ${colorStr}${contactStr}${getLocalContext(dealership)} Use primary color ${colors.primary} as the dominant brand color in overlays, banners, and accents.`;
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

/** Builds a concise "contact footer" string for use inside individual templates */
function getContactLine(dealership: Dealership): string {
  const c = dealership.contact ?? {};
  const parts: string[] = [];
  if (c.phone) parts.push(c.phone);
  if (c.website) parts.push(c.website.replace(/^https?:\/\//, ""));
  if (c.address) parts.push(c.address);
  return parts.length > 0 ? parts.join("  |  ") : "";
}

const TEMPLATES: Record<string, (ctx: PromptContext) => string> = {
  "vehicle-spotlight": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "featured vehicle";
    const price = vehicle?.price ? `$${vehicle.price.toLocaleString()}` : "";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const contactLine = getContactLine(ctx.dealership);
    return `Professional automotive photography, ${getChannelFormatting(ctx.channel)}. Stunning hero shot of a ${vehicleDesc}. ${accuracy} ${ctx.headline ? `Bold headline text overlay: "${ctx.headline}".` : ""} ${price ? `Display price prominently: "${price}".` : ""} ${ctx.subheadline ? `Subtext overlay: "${ctx.subheadline}".` : ""} ${ctx.cta ? `Call to action button: "${ctx.cta}".` : ""} ${contactLine ? `Footer bar at the bottom displaying dealership contact info: "${contactLine}".` : ""} Style: ${ctx.style}. ${getBrandContext(ctx.dealership)} Clean background, dramatic automotive lighting, showroom quality. All text must be sharp and fully legible. Professional composition, modern automotive advertising.`;
  },

  "sales-event": (ctx) => {
    const accuracy = ctx.vehicle ? getVehicleAccuracyPrompt(ctx.vehicle) : "";
    const contactLine = getContactLine(ctx.dealership);
    return `Eye-catching automotive sales event promotional graphic, ${getChannelFormatting(ctx.channel)}. Bold headline overlay: "${ctx.event_name || ctx.headline || "SPECIAL SALES EVENT"}" at ${ctx.dealership.name}. ${ctx.offer_details ? `Subheadline: "${ctx.offer_details}".` : ""} ${ctx.event_dates ? `Display event dates prominently: "${ctx.event_dates}".` : ""} ${ctx.vehicle ? `Feature a ${getVehicleDescription(ctx.vehicle)}. ${accuracy}` : "Feature an exciting lineup of vehicles."} ${ctx.cta ? `Call to action: "${ctx.cta}".` : ""} ${contactLine ? `Footer bar at the bottom with dealership contact: "${contactLine}".` : ""} Style: ${ctx.style}, high-energy, attention-grabbing. ${getBrandContext(ctx.dealership)} Professional advertising design, all text crisp and legible.`;
  },

  "new-arrival": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "new vehicle";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const contactLine = getContactLine(ctx.dealership);
    return `Professional automotive "Just Arrived" announcement graphic, ${getChannelFormatting(ctx.channel)}. Exciting new arrival post featuring a ${vehicleDesc}. ${accuracy} ${ctx.headline ? `Headline overlay: "${ctx.headline}".` : 'Bold "JUST ARRIVED" text overlay.'} ${vehicle?.price ? `Price overlay: "$${vehicle.price.toLocaleString()}".` : ""} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} ${ctx.cta ? `CTA: "${ctx.cta}".` : ""} ${contactLine ? `Footer contact bar: "${contactLine}".` : ""} Style: ${ctx.style}, fresh and exciting. ${getBrandContext(ctx.dealership)} Modern, clean layout with premium feel. All text sharp and legible.`;
  },

  "price-drop": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "select vehicle";
    const accuracy = vehicle ? getVehicleAccuracyPrompt(vehicle) : "";
    const contactLine = getContactLine(ctx.dealership);
    return `Urgent "PRICE REDUCED" automotive promotional graphic, ${getChannelFormatting(ctx.channel)}. Eye-catching price drop alert for a ${vehicleDesc}. ${accuracy} ${ctx.headline ? `Bold headline: "${ctx.headline}".` : 'Bold "PRICE REDUCED!" text overlay.'} ${ctx.offer_details ? `New price displayed prominently: "${ctx.offer_details}".` : ""} ${ctx.cta ? `CTA: "${ctx.cta}".` : ""} ${contactLine ? `Footer contact bar: "${contactLine}".` : ""} Style: ${ctx.style}, urgent, attention-grabbing with bold typography. ${getBrandContext(ctx.dealership)} Include visual price comparison element. All text crisp and legible.`;
  },

  "inventory-showcase": (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `Professional automotive inventory showcase graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Headline: "${ctx.headline}".` : `"Browse Our Inventory" headline at ${ctx.dealership.name}.`} Multi-vehicle display showing a variety of quality vehicles. ${ctx.cta ? `CTA: "${ctx.cta}".` : ""} ${contactLine ? `Footer contact bar: "${contactLine}".` : ""} Style: ${ctx.style}, organized, visually appealing grid or collage layout. ${getBrandContext(ctx.dealership)} Clean, modern design. Each vehicle clearly visible. All text legible.`;
  },

  "brand-post": (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `Professional dealership brand awareness post, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Message overlay: "${ctx.headline}".` : `Showcase ${ctx.dealership.name} as a trusted automotive destination.`} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} ${contactLine ? `Include dealership contact info: "${contactLine}".` : ""} Style: ${ctx.style}, warm, professional, trustworthy. ${getBrandContext(ctx.dealership)} Show a welcoming dealership environment. Community-focused, people-oriented feel. All text sharp and legible.`;
  },

  testimonial: (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `Customer testimonial spotlight graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.testimonial_text ? `Customer quote overlay: "${ctx.testimonial_text}"` : "Positive customer review highlight"}${ctx.testimonial_author ? ` — ${ctx.testimonial_author}` : ""}. ${ctx.rating ? `${ctx.rating}-star rating display.` : "5-star rating display."} ${contactLine ? `Footer with dealership info: "${contactLine}".` : ""} Style: ${ctx.style}, trustworthy, authentic. ${getBrandContext(ctx.dealership)} Clean design with styled quote layout. Include star rating visual. All text sharp and legible.`;
  },

  "service-promo": (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `Professional automotive service department promotional graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.dealership.name} Service Centre. ${ctx.service_offer ? `Bold headline: "${ctx.service_offer}".` : ctx.headline ? `Bold headline: "${ctx.headline}".` : "Service special offer."} ${ctx.service_details ? `Details overlay: "${ctx.service_details}".` : ""} ${ctx.cta ? `CTA: "${ctx.cta}".` : ""} ${contactLine ? `Footer contact bar: "${contactLine}".` : ""} Style: ${ctx.style}, clean, trustworthy design. ${getBrandContext(ctx.dealership)} Include automotive service imagery (tools, professional technician, vehicle on lift). All text crisp and fully legible.`;
  },

  financing: (ctx) => {
    const accuracy = ctx.vehicle ? getVehicleAccuracyPrompt(ctx.vehicle) : "";
    const contactLine = getContactLine(ctx.dealership);
    return `Automotive financing and offer highlight graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Bold headline: "${ctx.headline}".` : '"Special Financing Available".'} ${ctx.offer_details ? `Offer details overlay: "${ctx.offer_details}".` : ""} ${ctx.vehicle ? `Featured vehicle: ${getVehicleDescription(ctx.vehicle)}. ${accuracy}` : ""} ${ctx.cta ? `CTA: "${ctx.cta}".` : ""} ${contactLine ? `Footer contact bar: "${contactLine}".` : ""} Style: ${ctx.style}, bold, clear, trustworthy. ${getBrandContext(ctx.dealership)} Large, legible numbers and text. All text crisp and fully legible.`;
  },

  holiday: (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `Branded holiday greeting post for automotive dealership, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Message overlay: "${ctx.headline}".` : "Warm holiday greeting."} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} ${contactLine ? `Include dealership contact info: "${contactLine}".` : ""} Style: ${ctx.style}, festive, warm, on-brand. ${getBrandContext(ctx.dealership)} Tasteful holiday themed design with dealership branding. Professional, polished, celebratory mood. All text elegant and legible.`;
  },

  custom: (ctx) => {
    const contactLine = getContactLine(ctx.dealership);
    return `${ctx.custom_prompt || ctx.headline || "Professional automotive marketing visual"}. ${getChannelFormatting(ctx.channel)}. ${contactLine ? `Include dealership contact info in the image: "${contactLine}".` : ""} Style: ${ctx.style}. ${getBrandContext(ctx.dealership)} Professional quality, all text crisp and legible, modern design.`;
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

  const includePrompt =
    includeParts.length > 0
      ? `Include ${includeParts.join(" and ")} in the visible creative text or scene details if it naturally fits the layout.`
      : "";

  const rendered = template ? template(context) : TEMPLATES.custom(context);
  const base = `${rendered} ${includePrompt}`.replace(/\s+/g, " ").trim();

  const ext = context.dealership as Dealership & {
    oem_brand?: OemBrandKey | null;
    state_code?: string | null;
  };
  let final = base;
  if (ext.oem_brand) final += buildOemComplianceBlock(ext.oem_brand);
  if (ext.state_code) final += buildStateDisclaimerBlock(ext.state_code);
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
