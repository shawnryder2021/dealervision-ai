/**
 * Activity Feed — tracks team actions across the app.
 * Stores events in localStorage for demo mode; Supabase for production.
 */

export interface ActivityEvent {
  id: string;
  dealership_id: string;
  user_id: string;
  user_name: string;
  action: ActivityAction;
  entity_type: "asset" | "vehicle" | "landing_page" | "settings" | "template";
  entity_id?: string;
  details: Record<string, string | number | boolean | null>;
  created_at: string;
}

export type ActivityAction =
  | "generated_image"
  | "edited_image"
  | "downloaded_image"
  | "favorited_image"
  | "deleted_image"
  | "added_vehicle"
  | "updated_vehicle"
  | "sold_vehicle"
  | "created_landing_page"
  | "published_landing_page"
  | "updated_settings"
  | "saved_template"
  | "swapped_background"
  | "ran_ab_test"
  | "tested_webhook"
  | "queued_publish"
  | "published_asset"
  | "failed_publish"
  | "retrying_publish";

const STORAGE_KEY = "dealeradgen_activity";
const MAX_EVENTS = 200;

export function getActivityEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultActivityEvents();
  } catch {
    return getDefaultActivityEvents();
  }
}

export function addActivityEvent(
  event: Omit<ActivityEvent, "id" | "created_at">
): ActivityEvent {
  const newEvent: ActivityEvent = {
    ...event,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  const events = getActivityEvents();
  events.unshift(newEvent);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return newEvent;
}

export function clearActivity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Readable labels for actions */
export const ACTION_LABELS: Record<ActivityAction, string> = {
  generated_image: "Generated an image",
  edited_image: "Edited an image",
  downloaded_image: "Downloaded an image",
  favorited_image: "Favorited an image",
  deleted_image: "Deleted an image",
  added_vehicle: "Added a vehicle",
  updated_vehicle: "Updated a vehicle",
  sold_vehicle: "Marked a vehicle as sold",
  created_landing_page: "Created a landing page",
  published_landing_page: "Published a landing page",
  updated_settings: "Updated settings",
  saved_template: "Saved a template",
  swapped_background: "Swapped a background",
  ran_ab_test: "Ran an A/B test",
  tested_webhook: "Tested webhook",
  queued_publish: "Queued a publish",
  published_asset: "Published an asset",
  failed_publish: "Publish failed",
  retrying_publish: "Retried publishing",
};

/** Emoji per action for the timeline */
export const ACTION_ICONS: Record<ActivityAction, string> = {
  generated_image: "🎨",
  edited_image: "✏️",
  downloaded_image: "⬇️",
  favorited_image: "⭐",
  deleted_image: "🗑️",
  added_vehicle: "🚗",
  updated_vehicle: "🔧",
  sold_vehicle: "🎉",
  created_landing_page: "📄",
  published_landing_page: "🚀",
  updated_settings: "⚙️",
  saved_template: "📋",
  swapped_background: "🖼️",
  ran_ab_test: "🧪",
  tested_webhook: "🔔",
  queued_publish: "🕒",
  published_asset: "📣",
  failed_publish: "⚠️",
  retrying_publish: "🔁",
};

/** Generate realistic demo activity events spread over the past 7 days */
function getDefaultActivityEvents(): ActivityEvent[] {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  const events: ActivityEvent[] = [
    {
      id: "act-demo-001",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "generated_image",
      entity_type: "asset",
      entity_id: "demo-asset-001",
      details: {
        content_type: "vehicle-spotlight",
        channel: "instagram-post",
        vehicle: "2025 Volkswagen Atlas SEL Premium",
        campaign: "Spring Sale 2026",
      },
      created_at: new Date(now - 2 * hour).toISOString(),
    },
    {
      id: "act-demo-002",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "favorited_image",
      entity_type: "asset",
      entity_id: "demo-asset-001",
      details: { content_type: "vehicle-spotlight" },
      created_at: new Date(now - 2 * hour + 60000).toISOString(),
    },
    {
      id: "act-demo-003",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-002",
      user_name: "Sarah Johnson",
      action: "generated_image",
      entity_type: "asset",
      entity_id: "demo-asset-002",
      details: {
        content_type: "sales-event",
        channel: "facebook-cover",
        campaign: "Memorial Day",
      },
      created_at: new Date(now - 5 * hour).toISOString(),
    },
    {
      id: "act-demo-004",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-002",
      user_name: "Sarah Johnson",
      action: "downloaded_image",
      entity_type: "asset",
      entity_id: "demo-asset-002",
      details: { content_type: "sales-event" },
      created_at: new Date(now - 5 * hour + 120000).toISOString(),
    },
    {
      id: "act-demo-005",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-003",
      user_name: "Mike Torres",
      action: "added_vehicle",
      entity_type: "vehicle",
      entity_id: "demo-vehicle-004",
      details: { vehicle: "2025 Volkswagen Jetta GLI Autobahn", price: 33990 },
      created_at: new Date(now - 1 * day).toISOString(),
    },
    {
      id: "act-demo-006",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "swapped_background",
      entity_type: "asset",
      details: { preset: "Showroom Floor", vehicle: "2025 Volkswagen Atlas" },
      created_at: new Date(now - 1 * day - 3 * hour).toISOString(),
    },
    {
      id: "act-demo-007",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-002",
      user_name: "Sarah Johnson",
      action: "ran_ab_test",
      entity_type: "asset",
      details: { variants: 3, winner: "Variant B — Dramatic lighting" },
      created_at: new Date(now - 2 * day).toISOString(),
    },
    {
      id: "act-demo-008",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "saved_template",
      entity_type: "template",
      details: { template_name: "Summer Sale IG Post" },
      created_at: new Date(now - 2 * day - 2 * hour).toISOString(),
    },
    {
      id: "act-demo-009",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-003",
      user_name: "Mike Torres",
      action: "sold_vehicle",
      entity_type: "vehicle",
      entity_id: "demo-vehicle-sold",
      details: { vehicle: "2024 Volkswagen Tiguan SE", price: 31500 },
      created_at: new Date(now - 3 * day).toISOString(),
    },
    {
      id: "act-demo-010",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "created_landing_page",
      entity_type: "landing_page",
      details: { page_title: "Spring Clearance Event", template: "Sales Event" },
      created_at: new Date(now - 3 * day - 4 * hour).toISOString(),
    },
    {
      id: "act-demo-011",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-002",
      user_name: "Sarah Johnson",
      action: "generated_image",
      entity_type: "asset",
      details: {
        content_type: "service-promo",
        channel: "instagram-post",
        campaign: "Spring Service",
      },
      created_at: new Date(now - 4 * day).toISOString(),
    },
    {
      id: "act-demo-012",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "updated_settings",
      entity_type: "settings",
      details: { section: "Webhook configuration" },
      created_at: new Date(now - 5 * day).toISOString(),
    },
    {
      id: "act-demo-013",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-003",
      user_name: "Mike Torres",
      action: "generated_image",
      entity_type: "asset",
      details: {
        content_type: "new-arrival",
        channel: "facebook-post",
        vehicle: "2025 Volkswagen Taos SE",
      },
      created_at: new Date(now - 5 * day - 6 * hour).toISOString(),
    },
    {
      id: "act-demo-014",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "published_landing_page",
      entity_type: "landing_page",
      details: { page_title: "Spring Clearance Event", slug: "spring-clearance" },
      created_at: new Date(now - 6 * day).toISOString(),
    },
    {
      id: "act-demo-015",
      dealership_id: "demo-dealership-001",
      user_id: "demo-user-002",
      user_name: "Sarah Johnson",
      action: "edited_image",
      entity_type: "asset",
      details: { content_type: "vehicle-spotlight", edit_type: "Text overlay added" },
      created_at: new Date(now - 6 * day - 3 * hour).toISOString(),
    },
  ];

  // Save to localStorage so future reads return the same data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage errors
  }

  return events;
}
