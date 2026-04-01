import { Coins, Zap, Flame, Trophy } from "lucide-react";
import { useCredits, getXpProgress, ACHIEVEMENTS } from "@/hooks/useCredits";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export const CreditBalance = ({ compact = false }: { compact?: boolean }) => {
  const { credits, loading } = useCredits();
  if (loading || !credits) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Coins className="h-4 w-4 text-amber-500" />
        <span>{credits.balance}</span>
      </div>
    );
  }

  const xpProgress = getXpProgress(credits.xp);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <span className="text-lg font-bold text-foreground">{credits.balance}</span>
          <span className="text-sm text-muted-foreground">credits</span>
        </div>
        {credits.streak_days > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-500">
            <Flame className="h-4 w-4" />
            <span>{credits.streak_days}d streak</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Level {credits.level}
          </span>
          <span>{xpProgress.current} / {xpProgress.next} XP</span>
        </div>
        <Progress value={xpProgress.percent} className="h-2" />
      </div>
    </div>
  );
};

export const AchievementBadge = ({ achievementKey, unlocked = false }: { achievementKey: string; unlocked?: boolean }) => {
  const def = ACHIEVEMENTS[achievementKey];
  if (!def) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${unlocked ? "bg-primary/10 scale-100" : "bg-muted opacity-40 grayscale scale-90"}`}>
          {def.icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{def.title}</p>
        <p className="text-xs text-muted-foreground">{def.description}</p>
        {!unlocked && <p className="text-xs text-muted-foreground mt-1">🔒 Locked</p>}
      </TooltipContent>
    </Tooltip>
  );
};

export const AchievementGrid = () => {
  const { achievements } = useCredits();
  const allKeys = Object.keys(ACHIEVEMENTS);

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-amber-500" /> Achievements
      </h3>
      <div className="flex flex-wrap gap-2">
        {allKeys.map(key => (
          <AchievementBadge
            key={key}
            achievementKey={key}
            unlocked={achievements.some(a => a.achievement_key === key)}
          />
        ))}
      </div>
    </div>
  );
};

export const CreditRewardToast = ({ credits, xp, reason }: { credits: number; xp: number; reason: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
      <Coins className="h-5 w-5 text-amber-500" />
    </div>
    <div>
      <p className="font-semibold text-foreground">+{credits} credits earned!</p>
      <p className="text-xs text-muted-foreground">{reason} • +{xp} XP</p>
    </div>
  </div>
);
