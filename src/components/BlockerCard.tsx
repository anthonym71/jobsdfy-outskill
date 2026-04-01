import { AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockerCardProps {
  category: string;
  status: "confirmed" | "unclear" | "ok";
  userValue: string;
  jobValue: string;
  note?: string;
}

const statusStyles = {
  confirmed: {
    border: "border-verdict-stop/30",
    bg: "bg-verdict-stop-bg",
    icon: <XCircle className="h-4 w-4 text-verdict-stop" />,
    label: "Mismatch",
    labelClass: "text-verdict-stop",
  },
  unclear: {
    border: "border-verdict-review/30",
    bg: "bg-verdict-review-bg",
    icon: <HelpCircle className="h-4 w-4 text-verdict-review" />,
    label: "Unclear",
    labelClass: "text-verdict-review",
  },
  ok: {
    border: "border-verdict-go/30",
    bg: "bg-verdict-go-bg",
    icon: <AlertTriangle className="h-4 w-4 text-verdict-go" />,
    label: "Aligned",
    labelClass: "text-verdict-go",
  },
};

const BlockerCard = ({ category, status, userValue, jobValue, note }: BlockerCardProps) => {
  const s = statusStyles[status];
  return (
    <div className={cn("rounded-lg border p-4", s.border, s.bg)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-heading font-semibold text-foreground">{category}</span>
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", s.labelClass)}>
          {s.icon}
          {s.label}
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">You</span>
          <span className="font-medium text-foreground">{userValue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Job</span>
          <span className="font-medium text-foreground">{jobValue}</span>
        </div>
      </div>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
};

export default BlockerCard;
