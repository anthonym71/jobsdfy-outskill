import { useEffect, useState } from "react";
import { Loader2, Trophy, Brain, Heart, Flame } from "lucide-react";
import VoiceCVBuilderDialog from "./VoiceCVBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AchievementsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
      supabase.from("test_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
    ]).then(([achRes, testRes]) => {
      if (achRes.data) setAchievements(achRes.data);
      if (testRes.data) setTestResults(testRes.data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const testIcons: Record<string, any> = { iq: Brain, personality: Heart, drive: Flame };

  return (
    <div className="space-y-6">
      {/* Achievements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base font-semibold text-foreground">Achievements</h2>
          <VoiceCVBuilderDialog category="achievements" categoryLabel="Achievements" />
        </div>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements unlocked yet. Keep using the platform!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {achievements.map(a => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{a.achievement_key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.achieved_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tests */}
      <section>
        <h2 className="font-heading text-base font-semibold text-foreground mb-3">Assessment Results</h2>
        <p className="text-sm text-muted-foreground mb-4">IQ, Personality, and DRIVE assessments. Coming soon.</p>
        {testResults.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {["IQ Test", "Personality Test", "DRIVE Assessment"].map(t => (
              <div key={t} className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">{t}</p>
                <p className="text-xs text-muted-foreground mt-1">Not taken yet</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {testResults.map(t => {
              const Icon = testIcons[t.test_type] || Brain;
              return (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{t.test_type} Test</p>
                    <p className="text-xs text-muted-foreground">Score: {t.score ?? "N/A"} • {new Date(t.completed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AchievementsTab;
