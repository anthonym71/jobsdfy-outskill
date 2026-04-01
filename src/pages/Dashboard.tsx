import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, ShieldOff, Zap, Search, Loader2 } from "lucide-react";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadJobs();
  }, [user]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setJobs(data || []);
    setLoading(false);
  };

  const goCount = jobs.filter((j) => j.verdict === "go").length;
  const reviewCount = jobs.filter((j) => j.verdict === "review").length;
  const stopCount = jobs.filter((j) => j.verdict === "stop").length;

  const stats = [
    { label: "Jobs Checked", value: String(jobs.length), icon: Search },
    { label: "Hard Stops Avoided", value: String(stopCount), icon: ShieldOff },
    { label: "Quick Apply Packs", value: String(jobs.filter((j) => j.status === "applied").length), icon: Zap },
  ];

  const verdictCounts = [
    { verdict: "go" as const, count: goCount, label: "Worth applying" },
    { verdict: "review" as const, count: reviewCount, label: "Needs review" },
    { verdict: "stop" as const, count: stopCount, label: "Hard blockers" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your job search at a glance.</p>
        </div>
        <Link to="/app/new-job">
          <Button><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <s.icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {verdictCounts.map((v) => (
          <div key={v.verdict} className={`rounded-xl border p-5 verdict-banner-${v.verdict}`}>
            <div className="flex items-center justify-between mb-2">
              <VerdictBadge verdict={v.verdict} />
              <span className="font-heading text-2xl font-bold text-foreground">{v.count}</span>
            </div>
            <p className="text-xs text-muted-foreground">{v.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Recent Jobs</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<Briefcase />}
              title="No jobs checked yet"
              description="Paste a job link or description to get started. We'll check for dealbreakers before you invest your time."
              action={<Link to="/app/new-job"><Button><PlusCircle className="mr-2 h-4 w-4" />Check Your First Job</Button></Link>}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{job.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {job.verdict && <VerdictBadge verdict={job.verdict} />}
                  <StatusPill status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
