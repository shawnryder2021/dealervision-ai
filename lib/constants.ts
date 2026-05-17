export const CONTENT_TYPES = [
  {
    id: "vehicle-spotlight",
    name: "Vehicle Spotlight",
    description: "Single vehicle hero image with price, model, and features",
    icon: "Car",
  },
  {
    id: "sales-event",
    name: "Sales Event / Promo",
    description: "Seasonal sale banners and promotional graphics",
    icon: "Tag",
  },
  {
    id: "new-arrival",
    name: "New Arrival Announcement",
    description: '"Just Arrived" posts for new inventory',
    icon: "Sparkles",
  },
  {
    id: "price-drop",
    name: "Price Drop Alert",
    description: '"Price Reduced!" visuals to drive urgency',
    icon: "TrendingDown",
  },
  {
    id: "inventory-showcase",
    name: "Inventory Showcase",
    description: "Multi-vehicle collage or grid display",
    icon: "LayoutGrid",
  },
  {
    id: "brand-post",
    name: "Dealership Brand Post",
    description: "About the dealership, team, values, community",
    icon: "Building2",
  },
  {
    id: "testimonial",
    name: "Testimonial / Review",
    description: "Customer quote with star rating visual",
    icon: "Star",
  },
  {
    id: "service-promo",
    name: "Service & Parts Promo",
    description: "Oil change specials, tire deals, service coupons",
    icon: "Wrench",
  },
  {
    id: "financing",
    name: "Financing / Offer Highlight",
    description: '"$0 Down", "0% APR", lease specials',
    icon: "DollarSign",
  },
  {
    id: "holiday",
    name: "Holiday / Seasonal Greeting",
    description: "Branded holiday and seasonal posts",
    icon: "Gift",
  },
  {
    id: "blueprint-infographic",
    name: "Technical Blueprint",
    description: "Technical specification infographic with measurements, component labels, and architectural sketch aesthetics",
    icon: "LayoutGrid",
  },
  {
    id: "custom",
    name: "Custom Freeform",
    description: "Open prompt with brand overlay",
    icon: "Paintbrush",
  },
] as const;

export type ContentTypeId = (typeof CONTENT_TYPES)[number]["id"];

export const CHANNEL_PRESETS = [
  { id: "instagram-post", name: "Instagram Post", aspectRatio: "1:1", resolution: "1K", icon: "Instagram" },
  { id: "instagram-story", name: "Instagram Story / Reel", aspectRatio: "9:16", resolution: "1K", icon: "Instagram" },
  { id: "facebook-post", name: "Facebook Post", aspectRatio: "4:5", resolution: "1K", icon: "Facebook" },
  { id: "facebook-cover", name: "Facebook Cover", aspectRatio: "16:9", resolution: "2K", icon: "Facebook" },
  { id: "x-post", name: "X (Twitter) Post", aspectRatio: "16:9", resolution: "1K", icon: "Twitter" },
  { id: "website-hero", name: "Website Hero Banner", aspectRatio: "21:9", resolution: "2K", icon: "Globe" },
  { id: "website-card", name: "Website Inventory Card", aspectRatio: "4:3", resolution: "1K", icon: "Globe" },
  { id: "print-flyer", name: "Print Flyer (Letter)", aspectRatio: "3:4", resolution: "4K", icon: "FileText" },
  { id: "print-poster", name: "Print Poster (Tabloid)", aspectRatio: "2:3", resolution: "4K", icon: "FileText" },
  { id: "email-header", name: "Email Header", aspectRatio: "16:9", resolution: "1K", icon: "Mail" },
  { id: "google-business", name: "Google Business Post", aspectRatio: "4:3", resolution: "1K", icon: "MapPin" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", aspectRatio: "16:9", resolution: "1K", icon: "Youtube" },
  { id: "digital-billboard", name: "Digital Billboard", aspectRatio: "16:9", resolution: "4K", icon: "Monitor" },
] as const;

export type ChannelId = (typeof CHANNEL_PRESETS)[number]["id"];

export const ASPECT_RATIOS = [
  "1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5",
  "5:4", "8:1", "9:16", "16:9", "21:9", "auto",
] as const;

export const RESOLUTIONS = ["1K", "2K", "4K"] as const;

export const STYLE_OPTIONS = [
  { id: "photorealistic", name: "Photorealistic", description: "Clean, professional automotive photography" },
  { id: "bold-graphic", name: "Bold Graphic", description: "High-energy, eye-catching graphic design" },
  { id: "minimalist", name: "Minimalist", description: "Clean lines, lots of white space" },
  { id: "luxury", name: "Luxury", description: "Premium, elegant, high-end feel" },
  { id: "sporty", name: "Sporty", description: "Dynamic, aggressive, performance-oriented" },
  { id: "retro", name: "Retro", description: "Vintage, nostalgic automotive style" },
  { id: "modern", name: "Modern", description: "Contemporary, sleek, tech-forward" },
  { id: "warm-friendly", name: "Warm & Friendly", description: "Approachable, family-oriented feel" },
] as const;

export const VEHICLE_STATUSES = ["available", "sold", "coming_soon", "featured"] as const;

export const USER_ROLES = ["owner", "admin", "member"] as const;

export const RESOLUTION_COSTS: Record<string, number> = {
  "1K": 0.04,
  "2K": 0.06,
  "4K": 0.09,
};
