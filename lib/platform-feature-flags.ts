export const FEATURE_FLAG_KEYS = [
  "campaigns",
  "aiAssistant",
  "vinDecoder",
  "backgroundSwap",
  "abTest",
  "batchGenerate",
  "leads",
  "landingPages",
  "email",
  "publish",
  "activity",
  "calendar",
  "usage",
  "billing",
  "socialAccounts",
  "inventoryAging",
  "leadReply",
  "salespeople",
  "photoEnhancer",
  "walkaroundVideo",
  "oemCoop",
  "comparison",
  "reviewReply",
  "recalls",
  "showroomTv",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  campaigns: true,
  aiAssistant: true,
  vinDecoder: true,
  backgroundSwap: true,
  abTest: true,
  batchGenerate: true,
  leads: true,
  landingPages: true,
  email: true,
  publish: true,
  activity: true,
  calendar: true,
  usage: true,
  billing: true,
  socialAccounts: true,
  inventoryAging: true,
  leadReply: true,
  salespeople: true,
  photoEnhancer: true,
  walkaroundVideo: true,
  oemCoop: true,
  comparison: true,
  reviewReply: true,
  recalls: true,
  showroomTv: true,
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, string> = {
  campaigns: "Campaigns",
  aiAssistant: "AI Assistant",
  vinDecoder: "VIN Decoder",
  backgroundSwap: "Background Swap",
  abTest: "A/B Test",
  batchGenerate: "Batch Generate",
  leads: "Leads",
  landingPages: "Landing Pages",
  email: "Email",
  publish: "Publish",
  activity: "Activity",
  calendar: "Calendar",
  usage: "Usage",
  billing: "Billing",
  socialAccounts: "Social Accounts",
  inventoryAging: "Inventory Aging",
  leadReply: "Lead Reply Assistant",
  salespeople: "Salespeople",
  photoEnhancer: "Photo Enhancer",
  walkaroundVideo: "Walkaround Video",
  oemCoop: "OEM Co-op Compliance",
  comparison: "Vehicle Comparison",
  reviewReply: "Review Reply",
  recalls: "NHTSA Recalls",
  showroomTv: "Showroom TV Mode",
};

export function normalizeFeatureFlags(raw: unknown): FeatureFlags {
  const flags = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  return FEATURE_FLAG_KEYS.reduce((acc, key) => {
    acc[key] = typeof flags[key] === "boolean" ? flags[key] : DEFAULT_FEATURE_FLAGS[key];
    return acc;
  }, {} as FeatureFlags);
}
