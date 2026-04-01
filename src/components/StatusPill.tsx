import { cn } from "@/lib/utils";

export type JobStatus = "new" | "blocked" | "reviewing" | "saved" | "applied" | "archived";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-accent text-accent-foreground" },
  blocked: { label: "Blocked", className: "bg-verdict-stop-bg text-verdict-stop" },
  reviewing: { label: "Reviewing", className: "bg-verdict-review-bg text-verdict-review" },
  saved: { label: "Saved", className: "bg-primary/10 text-primary" },
  applied: { label: "Applied", className: "bg-verdict-go-bg text-verdict-go" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

const StatusPill = ({ status }: { status: JobStatus }) => {
  const c = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}>
      {c.label}
    </span>
  );
};

export default StatusPill;
