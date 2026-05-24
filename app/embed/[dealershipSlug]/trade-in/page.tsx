import { notFound } from "next/navigation";
import { getWidgetDealership } from "@/lib/widgets/dealership";
import { TradeInWidget } from "@/components/widgets/TradeInWidget";

interface Props {
  params: Promise<{ dealershipSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  return { title: dealership ? `Trade-In Estimate — ${dealership.name}` : "Trade-In Estimate" };
}

export default async function TradeInEmbedPage({ params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  if (!dealership) notFound();

  const settings = (dealership.widget_settings ?? {}) as { trade_in_enabled?: boolean };
  if (settings.trade_in_enabled === false) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        This tool isn&apos;t available right now.
      </div>
    );
  }

  return <TradeInWidget dealershipId={dealership.id} dealershipName={dealership.name} />;
}
