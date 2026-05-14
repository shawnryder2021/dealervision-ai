import type { Metadata } from "next";
import { generateMetadata, pageMetadata } from "@/lib/seo/metadata";
import { pricingSchema, generateJsonLd } from "@/lib/seo/schema";

export const metadata: Metadata = generateMetadata({
  title: pageMetadata.pricing.title,
  description: pageMetadata.pricing.description,
  openGraph: {
    type: "website",
    title: pageMetadata.pricing.title,
    description: pageMetadata.pricing.description,
  },
  twitter: {
    card: "summary_large_image",
    title: pageMetadata.pricing.title,
    description: pageMetadata.pricing.description,
  },
});

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Pricing Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJsonLd(pricingSchema),
        }}
      />
      {children}
    </>
  );
}
