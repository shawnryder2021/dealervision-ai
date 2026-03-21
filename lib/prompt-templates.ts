import type { Dealership, Vehicle } from "./types";
import { CHANNEL_PRESETS } from "./constants";

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

function getBrandContext(dealership: Dealership): string {
  const colors = dealership.brand_colors;
  return `Dealership: ${dealership.name}${dealership.tagline ? `. Tagline: "${dealership.tagline}"` : ""}. Brand colors: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
}

const TEMPLATES: Record<string, (ctx: PromptContext) => string> = {
  "vehicle-spotlight": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "featured vehicle";
    const price = vehicle?.price ? `$${vehicle.price.toLocaleString()}` : "";
    return `Professional automotive photography, ${getChannelFormatting(ctx.channel)}. Stunning hero shot of a ${vehicleDesc}. ${ctx.headline ? `Headline text: "${ctx.headline}".` : ""} ${price ? `Price displayed: ${price}.` : ""} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} Style: ${ctx.style}. ${getBrandContext(ctx.dealership)} Clean background, dramatic automotive lighting, showroom quality. Sharp legible text overlay with vehicle details. Professional composition, modern automotive advertising.`;
  },

  "sales-event": (ctx) => {
    return `Eye-catching automotive sales event promotional graphic, ${getChannelFormatting(ctx.channel)}. Bold headline: "${ctx.event_name || ctx.headline || "SPECIAL SALES EVENT"}" at ${ctx.dealership.name}. ${ctx.offer_details ? `Subheadline: "${ctx.offer_details}".` : ""} ${ctx.event_dates ? `Dates: ${ctx.event_dates}.` : ""} ${ctx.vehicle ? `Feature a ${getVehicleDescription(ctx.vehicle)}.` : "Feature an exciting lineup of vehicles."} Style: ${ctx.style}, high-energy, attention-grabbing. ${getBrandContext(ctx.dealership)} Professional advertising design, crisp legible text. ${ctx.cta ? `Call to action: "${ctx.cta}".` : ""}`;
  },

  "new-arrival": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "new vehicle";
    return `Professional automotive "Just Arrived" announcement graphic, ${getChannelFormatting(ctx.channel)}. Exciting new arrival post featuring a ${vehicleDesc}. ${ctx.headline ? `Headline: "${ctx.headline}".` : 'Bold "JUST ARRIVED" text.'} ${vehicle?.price ? `Price: $${vehicle.price.toLocaleString()}.` : ""} Style: ${ctx.style}, fresh and exciting. ${getBrandContext(ctx.dealership)} Modern, clean layout with premium feel. Sharp, legible text. Professional automotive photography.`;
  },

  "price-drop": (ctx) => {
    const vehicle = ctx.vehicle;
    const vehicleDesc = vehicle ? getVehicleDescription(vehicle) : "select vehicle";
    return `Urgent "PRICE REDUCED" automotive promotional graphic, ${getChannelFormatting(ctx.channel)}. Eye-catching price drop alert for a ${vehicleDesc}. ${ctx.headline ? `Headline: "${ctx.headline}".` : 'Bold "PRICE REDUCED!" text.'} ${ctx.offer_details ? `New price details: "${ctx.offer_details}".` : ""} Style: ${ctx.style}, urgent, attention-grabbing with bold typography. ${getBrandContext(ctx.dealership)} Include visual price comparison element. Professional design, crisp legible text.`;
  },

  "inventory-showcase": (ctx) => {
    return `Professional automotive inventory showcase graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Headline: "${ctx.headline}".` : `"Browse Our Inventory" at ${ctx.dealership.name}.`} Multi-vehicle display showing a variety of quality vehicles. Style: ${ctx.style}, organized, visually appealing grid or collage layout. ${getBrandContext(ctx.dealership)} Clean, modern design. Each vehicle clearly visible. Professional automotive photography, well-lit, showroom quality.`;
  },

  "brand-post": (ctx) => {
    return `Professional dealership brand awareness post, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Message: "${ctx.headline}".` : `Showcase ${ctx.dealership.name} as a trusted automotive destination.`} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} Style: ${ctx.style}, warm, professional, trustworthy. ${getBrandContext(ctx.dealership)} Show a welcoming dealership environment. Community-focused, people-oriented feel. Professional photography, premium quality.`;
  },

  testimonial: (ctx) => {
    return `Customer testimonial spotlight graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.testimonial_text ? `Customer quote: "${ctx.testimonial_text}"` : "Positive customer review highlight"}${ctx.testimonial_author ? ` — ${ctx.testimonial_author}` : ""}. ${ctx.rating ? `${ctx.rating} out of 5 stars rating display.` : "5-star rating display."} Style: ${ctx.style}, trustworthy, authentic. ${getBrandContext(ctx.dealership)} Clean design with quote styling. Include star rating visual element. Professional, credible layout.`;
  },

  "service-promo": (ctx) => {
    return `Professional automotive service department promotional graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.dealership.name} Service Center special offer. ${ctx.service_offer ? `Headline: "${ctx.service_offer}".` : ctx.headline ? `Headline: "${ctx.headline}".` : "Service special offer."} ${ctx.service_details ? `Details: "${ctx.service_details}".` : ""} Style: ${ctx.style}, clean, trustworthy design. ${getBrandContext(ctx.dealership)} Include automotive service imagery (tools, professional technician, vehicle on lift). Modern, clean layout with clear call-to-action. Legible text.`;
  },

  financing: (ctx) => {
    return `Automotive financing and offer highlight graphic, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Bold headline: "${ctx.headline}".` : '"Special Financing Available".'} ${ctx.offer_details ? `Offer details: "${ctx.offer_details}".` : ""} ${ctx.vehicle ? `Featured vehicle: ${getVehicleDescription(ctx.vehicle)}.` : ""} Style: ${ctx.style}, bold, clear, trustworthy. ${getBrandContext(ctx.dealership)} Professional financial services feel. Large, legible numbers and text. Clear call-to-action. ${ctx.cta ? `CTA: "${ctx.cta}".` : ""}`;
  },

  holiday: (ctx) => {
    return `Branded holiday greeting post for automotive dealership, ${getChannelFormatting(ctx.channel)}. ${ctx.headline ? `Message: "${ctx.headline}".` : "Warm holiday greeting."} ${ctx.subheadline ? `Subtext: "${ctx.subheadline}".` : ""} Style: ${ctx.style}, festive, warm, on-brand. ${getBrandContext(ctx.dealership)} Tasteful holiday themed design that incorporates dealership branding. Professional, polished, celebratory mood. Elegant typography.`;
  },

  custom: (ctx) => {
    return `${ctx.custom_prompt || ctx.headline || "Professional automotive marketing visual"}. ${getChannelFormatting(ctx.channel)}. Style: ${ctx.style}. ${getBrandContext(ctx.dealership)} Professional quality, crisp legible text, modern design.`;
  },
};

export function buildPrompt(context: PromptContext): string {
  const template = TEMPLATES[context.content_type];
  if (!template) {
    return TEMPLATES.custom(context);
  }
  return template(context).replace(/\s+/g, " ").trim();
}

export function getAspectRatioForChannel(channelId: string): string {
  const channel = CHANNEL_PRESETS.find((c) => c.id === channelId);
  return channel?.aspectRatio || "1:1";
}

export function getResolutionForChannel(channelId: string): string {
  const channel = CHANNEL_PRESETS.find((c) => c.id === channelId);
  return channel?.resolution || "1K";
}
