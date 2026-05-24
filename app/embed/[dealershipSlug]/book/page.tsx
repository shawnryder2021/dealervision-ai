import { notFound } from "next/navigation";
import { getWidgetDealership } from "@/lib/widgets/dealership";
import { BookingWidget } from "@/components/widgets/BookingWidget";

interface Props {
  params: Promise<{ dealershipSlug: string }>;
  searchParams: Promise<{ vehicle?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  return { title: dealership ? `Book a Test Drive — ${dealership.name}` : "Book a Test Drive" };
}

export default async function BookEmbedPage({ params, searchParams }: Props) {
  const { dealershipSlug } = await params;
  const { vehicle } = await searchParams;
  const dealership = await getWidgetDealership(dealershipSlug);
  if (!dealership) notFound();

  const settings = (dealership.widget_settings ?? {}) as { booking_enabled?: boolean };
  if (settings.booking_enabled === false) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Online booking isn&apos;t available right now.
      </div>
    );
  }

  return (
    <BookingWidget
      slug={dealership.slug}
      dealershipName={dealership.name}
      initialVehicleId={vehicle}
    />
  );
}
