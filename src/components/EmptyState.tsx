import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">{icon}</div>
    <h3 className="text-lg font-heading font-semibold text-foreground">{title}</h3>
    <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
