import { notFound } from "next/navigation";
import { getWidgetDealership } from "@/lib/widgets/dealership";

interface Props {
  children: React.ReactNode;
  params: Promise<{ dealershipSlug: string }>;
}

/**
 * Chrome-less layout for embeddable conversion widgets.
 * Renders inside a cross-origin iframe on the dealer's own site, so it:
 *  - drops all dashboard/marketing chrome
 *  - applies the dealership's brand colors as CSS variables
 *  - stays on a transparent-friendly, light surface for predictable embedding
 */
export default async function EmbedLayout({ children, params }: Props) {
  const { dealershipSlug } = await params;
  const dealership = await getWidgetDealership(dealershipSlug);
  if (!dealership) notFound();

  const colors = dealership.brand_colors ?? {};
  const primary = colors.primary || "#0f172a";
  const secondary = colors.secondary || "#334155";
  const accent = colors.accent || primary;

  return (
    <div
      className="dv-embed min-h-screen w-full bg-transparent text-slate-900"
      style={
        {
          "--dv-primary": primary,
          "--dv-secondary": secondary,
          "--dv-accent": accent,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
