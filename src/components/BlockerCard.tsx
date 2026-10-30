import { AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockerCardProps {
  category: string;
  status: "confirmed" | "unclear" | "ok";
  userValue: string;
  jobValue: string;
  note?: string;
  /** The exact line from the posting that this result is based on. */
  quote?: string | null;
  /** The posting only stated a preference, not a requirement. */
  soft?: boolean;
  onDisagree?: () => void;
}

const statusStyles = {
  confirmed: {
    border: "border-verdict-stop/30",
    bg: "bg-verdict-stop-bg",
    icon: <XCircle className="h-4 w-4 text-verdict-stop" />,
    label: "Breaks your limit",
    labelClass: "text-verdict-stop",
  },
  unclear: {
    border: "border-verdict-review/30",
    bg: "bg-verdict-review-bg",
    icon: <HelpCircle className="h-4 w-4 text-verdict-review-foreground" />,
    label: "Posting doesn't say",
    labelClass: "text-verdict-review-foreground",
  },
  ok: {
    border: "border-verdict-go/30",
    bg: "bg-verdict-go-bg",
    icon: <AlertTriangle className="h-4 w-4 text-verdict-go" />,
    label: "Fits",
    labelClass: "text-verdict-go",
  },
};

const BlockerCard = ({ category, status, userValue, jobValue, note, quote, soft, onDisagree }: BlockerCardProps) => {
  const s = statusStyles[status];
  const label = status === "unclear" && soft ? "Preference only" : s.label;
  return (
    <div className={cn("rounded-lg border p-4", s.border, s.bg)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-heading font-semibold text-foreground">{category}</span>
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", s.labelClass)}>
          {s.icon}
          {label}
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">You</span>
          <span className="font-medium text-foreground text-right">{userValue}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Job</span>
          <span className="font-medium text-foreground text-right">{jobValue}</span>
        </div>
      </div>
      {quote && (
        <blockquote className="mt-3 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
          “{quote}”
        </blockquote>
      )}
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
      {onDisagree && (
        <button type="button" onClick={onDisagree} className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          This looks wrong
        </button>
      )}
    </div>
  );
};

export default BlockerCard;
