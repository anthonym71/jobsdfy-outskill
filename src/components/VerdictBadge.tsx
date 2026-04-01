import { cn } from "@/lib/utils";

export type Verdict = "go" | "review" | "stop";

const config: Record<Verdict, { label: string; className: string }> = {
  go: { label: "GO", className: "bg-verdict-go-bg text-verdict-go border-verdict-go/20" },
  review: { label: "REVIEW", className: "bg-verdict-review-bg text-verdict-review border-verdict-review/20" },
  stop: { label: "STOP", className: "bg-verdict-stop-bg text-verdict-stop border-verdict-stop/20" },
};

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: "sm" | "lg";
}

const VerdictBadge = ({ verdict, size = "sm" }: VerdictBadgeProps) => {
  const c = config[verdict];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-heading font-bold uppercase tracking-wider",
      size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-5 py-2 text-base",
      c.className
    )}>
      {c.label}
    </span>
  );
};

export default VerdictBadge;
