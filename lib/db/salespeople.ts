import { createClient } from "@/lib/supabase/client";

export interface Salesperson {
  id: string;
  dealership_id: string;
  slug: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
  years_experience: number | null;
  languages: string[];
  specialties: string[];
  social: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SalespersonInput = Omit<Salesperson, "id" | "created_at" | "updated_at">;

export async function listSalespeople(dealershipId: string): Promise<Salesperson[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salespeople")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Salesperson[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}
