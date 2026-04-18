/**
 * Campaign Bundle Presets
 * Pre-defined multi-channel campaign configurations. Each preset defines
 * which content-type × channel combinations to generate in one click.
 */

export interface CampaignJob {
  content_type: string;
  channel: string;
}

export interface CampaignPreset {
  id: string;
  name: string;
  description: string;
  icon: string;          // emoji
  color: string;         // tailwind color class prefix (e.g. "amber")
  jobs: CampaignJob[];
  /** Which form fields are shown for this preset */
  fields: Array<"headline" | "event_name" | "event_dates" | "offer_details" | "service_offer" | "service_details" | "vehicle">;
  defaultHeadline?: string;
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: "end-of-month-sale",
    name: "End of Month Sale",
    description: "Full multi-channel push for your biggest sales event of the month",
    icon: "🏷️",
    color: "amber",
    fields: ["headline", "event_name", "event_dates", "offer_details", "vehicle"],
    defaultHeadline: "End of Month Blowout",
    jobs: [
      { content_type: "sales-event", channel: "instagram-post" },
      { content_type: "sales-event", channel: "instagram-story" },
      { content_type: "sales-event", channel: "facebook-post" },
      { content_type: "sales-event", channel: "facebook-cover" },
      { content_type: "sales-event", channel: "email-header" },
      { content_type: "sales-event", channel: "print-flyer" },
    ],
  },
  {
    id: "new-arrivals",
    name: "New Arrivals Week",
    description: "Announce fresh inventory across every channel at once",
    icon: "✨",
    color: "blue",
    fields: ["headline", "vehicle"],
    defaultHeadline: "Just Arrived",
    jobs: [
      { content_type: "new-arrival", channel: "instagram-post" },
      { content_type: "new-arrival", channel: "instagram-story" },
      { content_type: "new-arrival", channel: "facebook-post" },
      { content_type: "new-arrival", channel: "website-card" },
      { content_type: "new-arrival", channel: "google-business" },
    ],
  },
  {
    id: "service-special",
    name: "Service Special",
    description: "Drive service bay traffic with a coordinated promo push",
    icon: "🔧",
    color: "green",
    fields: ["headline", "service_offer", "service_details", "offer_details"],
    defaultHeadline: "Limited-Time Service Offer",
    jobs: [
      { content_type: "service-promo", channel: "instagram-post" },
      { content_type: "service-promo", channel: "facebook-post" },
      { content_type: "service-promo", channel: "email-header" },
      { content_type: "service-promo", channel: "google-business" },
      { content_type: "service-promo", channel: "website-card" },
    ],
  },
  {
    id: "holiday-promotion",
    name: "Holiday Promotion",
    description: "Seasonal greetings and promotional content for every platform",
    icon: "🎉",
    color: "red",
    fields: ["headline", "event_name", "event_dates", "offer_details"],
    defaultHeadline: "Holiday Sales Event",
    jobs: [
      { content_type: "holiday", channel: "instagram-post" },
      { content_type: "holiday", channel: "instagram-story" },
      { content_type: "holiday", channel: "facebook-post" },
      { content_type: "holiday", channel: "facebook-cover" },
      { content_type: "holiday", channel: "email-header" },
    ],
  },
  {
    id: "vehicle-feature",
    name: "Vehicle Feature",
    description: "Showcase one vehicle hero-style across all major channels",
    icon: "🚗",
    color: "purple",
    fields: ["headline", "vehicle", "offer_details"],
    defaultHeadline: "Featured Vehicle",
    jobs: [
      { content_type: "vehicle-spotlight", channel: "instagram-post" },
      { content_type: "vehicle-spotlight", channel: "instagram-story" },
      { content_type: "vehicle-spotlight", channel: "facebook-post" },
      { content_type: "vehicle-spotlight", channel: "website-hero" },
      { content_type: "vehicle-spotlight", channel: "print-poster" },
      { content_type: "vehicle-spotlight", channel: "youtube-thumbnail" },
    ],
  },
];

export const PRESET_COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-700",  border: "border-amber-500/30",  badge: "bg-amber-500/20 text-amber-700"  },
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-700",   border: "border-blue-500/30",   badge: "bg-blue-500/20 text-blue-700"   },
  green:  { bg: "bg-green-500/10",  text: "text-green-700",  border: "border-green-500/30",  badge: "bg-green-500/20 text-green-700"  },
  red:    { bg: "bg-red-500/10",    text: "text-red-700",    border: "border-red-500/30",    badge: "bg-red-500/20 text-red-700"    },
  purple: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-700" },
};
