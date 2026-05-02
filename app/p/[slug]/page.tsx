"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  CheckCircle2,
  Phone,
  MapPin,
  Globe,
  Loader2,
} from "lucide-react";
import { getLandingPage, type LandingPage } from "@/lib/landing-pages";

export default function PublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const found = getLandingPage(slug);
      if (found && found.status === "published") {
        setPage(found);
        setNotFound(false);
      } else {
        setPage(null);
        setNotFound(true);
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">
          This landing page doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  const { primary, secondary, accent } = page.brand_colors;

  return (
    <div
      className="min-h-screen bg-white text-gray-900"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Hero */}
      <header
        className="relative px-6 py-20 md:py-28 text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
          color: secondary,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-80 mb-4">
            {page.dealership_name}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {page.headline}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            {page.subheadline}
          </p>
          {page.cta_text && (
            <a
              href={page.cta_link || "#contact"}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              {page.cta_text}
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </header>

      {/* Vehicle showcase */}
      {page.vehicle && (
        <section className="px-6 py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: accent }}
            >
              Featured Vehicle
            </p>
            <h2 className="text-3xl font-bold mb-2">
              {page.vehicle.year} {page.vehicle.make} {page.vehicle.model}
            </h2>
            <p className="text-gray-500 text-lg mb-8">{page.vehicle.trim}</p>

            {page.vehicle.image_url && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={page.vehicle.image_url}
                  alt={`${page.vehicle.year} ${page.vehicle.make} ${page.vehicle.model}`}
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-xs text-gray-500 mb-1">Starting At</p>
                <p className="text-2xl font-bold" style={{ color: primary }}>
                  ${page.vehicle.price.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-xs text-gray-500 mb-1">Mileage</p>
                <p className="text-2xl font-bold">
                  {page.vehicle.mileage.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-xs text-gray-500 mb-1">Stock #</p>
                <p className="text-2xl font-bold">{page.vehicle.stock_number}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-xs text-gray-500 mb-1">VIN</p>
                <p className="text-sm font-mono font-bold truncate">
                  {page.vehicle.vin}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {page.features.length > 0 && (
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              {page.template === "service-special"
                ? "What's Included"
                : page.template === "financing-offer"
                ? "Financing Highlights"
                : page.template === "vehicle-showcase"
                ? "Vehicle Highlights"
                : "Why This Deal"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle2
                    className="h-6 w-6 shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <p className="text-base">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {page.description && (
        <section className="px-6 py-12 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
              {page.description}
            </p>
          </div>
        </section>
      )}

      {/* CTA banner */}
      {page.cta_text && (
        <section
          className="px-6 py-12 text-center"
          style={{ backgroundColor: `${accent}15` }}
        >
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <a
            href={page.cta_link || "#contact"}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-all hover:scale-105"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            {page.cta_text}
          </a>
        </section>
      )}

      {/* Contact form */}
      {page.show_contact_form && (
        <section id="contact" className="px-6 py-16">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Get in Touch
            </h2>
            <p className="text-gray-500 text-center mb-8">
              Fill out the form below and we&apos;ll get back to you within 24 hours
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you! We'll be in touch soon.");
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                  style={{ ["--tw-ring-color" as string]: primary }}
                  placeholder="First Name"
                  required
                />
                <input
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                  placeholder="Last Name"
                  required
                />
              </div>
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                placeholder="Email Address"
                type="email"
                required
              />
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                placeholder="Phone Number"
                type="tel"
              />
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                placeholder="How can we help you?"
                rows={4}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white text-base transition-all hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Map / Directions */}
      {page.show_map && (page.dealership_address || page.dealership_phone) && (
        <section className="px-6 py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Visit Us</h2>
            <div className="bg-gray-200 rounded-xl h-56 flex items-center justify-center mb-6 overflow-hidden">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{page.dealership_address}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              {page.dealership_address && (
                <span className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" style={{ color: primary }} />
                  {page.dealership_address}
                </span>
              )}
              {page.dealership_phone && (
                <a
                  href={`tel:${page.dealership_phone}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Phone className="h-4 w-4" style={{ color: primary }} />
                  {page.dealership_phone}
                </a>
              )}
              {page.dealership_website && (
                <a
                  href={page.dealership_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Globe className="h-4 w-4" style={{ color: primary }} />
                  Website
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center"
        style={{ backgroundColor: primary, color: `${secondary}cc` }}
      >
        <p className="font-semibold text-lg" style={{ color: secondary }}>
          {page.dealership_name}
        </p>
        {page.dealership_address && (
          <p className="mt-2 text-sm opacity-60">{page.dealership_address}</p>
        )}
        {page.dealership_phone && (
          <p className="mt-1 text-sm opacity-60">{page.dealership_phone}</p>
        )}
        <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
          <p className="text-xs opacity-30">
            Powered by DealerAdGen AI
          </p>
          <p className="text-xs opacity-20">
            Developed by{" "}
            <Link
              href="https://shawnryder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              Shawn Ryder Digital
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
