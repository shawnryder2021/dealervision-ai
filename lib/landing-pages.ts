/**
 * Landing Page Generator — create promotional landing pages
 * for sales events, featured vehicles, or service specials.
 * Stores pages in localStorage for demo; Supabase for production.
 */

export interface LandingPage {
  id: string;
  dealership_id: string;
  slug: string;
  title: string;
  template: LandingPageTemplate;
  status: "draft" | "published";
  hero_image_url: string | null;
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  description: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  dealership_name: string;
  dealership_phone: string;
  dealership_address: string;
  dealership_website: string;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    trim: string;
    price: number;
    mileage: number;
    vin: string;
    stock_number: string;
    image_url?: string;
  };
  features: string[];
  show_contact_form: boolean;
  show_map: boolean;
  custom_css: string;
  created_at: string;
  updated_at: string;
}

export type LandingPageTemplate =
  | "vehicle-showcase"
  | "sales-event"
  | "service-special"
  | "new-arrivals"
  | "financing-offer";

export const LANDING_PAGE_TEMPLATES: {
  id: LandingPageTemplate;
  name: string;
  description: string;
  emoji: string;
  defaultHeadline: string;
  defaultSubheadline: string;
  defaultCta: string;
  defaultFeatures: string[];
}[] = [
  {
    id: "vehicle-showcase",
    name: "Vehicle Showcase",
    description: "Feature a single vehicle with specs, photos, and pricing",
    emoji: "🚗",
    defaultHeadline: "Meet the All-New [Vehicle]",
    defaultSubheadline: "Experience luxury, performance, and innovation",
    defaultCta: "Schedule a Test Drive",
    defaultFeatures: [
      "Full vehicle specifications",
      "360° photo gallery",
      "Competitive pricing",
      "Trade-in estimator",
    ],
  },
  {
    id: "sales-event",
    name: "Sales Event",
    description: "Promote seasonal sales, clearance events, or special offers",
    emoji: "🏷️",
    defaultHeadline: "Spring Clearance Event",
    defaultSubheadline: "Save thousands on select models — this weekend only",
    defaultCta: "View Deals",
    defaultFeatures: [
      "Up to $5,000 off MSRP",
      "0% APR financing available",
      "Free maintenance package",
      "Extended warranty included",
    ],
  },
  {
    id: "service-special",
    name: "Service Special",
    description: "Promote service department deals and seasonal maintenance",
    emoji: "🔧",
    defaultHeadline: "Spring Service Special",
    defaultSubheadline: "Keep your vehicle running at its best",
    defaultCta: "Book Appointment",
    defaultFeatures: [
      "Oil change & tire rotation",
      "Multi-point inspection",
      "Battery & brake check",
      "Complimentary car wash",
    ],
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Showcase newly arrived inventory to drive foot traffic",
    emoji: "✨",
    defaultHeadline: "Just Arrived",
    defaultSubheadline: "Be the first to see our newest inventory",
    defaultCta: "Browse New Arrivals",
    defaultFeatures: [
      "Latest models in stock",
      "Multiple trims & colors",
      "Exclusive first-look pricing",
      "Priority test drive booking",
    ],
  },
  {
    id: "financing-offer",
    name: "Financing Offer",
    description: "Highlight special financing rates, lease deals, or incentives",
    emoji: "💰",
    defaultHeadline: "Drive for Less",
    defaultSubheadline: "Special financing on select models",
    defaultCta: "Get Pre-Approved",
    defaultFeatures: [
      "Rates as low as 0.9% APR",
      "No money down options",
      "Flexible lease terms",
      "Quick online approval",
    ],
  },
];

const STORAGE_KEY = "dealeradgen_landing_pages";

export function getLandingPages(): LandingPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultLandingPages();
  } catch {
    return getDefaultLandingPages();
  }
}

export function getLandingPage(idOrSlug: string): LandingPage | null {
  const pages = getLandingPages();
  return (
    pages.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null
  );
}

export function saveLandingPage(page: LandingPage): LandingPage {
  const pages = getLandingPages();
  const index = pages.findIndex((p) => p.id === page.id);
  page.updated_at = new Date().toISOString();
  if (index >= 0) {
    pages[index] = page;
  } else {
    page.created_at = new Date().toISOString();
    pages.unshift(page);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  return page;
}

export function deleteLandingPage(id: string): void {
  const pages = getLandingPages().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function getDefaultLandingPages(): LandingPage[] {
  const pages: LandingPage[] = [
    {
      id: "lp-demo-001",
      dealership_id: "demo-dealership-001",
      slug: "spring-clearance-2026",
      title: "Spring Clearance Event",
      template: "sales-event",
      status: "published",
      hero_image_url: null,
      headline: "Spring Clearance Event",
      subheadline: "Save thousands on select Volkswagen models — this weekend only!",
      cta_text: "View Deals",
      cta_link: "https://www.brownsvw.com/specials",
      description:
        "Don't miss Browns Volkswagen's biggest sale of the season. We're clearing out 2024 models to make room for the latest arrivals. Visit us this weekend for exclusive pricing, special financing, and bonus trade-in value.",
      brand_colors: { primary: "#003366", secondary: "#FFFFFF", accent: "#FF8C00" },
      dealership_name: "Browns Volkswagen",
      dealership_phone: "(804) 555-1234",
      dealership_address: "1234 Auto Mall Dr, Richmond, VA 23235",
      dealership_website: "https://www.brownsvw.com",
      features: [
        "Up to $5,000 off MSRP on select models",
        "0% APR financing for 72 months",
        "Bonus trade-in value — $1,000 over KBB",
        "Free lifetime oil changes with purchase",
      ],
      show_contact_form: true,
      show_map: true,
      custom_css: "",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {
    // Ignore
  }

  return pages;
}
