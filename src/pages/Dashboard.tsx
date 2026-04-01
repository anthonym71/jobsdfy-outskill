import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, ShieldOff, Zap, Search } from "lucide-react";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";

// Mock data — replace with Supabase queries
const mockJobs: any[] = [];

const stats = [
  { label: "Jobs Checked", value: "0", icon: Search },
  { label: "Hard Stops Avoided", value: "0", icon: ShieldOff },
  { label: "Quick Apply Packs", value: "0", icon: Zap },
];

const verdictCounts = [
  { verdict: "go" as const, count: 0, label: "Worth applying" },
  { verdict: "review" as const, count: 0, label: "Needs review" },
  { verdict: "stop" as const, count: 0, label: "Hard blockers" },
];

const Dashboard = () => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your job search at a glance.</p>
        </div>
        <Link to="/app/new-job">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Check a Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
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

      {/* Verdict Summary */}
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

      {/* Recent Jobs */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Recent Jobs</h2>
        {mockJobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<Briefcase />}
              title="No jobs checked yet"
              description="Paste a job link or description to get started. We'll check for dealbreakers before you invest your time."
              action={
                <Link to="/app/new-job">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Check Your First Job
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {mockJobs.map((job: any) => (
              <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  {job.verdict && <VerdictBadge verdict={job.verdict} />}
                  {job.status && <StatusPill status={job.status} />}
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
