import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { generateMetadata } from "@/lib/seo/metadata";
import { organizationSchema, softwareAppSchema, generateJsonLd } from "@/lib/seo/schema";
import { ChatWidget } from "@/components/chat-widget/chat-widget";
import "./globals.css";

export const metadata: Metadata = generateMetadata({
  description:
    "Generate professional marketing visuals, promotional materials, and branded content for your dealership in seconds with AI.",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemas = [organizationSchema, softwareAppSchema];

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Plausible Analytics */}
        <script
          data-host="https://shawnryder.site"
          data-dnt="false"
          src="https://shawnryder.site/js/script.js"
          id="ZwSg9rf6GA"
          async
          defer
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJsonLd(schemas),
          }}
        />

        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <ChatWidget />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
