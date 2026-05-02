"use client";

import { useEffect, useMemo, useState } from "react";

interface Vehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  price: number | null;
  mileage: number | null;
  photos: string[];
  stock_number: string | null;
}

interface Asset {
  id: string;
  image_url: string | null;
  headline: string | null;
  subheadline: string | null;
}

interface Dealership {
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  brand_colors: { primary?: string } | null;
  contact: { phone?: string; address?: string; website?: string } | null;
}

type Slide =
  | { kind: "asset"; data: Asset }
  | { kind: "vehicle"; data: Vehicle };

const SLIDE_DURATION_MS = 7000;

export function ShowroomDisplay({
  dealership,
  assets,
  vehicles,
}: {
  dealership: Dealership;
  assets: Asset[];
  vehicles: Vehicle[];
}) {
  const slides = useMemo<Slide[]>(() => {
    const a: Slide[] = assets.filter((x) => x.image_url).map((data) => ({ kind: "asset" as const, data }));
    const v: Slide[] = vehicles.filter((x) => x.photos?.[0]).map((data) => ({ kind: "vehicle" as const, data }));
    // Interleave: asset, vehicle, asset, vehicle…
    const out: Slide[] = [];
    const max = Math.max(a.length, v.length);
    for (let i = 0; i < max; i++) {
      if (a[i]) out.push(a[i]);
      if (v[i]) out.push(v[i]);
    }
    return out;
  }, [assets, vehicles]);

  const [index, setIndex] = useState(0);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_DURATION_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];
  const primary = dealership.brand_colors?.primary || "#0f172a";

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden">
      {slide ? (
        slide.kind === "asset" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.data.id}
            src={slide.data.image_url!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: "ken 7s ease-out forwards" }}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={slide.data.id}
              src={slide.data.photos[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ animation: "ken 7s ease-out forwards" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-24 left-12 right-12">
              <p className="text-sm uppercase tracking-[0.3em] opacity-80" style={{ color: primary }}>
                Available Now
              </p>
              <h2 className="text-6xl font-bold mt-2 leading-tight">
                {[slide.data.year, slide.data.make, slide.data.model].filter(Boolean).join(" ")}
              </h2>
              {slide.data.trim && <p className="text-2xl opacity-80 mt-1">{slide.data.trim}</p>}
              <div className="flex items-baseline gap-6 mt-6">
                {slide.data.price && (
                  <span className="text-5xl font-bold">${Number(slide.data.price).toLocaleString()}</span>
                )}
                {slide.data.mileage && (
                  <span className="text-xl opacity-70">{Number(slide.data.mileage).toLocaleString()} mi</span>
                )}
                {slide.data.stock_number && (
                  <span className="text-xl opacity-70">Stock #{slide.data.stock_number}</span>
                )}
              </div>
            </div>
          </>
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="opacity-60">No content yet — generate assets or add vehicles to populate.</p>
        </div>
      )}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-8 z-10">
        <div className="flex items-center gap-4">
          {dealership.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dealership.logo_url} alt={dealership.name} className="h-12" />
          ) : (
            <span className="text-2xl font-bold" style={{ color: primary }}>
              {dealership.name}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-sm opacity-70">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </header>

      {/* Footer */}
      <footer
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-12 py-4 z-10"
        style={{ background: `linear-gradient(to top, ${primary}cc, transparent)` }}
      >
        <p className="text-base font-semibold">
          {dealership.tagline || `Visit us at ${dealership.name}`}
        </p>
        <div className="flex items-center gap-6 text-sm opacity-80">
          {dealership.contact?.phone && <span>{dealership.contact.phone}</span>}
          {dealership.contact?.website && <span>{dealership.contact.website.replace(/^https?:\/\//, "")}</span>}
        </div>
      </footer>

      {/* Slide progress dots */}
      {slides.length > 1 && (
        <div className="absolute top-24 left-12 right-12 flex gap-1 opacity-50">
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full bg-white"
              style={{ opacity: i === index ? 1 : 0.3 }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes ken {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.08); }
        }
      `}</style>
    </main>
  );
}
