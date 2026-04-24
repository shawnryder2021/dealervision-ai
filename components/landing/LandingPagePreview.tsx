"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import type { LandingPage } from "@/lib/landing-pages";

/** Landing page preview/render component used in both editor and public view */
export function LandingPagePreview({ page }: { page: LandingPage }) {
  const { primary, secondary, accent } = page.brand_colors;

  return (
    <div className="bg-white text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <div
        className="relative px-6 py-16 text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
          color: secondary,
        }}
      >
        <p className="text-sm font-medium uppercase tracking-widest opacity-80 mb-3">
          {page.dealership_name}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
          {page.headline || "Your Headline Here"}
        </h1>
        <p className="text-lg opacity-90 max-w-xl mx-auto mb-6">
          {page.subheadline || "Your subheadline goes here"}
        </p>
        {page.cta_text && (
          <button
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-base transition-transform hover:scale-105"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            {page.cta_text}
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Vehicle (if present) */}
      {page.vehicle && (
        <div className="px-6 py-10 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-1">
              Featured Vehicle
            </p>
            <h2 className="text-2xl font-bold mb-1">
              {page.vehicle.year} {page.vehicle.make} {page.vehicle.model}
            </h2>
            <p className="text-gray-600 mb-4">{page.vehicle.trim}</p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold" style={{ color: primary }}>
                  ${page.vehicle.price.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Mileage</p>
                <p className="text-lg font-bold">
                  {page.vehicle.mileage.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Stock #</p>
                <p className="text-lg font-bold">{page.vehicle.stock_number}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      {page.features.length > 0 && (
        <div className="px-6 py-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">
              {page.template === "service-special"
                ? "What's Included"
                : page.template === "financing-offer"
                ? "Financing Highlights"
                : "Why Choose This Deal"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {page.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {page.description && (
        <div className="px-6 py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {page.description}
            </p>
          </div>
        </div>
      )}

      {/* Contact Form (if enabled) */}
      {page.show_contact_form && (
        <div className="px-6 py-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">Get in Touch</h2>
            <form className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <textarea
                placeholder="Message"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-6 py-6 text-center text-sm text-white"
        style={{ backgroundColor: primary }}
      >
        <p className="mb-2 font-medium">{page.dealership_name}</p>
        {page.dealership_phone && <p>{page.dealership_phone}</p>}
        {page.dealership_address && <p className="text-xs opacity-80">{page.dealership_address}</p>}
        {page.dealership_website && (
          <p className="text-xs opacity-80">
            <a href={`https://${page.dealership_website}`} className="hover:underline">
              {page.dealership_website}
            </a>
          </p>
        )}
        <p className="mt-4 pt-4 border-t border-white border-opacity-20 text-[10px] opacity-60">
          Powered by DealerAdGen AI, developed by{" "}
          <a href="https://shawnryder.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Shawn Ryder Digital
          </a>
        </p>
      </div>
    </div>
  );
}
