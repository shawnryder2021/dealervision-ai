import { notFound } from "next/navigation";
import { ShowroomDisplay } from "@/components/showroom/ShowroomDisplay";
import { createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ dealershipSlug: string }>;
}

async function loadData(slug: string) {
  const supabase = await createServiceClient();
  const { data: dealership } = await supabase
    .from("dealerships")
    .select("id, name, slug, logo_url, tagline, brand_colors, contact")
    .eq("slug", slug)
    .maybeSingle();
  if (!dealership) return null;

  const { data: assets } = await supabase
    .from("generated_assets")
    .select("id, image_url, content_type, channel, headline, subheadline, vehicle_id, created_at")
    .eq("dealership_id", dealership.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, trim, price, mileage, photos, stock_number")
    .eq("dealership_id", dealership.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(20);

  return { dealership, assets: assets ?? [], vehicles: vehicles ?? [] };
}

export async function generateMetadata({ params }: Props) {
  const { dealershipSlug } = await params;
  const data = await loadData(dealershipSlug);
  if (!data) return { title: "Showroom Display" };
  return { title: `${data.dealership.name} — Showroom` };
}

export default async function ShowroomDisplayPage({ params }: Props) {
  const { dealershipSlug } = await params;
  const data = await loadData(dealershipSlug);
  if (!data) return notFound();
  return <ShowroomDisplay dealership={data.dealership} assets={data.assets} vehicles={data.vehicles} />;
}
