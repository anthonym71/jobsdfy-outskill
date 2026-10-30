import type { AdminAccess } from "@/lib/admin-permissions";

export const features = {
  books: false,
  movies: false,
  memoryDump: false,
  autobiography: false,
};

export type FeatureKey = keyof typeof features;
export const featureRoutes: Record<string, FeatureKey> = {
  "/app/books": "books",
  "/app/movies": "movies",
  "/app/memory-dump": "memoryDump",
  "/app/autobiography": "autobiography",
};
export const canAccessFeature = (feature: FeatureKey, access: AdminAccess) =>
  features[feature] || access === "owner";
export const canAccessFeatureRoute = (path: string, access: AdminAccess) => {
  const feature = featureRoutes[path];
  return !feature || canAccessFeature(feature, access);
};