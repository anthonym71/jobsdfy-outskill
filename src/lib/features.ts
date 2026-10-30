// Feature flags for the parts of the app that are not the core "check the posting first" product.
// Everything here is hidden by default, never deleted: set VITE_FEATURES to a comma list to bring a group back,
// for example VITE_FEATURES="assessments,referrals".

export type FeatureKey = "profileExtras" | "assessments" | "gamification" | "referrals" | "hiring" | "events";

export const ALL_FEATURES: FeatureKey[] = ["profileExtras", "assessments", "gamification", "referrals", "hiring", "events"];

/** Which feature group owns each app route. Routes not listed here are core and always on. */
const ROUTE_FEATURES: Array<[string, FeatureKey]> = [
  ["/app/books", "profileExtras"],
  ["/app/movies", "profileExtras"],
  ["/app/memory-dump", "profileExtras"],
  ["/app/social-media", "profileExtras"],
  ["/app/photo-gallery", "profileExtras"],
  ["/app/autobiography", "profileExtras"],
  ["/app/assessments", "assessments"],
  ["/app/post-job", "hiring"],
  ["/app/recruiter", "hiring"],
  ["/app/companies", "hiring"],
  ["/app/events", "events"],
  ["/app/event-registrations", "events"],
];

export function parseFeatures(raw: string | undefined | null): Set<FeatureKey> {
  const on = new Set<FeatureKey>();
  for (const part of (raw ?? "").split(",")) {
    const key = part.trim() as FeatureKey;
    if (ALL_FEATURES.includes(key)) on.add(key);
  }
  return on;
}

export const enabledFeatures = (): Set<FeatureKey> => parseFeatures(import.meta.env.VITE_FEATURES as string | undefined);

export const isEnabled = (key: FeatureKey, enabled: Set<FeatureKey> = enabledFeatures()) => enabled.has(key);

export function featureForPath(path: string): FeatureKey | null {
  for (const [prefix, key] of ROUTE_FEATURES) {
    if (path === prefix || path.startsWith(prefix + "/")) return key;
  }
  return null;
}

export function isPathEnabled(path: string, enabled: Set<FeatureKey> = enabledFeatures()) {
  const key = featureForPath(path);
  return key === null || enabled.has(key);
}

/** Navigation items with the hidden groups removed. */
export function visibleNav<T extends { to: string }>(items: T[], enabled: Set<FeatureKey> = enabledFeatures()): T[] {
  return items.filter((i) => isPathEnabled(i.to, enabled));
}
