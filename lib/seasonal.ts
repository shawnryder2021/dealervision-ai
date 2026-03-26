/**
 * Seasonal Auto-Suggest System
 * Returns relevant content suggestions based on current date
 */

export interface SeasonalSuggestion {
  id: string;
  title: string;
  description: string;
  contentType: string;
  channel: string;
  style: string;
  promptHint: string;
  bgSwapPreset?: string;
  emoji: string;
  priority: number; // higher = more relevant right now
  tags: string[];
}

interface SeasonalWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export function isInWindow(date: Date, window: SeasonalWindow): boolean {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  const current = month * 100 + day;
  const start = window.startMonth * 100 + window.startDay;
  const end = window.endMonth * 100 + window.endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Wraps around year (e.g., Dec-Jan)
  return current >= start || current <= end;
}

const SEASONAL_SUGGESTIONS: Array<
  SeasonalSuggestion & { window: SeasonalWindow }
> = [
  // === HOLIDAYS ===
  {
    id: "new-years",
    title: "New Year's Sale",
    description: "Kick off the year with New Year deals and fresh inventory",
    contentType: "sales-event",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "New Year celebration theme with fireworks and gold accents",
    bgSwapPreset: "new-years",
    emoji: "🎉",
    priority: 9,
    tags: ["holiday", "sale"],
    window: { startMonth: 12, startDay: 26, endMonth: 1, endDay: 5 },
  },
  {
    id: "valentines",
    title: "Valentine's Day Special",
    description: "Love is in the air — romantic vehicle promotions",
    contentType: "sales-event",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint:
      "Valentine's Day theme with romantic pink and red tones, hearts",
    bgSwapPreset: "valentines",
    emoji: "💝",
    priority: 8,
    tags: ["holiday", "seasonal"],
    window: { startMonth: 2, startDay: 1, endMonth: 2, endDay: 15 },
  },
  {
    id: "st-patricks",
    title: "St. Patrick's Day Deals",
    description: "Lucky deals and green-themed promotions",
    contentType: "sales-event",
    channel: "facebook-post",
    style: "photorealistic",
    promptHint: "St. Patrick's Day with green and gold, shamrocks, luck theme",
    bgSwapPreset: "st-patricks",
    emoji: "☘️",
    priority: 7,
    tags: ["holiday", "seasonal"],
    window: { startMonth: 3, startDay: 10, endMonth: 3, endDay: 18 },
  },
  {
    id: "easter-spring",
    title: "Easter / Spring Sale",
    description: "Fresh spring deals with pastel vibes",
    contentType: "sales-event",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Spring Easter theme with pastels, flowers, fresh starts",
    bgSwapPreset: "easter",
    emoji: "🐣",
    priority: 8,
    tags: ["holiday", "seasonal"],
    window: { startMonth: 3, startDay: 20, endMonth: 4, endDay: 20 },
  },
  {
    id: "memorial-day",
    title: "Memorial Day Weekend Sale",
    description: "Patriotic savings event — one of the biggest sales weekends",
    contentType: "sales-event",
    channel: "facebook-cover",
    style: "photorealistic",
    promptHint: "Patriotic Memorial Day theme with American flags, red white blue",
    bgSwapPreset: "memorial-day",
    emoji: "🇺🇸",
    priority: 9,
    tags: ["holiday", "sale", "big-event"],
    window: { startMonth: 5, startDay: 15, endMonth: 5, endDay: 31 },
  },
  {
    id: "fourth-july",
    title: "4th of July Blowout",
    description: "Independence Day celebration with explosive deals",
    contentType: "sales-event",
    channel: "facebook-cover",
    style: "photorealistic",
    promptHint: "4th of July fireworks, American flags, patriotic celebration",
    bgSwapPreset: "fourth-july",
    emoji: "🎆",
    priority: 9,
    tags: ["holiday", "sale", "big-event"],
    window: { startMonth: 6, startDay: 25, endMonth: 7, endDay: 5 },
  },
  {
    id: "labor-day",
    title: "Labor Day Sales Event",
    description: "End of summer blowout — last chance deals",
    contentType: "sales-event",
    channel: "facebook-cover",
    style: "photorealistic",
    promptHint: "Labor Day end of summer sale, warm tones, celebration",
    bgSwapPreset: "labor-day",
    emoji: "🛠️",
    priority: 9,
    tags: ["holiday", "sale", "big-event"],
    window: { startMonth: 8, startDay: 25, endMonth: 9, endDay: 5 },
  },
  {
    id: "halloween",
    title: "Halloween Spooktacular",
    description: "Scary good deals with festive Halloween themes",
    contentType: "sales-event",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Halloween theme with pumpkins, spooky fun, orange and purple",
    bgSwapPreset: "halloween",
    emoji: "🎃",
    priority: 7,
    tags: ["holiday", "seasonal"],
    window: { startMonth: 10, startDay: 15, endMonth: 10, endDay: 31 },
  },
  {
    id: "thanksgiving",
    title: "Thanksgiving Gratitude Sale",
    description: "Give thanks with thankful pricing and warm autumn vibes",
    contentType: "sales-event",
    channel: "facebook-post",
    style: "photorealistic",
    promptHint: "Thanksgiving harvest theme, warm autumn colors, gratitude",
    bgSwapPreset: "thanksgiving",
    emoji: "🦃",
    priority: 8,
    tags: ["holiday", "seasonal"],
    window: { startMonth: 11, startDay: 18, endMonth: 11, endDay: 28 },
  },
  {
    id: "black-friday",
    title: "Black Friday Deals",
    description: "The biggest shopping event — bold black and gold deals",
    contentType: "sales-event",
    channel: "instagram-story",
    style: "photorealistic",
    promptHint:
      "Black Friday dramatic dark theme, gold accents, bold pricing",
    bgSwapPreset: "black-friday",
    emoji: "🏷️",
    priority: 10,
    tags: ["holiday", "sale", "big-event"],
    window: { startMonth: 11, startDay: 25, endMonth: 12, endDay: 2 },
  },
  {
    id: "christmas",
    title: "Holiday Season Sale",
    description: "Festive Christmas promotions with gift-giving spirit",
    contentType: "sales-event",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Christmas holiday theme with snow, lights, decorated trees",
    bgSwapPreset: "holiday-christmas",
    emoji: "🎄",
    priority: 9,
    tags: ["holiday", "sale", "big-event"],
    window: { startMonth: 12, startDay: 1, endMonth: 12, endDay: 26 },
  },

  // === SEASONS ===
  {
    id: "spring-fresh",
    title: "Spring Into Savings",
    description: "Fresh spring inventory with blooming backgrounds",
    contentType: "new-arrival",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Spring bloom theme with cherry blossoms and fresh greenery",
    bgSwapPreset: "spring-bloom",
    emoji: "🌸",
    priority: 6,
    tags: ["seasonal"],
    window: { startMonth: 3, startDay: 1, endMonth: 5, endDay: 15 },
  },
  {
    id: "summer-road-trip",
    title: "Summer Road Trip Ready",
    description: "Adventure-ready vehicles for summer road trips",
    contentType: "vehicle-spotlight",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Summer road trip vibes, open highway, sunshine, adventure",
    bgSwapPreset: "summer-road-trip",
    emoji: "☀️",
    priority: 6,
    tags: ["seasonal"],
    window: { startMonth: 5, startDay: 15, endMonth: 8, endDay: 31 },
  },
  {
    id: "back-to-school",
    title: "Back to School Deals",
    description: "Reliable vehicles for students and parents",
    contentType: "financing",
    channel: "facebook-post",
    style: "photorealistic",
    promptHint: "Back to school theme, campus vibes, affordable reliable vehicles",
    emoji: "📚",
    priority: 7,
    tags: ["seasonal", "sale"],
    window: { startMonth: 7, startDay: 20, endMonth: 9, endDay: 10 },
  },
  {
    id: "fall-clearance",
    title: "Fall Clearance Event",
    description: "End of model year clearance with autumn colors",
    contentType: "price-drop",
    channel: "facebook-cover",
    style: "photorealistic",
    promptHint: "Autumn clearance theme with fall foliage, warm golden tones",
    bgSwapPreset: "autumn-road",
    emoji: "🍂",
    priority: 7,
    tags: ["seasonal", "sale"],
    window: { startMonth: 9, startDay: 15, endMonth: 11, endDay: 15 },
  },
  {
    id: "winter-ready",
    title: "Winter-Ready Vehicles",
    description: "AWD and winter-capable vehicles for the cold season",
    contentType: "vehicle-spotlight",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Winter snow scene, rugged capability, AWD, winter tires",
    bgSwapPreset: "winter-scene",
    emoji: "❄️",
    priority: 6,
    tags: ["seasonal"],
    window: { startMonth: 11, startDay: 1, endMonth: 2, endDay: 28 },
  },

  // === YEAR-ROUND (lower priority, always show as fallback) ===
  {
    id: "new-inventory",
    title: "New Inventory Announcement",
    description: "Showcase just-arrived vehicles",
    contentType: "new-arrival",
    channel: "instagram-post",
    style: "photorealistic",
    promptHint: "Fresh new inventory, exciting reveal, just arrived",
    emoji: "✨",
    priority: 3,
    tags: ["evergreen"],
    window: { startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 },
  },
  {
    id: "service-special",
    title: "Service Center Special",
    description: "Oil change, tire rotation, and maintenance deals",
    contentType: "service-promo",
    channel: "facebook-post",
    style: "photorealistic",
    promptHint: "Professional service center, maintenance, trust and reliability",
    emoji: "🔧",
    priority: 3,
    tags: ["evergreen"],
    window: { startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 },
  },
  {
    id: "financing-offer",
    title: "Low APR Financing",
    description: "Highlight competitive financing and lease options",
    contentType: "financing",
    channel: "instagram-story",
    style: "photorealistic",
    promptHint: "Professional financing offer, clean modern, money-saving",
    emoji: "💰",
    priority: 3,
    tags: ["evergreen"],
    window: { startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 },
  },
];

/**
 * Get seasonal suggestions relevant to the current date.
 * Returns up to `limit` suggestions sorted by priority (highest first).
 */
export function getSeasonalSuggestions(
  date: Date = new Date(),
  limit = 6
): SeasonalSuggestion[] {
  const active = SEASONAL_SUGGESTIONS.filter((s) => isInWindow(date, s.window))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);

  // Strip the window field before returning
  return active.map(({ window: _w, ...rest }) => rest);
}

/**
 * Get the current "season" label for display
 */
export function getCurrentSeason(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

/**
 * Get seasonal events active on a specific date
 */
export function getSeasonalEventsForDate(date: Date): SeasonalSuggestion[] {
  return SEASONAL_SUGGESTIONS.filter((s) => isInWindow(date, s.window))
    .sort((a, b) => b.priority - a.priority)
    .map(({ window: _w, ...rest }) => rest);
}

/**
 * Get upcoming holidays within the next N days
 */
export function getUpcomingEvents(
  date: Date = new Date(),
  daysAhead = 30
): SeasonalSuggestion[] {
  const future = new Date(date);
  future.setDate(future.getDate() + daysAhead);

  return SEASONAL_SUGGESTIONS.filter((s) => {
    // Check if the window starts within the next N days
    const windowStart = new Date(date.getFullYear(), s.window.startMonth - 1, s.window.startDay);
    // Handle year wrap
    if (windowStart < date) {
      windowStart.setFullYear(windowStart.getFullYear() + 1);
    }
    return windowStart >= date && windowStart <= future;
  })
    .sort((a, b) => b.priority - a.priority)
    .map(({ window: _w, ...rest }) => rest);
}
