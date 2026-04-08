import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Briefcase, ShieldOff, Zap, Search, Loader2, Gift, Copy } from "lucide-react";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    if (!user) return;
    loadJobs();
    // Load referral link
    supabase.from("user_profiles").select("referral_link").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.referral_link) {
          setReferralLink(data.referral_link);
        } else {
          const link = `https://jobsdfy.com/r/${user.id.slice(0, 8)}`;
          setReferralLink(link);
        }
      });
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Dashboard — Job Seeker</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your job search at a glance.</p>
        </div>
        <Link to="/app/new-job">
          <Button size="sm" className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button>
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

      {/* Referral Widget */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Gift className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-foreground">Invite a Friend — Both Get 5 Credits</p>
            <p className="text-xs text-muted-foreground mt-0.5">Share your link and earn credits when friends sign up.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input value={referralLink} readOnly className="bg-muted text-xs flex-1 sm:w-48" />
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard.writeText(referralLink);
            toast({ title: "Copied!", description: "Referral link copied to clipboard." });
          }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
