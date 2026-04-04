import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserCredits {
  balance: number;
  lifetime_earned: number;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
}

export interface Achievement {
  achievement_key: string;
  achieved_at: string;
}

// XP thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export const getLevelFromXp = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getXpProgress = (xp: number): { current: number; next: number; percent: number } => {
  const level = getLevelFromXp(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const progress = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { current: progress, next: needed, percent: Math.min(100, (progress / needed) * 100) };
};

// Credit rewards for actions
export const CREDIT_REWARDS: Record<string, { credits: number; xp: number; label: string }> = {
  profile_basic: { credits: 5, xp: 25, label: "Complete basic info" },
  profile_preferences: { credits: 5, xp: 25, label: "Set work preferences" },
  profile_skills: { credits: 5, xp: 25, label: "Add skills & experience" },
  profile_nonneg: { credits: 5, xp: 25, label: "Set non-negotiables" },
  first_job_check: { credits: 3, xp: 50, label: "Check your first job" },
  complete_assessment: { credits: 10, xp: 100, label: "Complete a personality assessment" },
  daily_login: { credits: 1, xp: 10, label: "Daily login" },
  referral_signup: { credits: 15, xp: 75, label: "Friend signs up" },
  add_social_links: { credits: 3, xp: 20, label: "Add social media links" },
  streak_7: { credits: 5, xp: 50, label: "7-day streak" },
  streak_30: { credits: 20, xp: 200, label: "30-day streak" },
};

// Achievement definitions
export const ACHIEVEMENTS: Record<string, { icon: string; title: string; description: string }> = {
  first_steps: { icon: "🚀", title: "First Steps", description: "Complete onboarding" },
  profile_complete: { icon: "✅", title: "Profile Pro", description: "100% profile completion" },
  first_check: { icon: "🔍", title: "Job Hunter", description: "Check your first job" },
  five_checks: { icon: "🎯", title: "Sharp Eye", description: "Check 5 jobs" },
  first_go: { icon: "💚", title: "Green Light", description: "Get your first GO verdict" },
  streak_7: { icon: "🔥", title: "On Fire", description: "7-day login streak" },
  streak_30: { icon: "⚡", title: "Unstoppable", description: "30-day login streak" },
  first_referral: { icon: "🤝", title: "Connector", description: "Refer a friend" },
  assessment_complete: { icon: "🧠", title: "Self-Aware", description: "Complete a personality test" },
};

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCredits({
        balance: data.balance,
        lifetime_earned: data.lifetime_earned,
        xp: data.xp,
        level: data.level,
        streak_days: data.streak_days,
        last_active_date: data.last_active_date,
      });
    } else {
      // Initialize credits for new user via SECURITY DEFINER function
      await supabase.rpc("initialize_user_credits", { _user_id: user.id });
      const initial: UserCredits = { balance: 3, lifetime_earned: 3, xp: 0, level: 1, streak_days: 0, last_active_date: null };
      setCredits(initial);
    }

    const { data: achData } = await supabase
      .from("user_achievements")
      .select("achievement_key, achieved_at")
      .eq("user_id", user.id);
    setAchievements(achData || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadCredits(); }, [loadCredits]);

  const earnCredits = useCallback(async (reason: string) => {
    if (!user || !credits) return false;
    const reward = CREDIT_REWARDS[reason];
    if (!reward) return false;

    // Use server-side RPC that validates reason and amounts
    const { data: success } = await supabase.rpc("earn_credits", {
      _user_id: user.id,
      _reason: reason,
      _credits: reward.credits,
      _xp: reward.xp,
    });

    if (!success) return false;

    const newXp = credits.xp + reward.xp;
    setCredits({
      ...credits,
      balance: credits.balance + reward.credits,
      lifetime_earned: credits.lifetime_earned + reward.credits,
      xp: newXp,
      level: getLevelFromXp(newXp),
    });
    return true;
  }, [user, credits]);

  const spendCredits = useCallback(async (amount: number, reason: string) => {
    if (!user || !credits || credits.balance < amount) return false;

    // Use server-side RPC that validates amount and balance
    const { data: success } = await supabase.rpc("spend_credits", {
      _user_id: user.id,
      _amount: amount,
      _reason: reason,
    });

    if (!success) return false;

    setCredits({ ...credits, balance: credits.balance - amount });
    return true;
  }, [user, credits]);

  const unlockAchievement = useCallback(async (key: string) => {
    if (!user || achievements.find(a => a.achievement_key === key)) return false;

    await supabase.from("user_achievements").insert({
      user_id: user.id,
      achievement_key: key,
    });

    setAchievements(prev => [...prev, { achievement_key: key, achieved_at: new Date().toISOString() }]);
    return true;
  }, [user, achievements]);

  const hasAchievement = useCallback((key: string) => achievements.some(a => a.achievement_key === key), [achievements]);

  return { credits, achievements, loading, earnCredits, spendCredits, unlockAchievement, hasAchievement, reload: loadCredits };
}
