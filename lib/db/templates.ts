import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import {
  getTemplates as localGetTemplates,
  saveTemplate as localSaveTemplate,
  deleteTemplate as localDeleteTemplate,
  recordTemplateUse as localRecordUse,
} from "@/lib/templates";
import type { Template } from "@/lib/templates";

export type { Template };

export async function getTemplates(dealershipId: string): Promise<Template[]> {
  if (isDemoMode()) {
    return localGetTemplates();
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Map DB snake_case to TS camelCase
  return (data ?? []).map(dbToTemplate);
}

export async function saveTemplate(
  dealershipId: string,
  template: Omit<Template, "id" | "createdAt" | "usedCount">
): Promise<Template> {
  if (isDemoMode()) {
    return localSaveTemplate(template);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("templates")
    .insert({
      dealership_id: dealershipId,
      name: template.name,
      description: template.description,
      content_type: template.contentType,
      channel: template.channel,
      style: template.style,
      headline: template.headline ?? null,
      subheadline: template.subheadline ?? null,
      cta: template.cta ?? null,
      event_name: template.eventName ?? null,
      event_dates: template.eventDates ?? null,
      offer_details: template.offerDetails ?? null,
      service_offer: template.serviceOffer ?? null,
      service_details: template.serviceDetails ?? null,
      custom_prompt: template.customPrompt ?? null,
      campaign: template.campaign ?? null,
      used_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return dbToTemplate(data);
}

export async function deleteTemplate(
  dealershipId: string,
  id: string
): Promise<void> {
  if (isDemoMode()) {
    localDeleteTemplate(id);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("dealership_id", dealershipId);
  if (error) throw error;
}

export async function recordTemplateUse(
  dealershipId: string,
  id: string
): Promise<void> {
  if (isDemoMode()) {
    localRecordUse(id);
    return;
  }
  const supabase = createClient();
  // Increment used_count
  await supabase.rpc("increment_template_use", { template_id: id }).then(() => {
    // Fallback if RPC doesn't exist: just update last_used
    supabase
      .from("templates")
      .update({ last_used: new Date().toISOString() })
      .eq("id", id)
      .eq("dealership_id", dealershipId);
  });
}

function dbToTemplate(row: Record<string, unknown>): Template {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    contentType: row.content_type as string,
    channel: row.channel as string,
    style: row.style as string,
    headline: (row.headline as string) ?? undefined,
    subheadline: (row.subheadline as string) ?? undefined,
    cta: (row.cta as string) ?? undefined,
    eventName: (row.event_name as string) ?? undefined,
    eventDates: (row.event_dates as string) ?? undefined,
    offerDetails: (row.offer_details as string) ?? undefined,
    serviceOffer: (row.service_offer as string) ?? undefined,
    serviceDetails: (row.service_details as string) ?? undefined,
    customPrompt: (row.custom_prompt as string) ?? undefined,
    campaign: (row.campaign as string) ?? undefined,
    createdAt: row.created_at as string,
    usedCount: (row.used_count as number) ?? 0,
    lastUsed: (row.last_used as string) ?? undefined,
  };
}
