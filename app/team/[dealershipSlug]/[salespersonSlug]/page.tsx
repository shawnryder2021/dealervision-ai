import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, Car, Globe } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ dealershipSlug: string; salespersonSlug: string }>;
}

async function loadData(dealershipSlug: string, salespersonSlug: string) {
  const supabase = await createServiceClient();
  const { data: dealership } = await supabase
    .from("dealerships")
    .select("id, name, slug, logo_url, tagline, brand_colors, contact")
    .eq("slug", dealershipSlug)
    .maybeSingle();
  if (!dealership) return null;

  const { data: salesperson } = await supabase
    .from("salespeople")
    .select("*")
    .eq("dealership_id", dealership.id)
    .eq("slug", salespersonSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!salesperson) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, trim, price, mileage, photos, stock_number")
    .eq("dealership_id", dealership.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(12);

  return { dealership, salesperson, vehicles: vehicles ?? [] };
}

export async function generateMetadata({ params }: Props) {
  const { dealershipSlug, salespersonSlug } = await params;
  const data = await loadData(dealershipSlug, salespersonSlug);
  if (!data) return { title: "Not found" };
  return {
    title: `${data.salesperson.full_name} — ${data.dealership.name}`,
    description: data.salesperson.bio?.slice(0, 160) || `Contact ${data.salesperson.full_name} at ${data.dealership.name}.`,
  };
}

export default async function SalespersonPage({ params }: Props) {
  const { dealershipSlug, salespersonSlug } = await params;
  const data = await loadData(dealershipSlug, salespersonSlug);
  if (!data) return notFound();

  const { dealership, salesperson, vehicles } = data;
  const primary = (dealership.brand_colors as { primary?: string } | null)?.primary || "#0f172a";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b" style={{ borderColor: `${primary}33` }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {dealership.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dealership.logo_url} alt={dealership.name} className="h-8" />
            ) : (
              <span className="font-bold" style={{ color: primary }}>
                {dealership.name}
              </span>
            )}
          </Link>
          {(dealership.contact as { phone?: string })?.phone && (
            <a
              href={`tel:${(dealership.contact as { phone?: string }).phone}`}
              className="text-sm font-medium hover:underline"
              style={{ color: primary }}
            >
              {(dealership.contact as { phone?: string }).phone}
            </a>
          )}
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {salesperson.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={salesperson.photo_url}
              alt={salesperson.full_name}
              className="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover shrink-0"
              style={{ boxShadow: `0 0 0 4px ${primary}22` }}
            />
          ) : (
            <div
              className="w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${primary}15`, color: primary }}
            >
              <span className="text-5xl font-bold">{salesperson.full_name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{salesperson.full_name}</h1>
            {salesperson.title && (
              <p className="text-lg text-muted-foreground mt-1">
                {salesperson.title} · {dealership.name}
              </p>
            )}
            {salesperson.bio && <p className="mt-5 text-base leading-relaxed">{salesperson.bio}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              {salesperson.phone && (
                <a
                  href={`tel:${salesperson.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white"
                  style={{ background: primary }}
                >
                  <Phone className="h-4 w-4" /> Call {salesperson.phone}
                </a>
              )}
              {salesperson.email && (
                <a
                  href={`mailto:${salesperson.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium border"
                  style={{ borderColor: primary, color: primary }}
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>

            {(salesperson.specialties?.length ?? 0) + (salesperson.languages?.length ?? 0) > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {salesperson.years_experience && (
                  <span className="px-2 py-1 bg-muted rounded">{salesperson.years_experience}+ yrs experience</span>
                )}
                {salesperson.specialties?.map((s: string) => (
                  <span key={s} className="px-2 py-1 bg-muted rounded">
                    {s}
                  </span>
                ))}
                {salesperson.languages?.map((l: string) => (
                  <span key={l} className="px-2 py-1 bg-muted rounded">
                    🗣 {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {vehicles.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Car className="h-6 w-6" style={{ color: primary }} />
            Available now at {dealership.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="border rounded-lg overflow-hidden">
                {v.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photos[0]} alt="" className="aspect-video object-cover w-full" />
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Car className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.trim}</p>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    {v.price && <span className="font-bold">${Number(v.price).toLocaleString()}</span>}
                    {v.mileage && <span className="text-muted-foreground">{Number(v.mileage).toLocaleString()} mi</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-wrap gap-4 items-center">
          {(dealership.contact as { address?: string })?.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {(dealership.contact as { address?: string }).address}
            </span>
          )}
          {(dealership.contact as { website?: string })?.website && (
            <a
              href={(dealership.contact as { website?: string }).website}
              className="flex items-center gap-1 hover:underline"
            >
              <Globe className="h-3 w-3" /> {(dealership.contact as { website?: string }).website}
            </a>
          )}
        </div>
      </footer>
    </main>
  );
}
