import { notFound } from "next/navigation";
import { getWidgetDealership } from "@/lib/widgets/dealership";
import { DealerChatWidget } from "@/components/widgets/DealerChatWidget";

interface Props {
  params: Promise<{ dealershipSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  return { title: dealership ? `Chat — ${dealership.name}` : "Chat" };
}

export default async function ChatEmbedPage({ params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  if (!dealership) notFound();

  const settings = (dealership.widget_settings ?? {}) as { chat_enabled?: boolean; chat_greeting?: string };
  if (settings.chat_enabled === false) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">Chat isn&apos;t available right now.</div>
    );
  }

  return (
    <DealerChatWidget
      slug={dealership.slug}
      dealershipId={dealership.id}
      dealershipName={dealership.name}
      greeting={settings.chat_greeting}
    />
  );
}
