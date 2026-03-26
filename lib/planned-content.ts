/**
 * Planned Content CRUD — localStorage-backed
 * Storage key: "dealeradgen_planned_content"
 */

export interface PlannedContent {
  id: string;
  date: string; // YYYY-MM-DD
  content_type: string;
  channel: string;
  vehicle_id?: string;
  notes: string;
  status: "planned" | "created" | "published";
  asset_id?: string;
  created_at: string;
}

const STORAGE_KEY = "dealeradgen_planned_content";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function readAll(): PlannedContent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlannedContent[];
  } catch {
    return [];
  }
}

function writeAll(items: PlannedContent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Seed default demo data if storage is empty */
function ensureDemoData(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const pad = (n: number) => String(n).padStart(2, "0");
  const d = (y: number, m: number, day: number) =>
    `${y}-${pad(m + 1)}-${pad(day)}`;

  const demo: PlannedContent[] = [
    {
      id: generateId(),
      date: d(year, month, 5),
      content_type: "vehicle-spotlight",
      channel: "instagram-post",
      notes: "Feature the new SUV lineup for spring",
      status: "planned",
      created_at: new Date(year, month, 1).toISOString(),
    },
    {
      id: generateId(),
      date: d(year, month, 12),
      content_type: "sales-event",
      channel: "facebook-cover",
      notes: "Mid-month flash sale banner",
      status: "created",
      created_at: new Date(year, month, 2).toISOString(),
    },
    {
      id: generateId(),
      date: d(year, month, 18),
      content_type: "service-promo",
      channel: "facebook-post",
      notes: "Oil change and tire rotation special",
      status: "planned",
      created_at: new Date(year, month, 3).toISOString(),
    },
    {
      id: generateId(),
      date: d(year, month, 25),
      content_type: "testimonial",
      channel: "instagram-story",
      notes: "Customer review highlight — the Johnsons",
      status: "published",
      created_at: new Date(year, month, 4).toISOString(),
    },
    {
      id: generateId(),
      date: d(nextYear, nextMonth, 3),
      content_type: "new-arrival",
      channel: "instagram-post",
      notes: "2026 model year trucks announcement",
      status: "planned",
      created_at: new Date(year, month, 5).toISOString(),
    },
    {
      id: generateId(),
      date: d(nextYear, nextMonth, 15),
      content_type: "financing",
      channel: "facebook-post",
      notes: "0% APR spring financing event",
      status: "planned",
      created_at: new Date(year, month, 5).toISOString(),
    },
  ];

  writeAll(demo);
}

/** Get all planned content items */
export function getPlannedContent(): PlannedContent[] {
  ensureDemoData();
  return readAll();
}

/** Add a new planned content item */
export function addPlannedContent(
  item: Omit<PlannedContent, "id" | "created_at">
): PlannedContent {
  const newItem: PlannedContent = {
    ...item,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  const all = readAll();
  all.push(newItem);
  writeAll(all);
  return newItem;
}

/** Update an existing planned content item */
export function updatePlannedContent(
  id: string,
  updates: Partial<PlannedContent>
): PlannedContent | null {
  const all = readAll();
  const idx = all.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, id: all[idx].id };
  writeAll(all);
  return all[idx];
}

/** Delete a planned content item */
export function deletePlannedContent(id: string): void {
  const all = readAll();
  writeAll(all.filter((item) => item.id !== id));
}

/** Get planned content filtered by year and month (1-indexed month) */
export function getPlannedContentForMonth(
  year: number,
  month: number
): PlannedContent[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return getPlannedContent().filter((item) => item.date.startsWith(prefix));
}
