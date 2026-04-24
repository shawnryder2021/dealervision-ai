import type { Dealership, Profile, Vehicle, GeneratedAsset } from "./types";

export const DEMO_DEALERSHIP: Dealership = {
  id: "demo-dealership-001",
  name: "Brown's Volkswagen",
  slug: "browns-volkswagen",
  logo_url: null,
  tagline: "Drive Something Extraordinary",
  brand_colors: {
    primary: "#003366",
    secondary: "#FFFFFF",
    accent: "#C0C0C0",
  },
  contact: {
    address: "575 Capital Dr, Charlottetown, PE C1E 0E7",
    phone: "(902) 628-6700",
    website: "https://www.brownsvw.ca",
    email: "info@brownsvw.ca",
    social: {
      instagram: "@brownsvw",
      facebook: "BrownsVolkswagen",
      x: "@brownsvw",
      youtube: "",
    },
  },
  style_preferences: {
    default_style: "photorealistic",
  },
  image_model: "openai-gpt-image-2",
  local_context: {
    inventory_type: "both",
    years_established: "serving PEI since 1985",
    communities_served: "Charlottetown, Summerside, Montague, Souris, and all of Prince Edward Island",
    landmarks: "near Confederation Bridge, Victoria Park, and downtown Charlottetown waterfront",
    personality: "family-owned, community-driven, trusted local dealership",
    specialties: "VW Certified Pre-Owned, EV and hybrid vehicles, bilingual English/French service",
    seasonal_notes: "Maritime winters with heavy snow and salt roads; busy summer tourist season on PEI",
    community_involvement: "proud sponsor of Charlottetown Islanders hockey and local PEI events",
    unique_selling_points: "Island's largest VW selection, free winter tire storage, loaner vehicles available",
  },
  webhook_config: {
    url: "",
    enabled: false,
    include_prompt: true,
    include_vehicle: true,
    include_dealership: true,
    include_user_email: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_PROFILE: Profile = {
  id: "demo-user-001",
  dealership_id: "demo-dealership-001",
  full_name: "Demo User",
  role: "owner",
  created_at: new Date().toISOString(),
};

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "demo-vehicle-001",
    dealership_id: "demo-dealership-001",
    year: 2025,
    make: "Volkswagen",
    model: "Atlas",
    trim: "SEL Premium",
    price: 42550,
    mileage: 12,
    vin: "1VWSA7A37LC000001",
    stock_number: "A12345",
    status: "featured",
    photos: [],
    tags: ["Spring Sale"],
    details: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-vehicle-002",
    dealership_id: "demo-dealership-001",
    year: 2025,
    make: "Volkswagen",
    model: "Taos",
    trim: "SE",
    price: 28995,
    mileage: 5,
    vin: "3VV4B7AX1SM000002",
    stock_number: "T67890",
    status: "available",
    photos: [],
    tags: [],
    details: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-vehicle-003",
    dealership_id: "demo-dealership-001",
    year: 2024,
    make: "Volkswagen",
    model: "ID.4",
    trim: "Pro S Plus",
    price: 45995,
    mileage: 3200,
    vin: "WVGKMPE20RP000003",
    stock_number: "E11223",
    status: "available",
    photos: [],
    tags: ["EV", "Featured"],
    details: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-vehicle-004",
    dealership_id: "demo-dealership-001",
    year: 2025,
    make: "Volkswagen",
    model: "Jetta",
    trim: "GLI Autobahn",
    price: 33990,
    mileage: 0,
    vin: "3VW8T7BU0SM000004",
    stock_number: "J44556",
    status: "coming_soon",
    photos: [],
    tags: ["New Arrival"],
    details: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEMO_ASSETS: GeneratedAsset[] = [
  {
    id: "demo-asset-001",
    dealership_id: "demo-dealership-001",
    created_by: "demo-user-001",
    vehicle_id: "demo-vehicle-001",
    content_type: "vehicle-spotlight",
    channel: "instagram-post",
    prompt: "Professional automotive photography, 1:1 format. Stunning hero shot of a 2025 Volkswagen Atlas SEL Premium.",
    image_url: null,
    storage_path: null,
    aspect_ratio: "1:1",
    resolution: "1K",
    kie_task_id: null,
    status: "completed",
    metadata: {},
    is_favorite: true,
    campaign: "Spring Sale 2026",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-asset-002",
    dealership_id: "demo-dealership-001",
    created_by: "demo-user-001",
    vehicle_id: null,
    content_type: "sales-event",
    channel: "facebook-cover",
    prompt: "Eye-catching automotive sales event promotional graphic for Memorial Day Blowout.",
    image_url: null,
    storage_path: null,
    aspect_ratio: "16:9",
    resolution: "2K",
    kie_task_id: null,
    status: "completed",
    metadata: {},
    is_favorite: false,
    campaign: "Memorial Day",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

/**
 * Returns true when the app should serve demo/localStorage data instead of
 * hitting Supabase. Demo mode is now **opt-in** via an explicit env var or a
 * `?demo` query param — missing/misconfigured Supabase credentials will throw
 * at init time rather than silently falling back (which previously hid real
 * configuration bugs in production).
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (new URLSearchParams(window.location.search).has("demo")) return true;
  return false;
}

/**
 * Asserts that either Supabase is configured OR demo mode is explicitly
 * enabled. Call once from the top of client entry points so misconfiguration
 * surfaces loudly instead of silently falling through to localStorage.
 */
export function assertRuntimeConfigured(): void {
  if (typeof window === "undefined") return;
  if (isDemoMode()) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url === "your_supabase_url") {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL in your environment, " +
        "or set NEXT_PUBLIC_DEMO_MODE=true to run in demo mode.",
    );
  }
}
