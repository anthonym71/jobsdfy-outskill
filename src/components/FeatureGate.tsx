import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { canAccessFeature, features, type FeatureKey } from "@/config/features";

export default function FeatureGate({ feature, children }: { feature: FeatureKey; children: ReactNode }) {
  const { access, loading } = useAdminAccess();
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!canAccessFeature(feature, access)) return <Navigate to="/app" replace />;
  return <>
    {!features[feature] && <div className="border-b border-border bg-muted px-6 py-2 text-xs text-muted-foreground">This feature is hidden from all other users.</div>}
    {children}
  </>;
}