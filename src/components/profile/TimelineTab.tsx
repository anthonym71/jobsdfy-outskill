import { useEffect, useState } from "react";
import { Loader2, Briefcase, GraduationCap, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  year: number;
  month?: number;
  type: "work" | "education" | "achievement";
  title: string;
  subtitle: string;
  description?: string;
  isCurrent?: boolean;
}

const TimelineTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("work_history").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("user_achievements").select("*").eq("user_id", user.id).order("achieved_at", { ascending: false }),
    ]).then(([workRes, eduRes, achRes]) => {
      const all: TimelineEvent[] = [];

      workRes.data?.forEach(w => {
        all.push({
          id: `w-${w.id}`,
          year: w.start_year || 0,
          month: w.start_month || undefined,
          type: "work",
          title: w.title,
          subtitle: w.company,
          description: w.is_current ? "Present" : w.end_year ? `Until ${w.end_year}` : undefined,
          isCurrent: w.is_current,
        });
      });

      eduRes.data?.forEach(e => {
        all.push({
          id: `e-${e.id}`,
          year: e.start_year || 0,
          type: "education",
          title: e.degree || "Study",
          subtitle: e.institution,
          description: e.field || undefined,
        });
      });

      achRes.data?.forEach(a => {
        const d = new Date(a.achieved_at);
        all.push({
          id: `a-${a.id}`,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          type: "achievement",
          title: a.achievement_key.replace(/_/g, " "),
          subtitle: "Achievement unlocked",
        });
      });

      all.sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0));
      setEvents(all);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const icons = { work: Briefcase, education: GraduationCap, achievement: Trophy };
  const colors = { work: "text-primary", education: "text-blue-500", achievement: "text-amber-500" };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No timeline data yet. Add work history, education, or earn achievements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-base font-semibold text-foreground">Career Timeline</h2>
      <div className="relative pl-8 space-y-0">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
        {events.map((ev, i) => {
          const Icon = icons[ev.type];
          return (
            <div key={ev.id} className="relative pb-6 last:pb-0">
              <div className={`absolute left-[-1.25rem] top-1 h-6 w-6 rounded-full bg-card border-2 border-border flex items-center justify-center`}>
                <Icon className={`h-3 w-3 ${colors[ev.type]}`} />
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    {ev.month ? `${String(ev.month).padStart(2, "0")}/` : ""}{ev.year || "—"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] capitalize">{ev.type}</Badge>
                  {ev.isCurrent && <Badge className="text-[10px] bg-verdict-go/20 text-verdict-go border-0">Current</Badge>}
                </div>
                <p className="text-sm font-medium text-foreground">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.subtitle}{ev.description ? ` · ${ev.description}` : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineTab;
