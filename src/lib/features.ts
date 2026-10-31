// Feature flags. Hidden features are never deleted: they are switched off for users and come back with one switch.
// Hidden by default: profileExtras (Books, Movies, Memory Dump, Autobiography), gamification, referrals, legacyLanding.
// Visible by default: the job flow, Quick Apply, interview, calendar, tasks, events, training, assessments,
// recruiter side, photo gallery, social / thought leadership, pricing and credits.
// VITE_FEATURES is a comma list: "profileExtras" turns a group on, "-events" turns a default-on group off.

export type FeatureKey = "profileExtras" | "assessments" | "gamification" | "referrals" | "hiring" | "events" | "legacyLanding";

export const ALL_FEATURES: FeatureKey[] = ["profileExtras", "assessments", "gamification", "referrals", "hiring", "events", "legacyLanding"];

export const DEFAULT_ON: FeatureKey[] = ["assessments", "hiring", "events"];

/** Which feature group owns each app route. Routes not listed here are core and always on. */
const ROUTE_FEATURES: Array<[string, FeatureKey]> = [
  ["/app/books", "profileExtras"],
  ["/app/movies", "profileExtras"],
  ["/app/memory-dump", "profileExtras"],
  ["/app/autobiography", "profileExtras"],
  ["/app/assessments", "assessments"],
  ["/app/post-job", "hiring"],
  ["/app/recruiter", "hiring"],
  ["/app/companies", "hiring"],
  ["/app/events", "events"],
  ["/app/event-registrations", "events"],
];

export function parseFeatures(raw: string | undefined | null): Set<FeatureKey> {
  const on = new Set<FeatureKey>(DEFAULT_ON);
  for (const part of (raw ?? "").split(",")) {
    const name = part.trim();
    const off = name.startsWith("-");
    const key = (off ? name.slice(1) : name) as FeatureKey;
    if (!ALL_FEATURES.includes(key)) continue;
    if (off) on.delete(key);
    else on.add(key);
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
