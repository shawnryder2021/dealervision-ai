import { notFound } from "next/navigation";
import { getPublicLandingPage } from "@/lib/db/landing-pages";
import { LandingPagePreview } from "@/components/landing/LandingPagePreview";

interface Props {
  params: Promise<{ dealershipSlug: string; pageSlug: string }>;
}

/**
 * Public landing page route
 * Allows anyone to view published landing pages via /landing/[dealershipSlug]/[pageSlug]
 */
export default async function PublicLandingPage({ params }: Props) {
  const { dealershipSlug, pageSlug } = await params;

  // Fetch the published landing page
  const page = await getPublicLandingPage(dealershipSlug, pageSlug);

  if (!page) {
    return notFound();
  }

  return (
    <div className="min-h-screen">
      <LandingPagePreview page={page} />
    </div>
  );
}

/**
 * Generate static metadata for the page
 */
export async function generateMetadata({ params }: Props) {
  const { dealershipSlug, pageSlug } = await params;
  const page = await getPublicLandingPage(dealershipSlug, pageSlug);

  if (!page) {
    return {
      title: "Page Not Found",
      description: "This landing page is no longer available.",
    };
  }

  return {
    title: page.headline,
    description: page.subheadline || page.description || page.dealership_name,
    openGraph: {
      title: page.headline,
      description: page.subheadline || page.description,
      type: "website",
      url: `/landing/${dealershipSlug}/${pageSlug}`,
    },
  };
}
