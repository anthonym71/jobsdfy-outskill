import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isEnabled, type FeatureKey } from "@/lib/features";

/** Renders its children only when the feature group is switched on; otherwise sends the user back to the dashboard. */
const FeatureGate = ({ feature, children }: { feature: FeatureKey; children: ReactNode }) =>
  isEnabled(feature) ? <>{children}</> : <Navigate to="/app" replace />;

export default FeatureGate;
