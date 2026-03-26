/**
 * Template Gallery System
 * Save and load reusable generation templates via localStorage
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  contentType: string;
  channel: string;
  style: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  eventName?: string;
  eventDates?: string;
  offerDetails?: string;
  serviceOffer?: string;
  serviceDetails?: string;
  customPrompt?: string;
  campaign?: string;
  createdAt: string;
  usedCount: number;
  lastUsed?: string;
}

const STORAGE_KEY = "dealeradgen-templates";

export function getTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultTemplates();
  } catch {
    return getDefaultTemplates();
  }
}

export function saveTemplate(template: Omit<Template, "id" | "createdAt" | "usedCount">): Template {
  const templates = getTemplates();
  const newTemplate: Template = {
    ...template,
    id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    usedCount: 0,
  };
  templates.unshift(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function recordTemplateUse(id: string): void {
  const templates = getTemplates().map((t) =>
    t.id === id
      ? { ...t, usedCount: t.usedCount + 1, lastUsed: new Date().toISOString() }
      : t
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function getDefaultTemplates(): Template[] {
  const defaults: Template[] = [
    {
      id: "default-vehicle-spotlight-ig",
      name: "Vehicle Spotlight — Instagram",
      description: "Hero shot for Instagram feed",
      contentType: "vehicle-spotlight",
      channel: "instagram-post",
      style: "photorealistic",
      headline: "",
      cta: "Visit us today!",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
    {
      id: "default-sales-event-fb",
      name: "Sales Event — Facebook Cover",
      description: "Wide banner for Facebook page",
      contentType: "sales-event",
      channel: "facebook-cover",
      style: "photorealistic",
      headline: "",
      cta: "Don't miss out!",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
    {
      id: "default-price-drop-story",
      name: "Price Drop — Instagram Story",
      description: "Vertical story for price reductions",
      contentType: "price-drop",
      channel: "instagram-story",
      style: "photorealistic",
      headline: "Price Reduced!",
      cta: "Call now!",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
    {
      id: "default-new-arrival-ig",
      name: "New Arrival — Instagram",
      description: "Just Arrived announcement post",
      contentType: "new-arrival",
      channel: "instagram-post",
      style: "photorealistic",
      headline: "Just Arrived!",
      cta: "Schedule a test drive",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
    {
      id: "default-financing-fb",
      name: "Financing Offer — Facebook",
      description: "Financing/lease special for Facebook",
      contentType: "financing",
      channel: "facebook-post",
      style: "photorealistic",
      headline: "0% APR Available",
      offerDetails: "For qualified buyers. Limited time offer.",
      cta: "Apply today!",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
    {
      id: "default-service-promo",
      name: "Service Special — Facebook",
      description: "Service center promo post",
      contentType: "service-promo",
      channel: "facebook-post",
      style: "photorealistic",
      serviceOffer: "Oil Change Special",
      serviceDetails: "Full synthetic oil change for $49.99",
      cta: "Book online!",
      createdAt: new Date().toISOString(),
      usedCount: 0,
    },
  ];

  // Store defaults so they persist
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }
  return defaults;
}
