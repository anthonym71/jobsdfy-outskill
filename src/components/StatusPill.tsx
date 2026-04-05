import { cn } from "@/lib/utils";

export type JobStatus = "new" | "blocked" | "reviewing" | "saved" | "applied" | "archived" | "listed" | "in_progress" | "interview" | "closed" | "pending_decision" | "lost";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-accent text-accent-foreground" },
  listed: { label: "Listed", className: "bg-primary/10 text-primary" },
  blocked: { label: "Blocked", className: "bg-verdict-stop-bg text-verdict-stop" },
  reviewing: { label: "Reviewing", className: "bg-verdict-review-bg text-verdict-review" },
  saved: { label: "Saved", className: "bg-primary/10 text-primary" },
  applied: { label: "Applied", className: "bg-verdict-go-bg text-verdict-go" },
  in_progress: { label: "In Progress", className: "bg-verdict-review-bg text-verdict-review" },
  interview: { label: "Interview", className: "bg-verdict-go-bg text-verdict-go" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
  pending_decision: { label: "Pending Decision", className: "bg-verdict-review-bg text-verdict-review" },
  lost: { label: "Lost", className: "bg-verdict-stop-bg text-verdict-stop" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

const StatusPill = ({ status }: { status: JobStatus }) => {
  const c = statusConfig[status] || statusConfig.new;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}>
      {c.label}
    </span>
  );
};

export default StatusPill;
