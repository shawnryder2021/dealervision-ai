import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import {
  getActivityEvents as localGetEvents,
  addActivityEvent as localAddEvent,
} from "@/lib/activity";
import type { ActivityEvent, ActivityAction } from "@/lib/activity";

export type { ActivityEvent, ActivityAction };

export interface ActivityFilters {
  entityType?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function getActivityEvents(
  dealershipId: string,
  filters?: ActivityFilters
): Promise<ActivityEvent[]> {
  if (isDemoMode()) {
    let events = localGetEvents();
    if (filters?.entityType && filters.entityType !== "all") {
      events = events.filter((e) => e.entity_type === filters.entityType);
    }
    if (filters?.userId && filters.userId !== "all") {
      events = events.filter((e) => e.user_id === filters.userId);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 30;
    return events.slice(offset, offset + limit);
  }
  const supabase = createClient();
  let query = supabase
    .from("activity_events")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });

  if (filters?.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.userId && filters.userId !== "all") {
    query = query.eq("user_id", filters.userId);
  }
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 30;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityEvent[];
}

export async function logActivity(
  event: Omit<ActivityEvent, "id" | "created_at">
): Promise<void> {
  if (isDemoMode()) {
    localAddEvent(event);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("activity_events").insert({
    dealership_id: event.dealership_id,
    user_id: event.user_id,
    user_name: event.user_name,
    action: event.action,
    entity_type: event.entity_type,
    entity_id: event.entity_id ?? null,
    details: event.details,
  });
  // Fire-and-forget: don't throw on activity log failure
  if (error) console.warn("Activity log failed:", error.message);
}
