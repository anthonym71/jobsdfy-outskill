import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Briefcase } from "lucide-react";
import VerdictBadge, { type Verdict } from "@/components/VerdictBadge";
import StatusPill, { type JobStatus } from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";

interface Job {
  id: string;
  title: string;
  company: string;
  verdict: Verdict | null;
  fitScore: number | null;
  status: JobStatus;
  createdAt: string;
}

// Mock data — replace with Supabase
const mockJobs: Job[] = [];

const Jobs = () => {
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = mockJobs.filter((j) => {
    if (verdictFilter !== "all" && j.verdict !== verdictFilter) return false;
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Jobs Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">All jobs you've checked, organized by status.</p>
        </div>
        <Link to="/app/new-job">
          <Button><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            <SelectItem value="go">GO</SelectItem>
            <SelectItem value="review">REVIEW</SelectItem>
            <SelectItem value="stop">STOP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Briefcase />}
            title="No jobs here yet"
            description="Start by checking a job. We'll save everything for you to track and revisit."
            action={
              <Link to="/app/new-job">
                <Button><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => (
            <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.company} · {job.createdAt}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {job.fitScore && <span className="text-xs font-heading font-semibold text-muted-foreground">{job.fitScore}/10</span>}
                {job.verdict && <VerdictBadge verdict={job.verdict} />}
                <StatusPill status={job.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
