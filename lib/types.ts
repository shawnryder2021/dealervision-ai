export interface Dealership {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  contact: {
    address?: string;
    phone?: string;
    website?: string;
    email?: string;
    social?: {
      instagram?: string;
      facebook?: string;
      x?: string;
      youtube?: string;
    };
  };
  style_preferences: {
    default_style?: string;
    font_preference?: string;
  };
  local_context?: {
    inventory_type?: "new" | "used" | "both";
    manufacturer_brand?: string;
    years_established?: string;
    communities_served?: string;
    landmarks?: string;
    personality?: string;
    specialties?: string;
    seasonal_notes?: string;
    community_involvement?: string;
    unique_selling_points?: string;
  };
  webhook_config?: {
    url: string;
    enabled: boolean;
    include_prompt: boolean;
    include_vehicle: boolean;
    include_dealership: boolean;
    include_user_email: boolean;
    secret?: string;
  };
  /** Per-dealership override. Null means "use platform default" (`platform_settings.default_image_model`). */
  image_model: "kie-nano-banana" | "openai-gpt-image-2" | null;
  oem_brand?: string | null;
  state_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  dealership_id: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface Vehicle {
  id: string;
  dealership_id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  price: number | null;
  mileage: number | null;
  vin: string | null;
  stock_number: string | null;
  status: "available" | "sold" | "coming_soon" | "featured";
  photos: string[];
  tags: string[];
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GeneratedAsset {
  id: string;
  dealership_id: string;
  created_by: string | null;
  vehicle_id: string | null;
  content_type: string;
  channel: string;
  prompt: string;
  image_url: string | null;
  storage_path: string | null;
  aspect_ratio: string | null;
  resolution: string | null;
  kie_task_id: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  campaign: string | null;
  created_at: string;
}

export interface UsageLog {
  id: string;
  dealership_id: string;
  asset_id: string | null;
  action: string;
  credits_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GenerateRequest {
  content_type: string;
  channel: string;
  vehicle_id?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  style: string;
  custom_prompt?: string;
  event_name?: string;
  event_dates?: string;
  offer_details?: string;
  service_offer?: string;
  service_details?: string;
  testimonial_text?: string;
  testimonial_author?: string;
  rating?: number;
  campaign?: string;
  include_vehicle_year?: string;
  include_vehicle_model?: string;
  scene_location?: string;
  /** Reference image URLs (user-uploaded photos). Logo URL is added automatically server-side. */
  image_input?: string[];
  /** Inline vehicle data when the user picked a "preset:" common model not in their DB. */
  inline_vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
  };
}

export interface KieCreateTaskResponse {
  taskId: string;
  status: string;
}

export interface KieTaskResult {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: {
    image_url?: string;
  };
  error?: string;
}
