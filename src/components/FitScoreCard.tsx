import { cn } from "@/lib/utils";

interface FitScoreCardProps {
  score: number;
  confidence: "high" | "medium" | "low";
  label?: string;
}

const FitScoreCard = ({ score, confidence, label = "Fit Score" }: FitScoreCardProps) => {
  const scoreColor = score >= 7 ? "text-verdict-go" : score >= 4 ? "text-verdict-review" : "text-verdict-stop";
  const ringColor = score >= 7 ? "border-verdict-go" : score >= 4 ? "border-verdict-review" : "border-verdict-stop";

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6">
      <div className={cn("flex h-24 w-24 items-center justify-center rounded-full border-4", ringColor)}>
        <span className={cn("font-heading text-3xl font-bold", scoreColor)}>{score}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-heading font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground capitalize">Confidence: {confidence}</p>
      </div>
    </div>
  );
};

export default FitScoreCard;
