import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Briefcase, Loader2, MapPin, Building2, Eye, EyeOff, Send } from "lucide-react";
import VerdictBadge, { type Verdict } from "@/components/VerdictBadge";
import StatusPill, { type JobStatus } from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

/** Extract a short job identifier from a URL (e.g. LinkedIn /view/12345 → "12345") */
const extractJobUrlId = (input: string): string | null => {
  const viewMatch = input.match(/\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];
  const currentJobMatch = input.match(/currentJobId=(\d+)/);
  if (currentJobMatch) return currentJobMatch[1];
  return null;
};

const Jobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    const [seekerRes, posterRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("recruiter_job_posts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setJobs(seekerRes.data || []);
    setPostedJobs(posterRes.data || []);
    setLoading(false);
  };

  const toggleActive = async (jobId: string, currentActive: boolean) => {
    const { error } = await supabase.from("recruiter_job_posts").update({ is_active: !currentActive, updated_at: new Date().toISOString() }).eq("id", jobId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPostedJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: !currentActive } : j));
    }
  };

  const filtered = jobs.filter((j) => {
    if (verdictFilter !== "all" && j.verdict !== verdictFilter) return false;
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
      <Tabs defaultValue="seeking">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Jobs</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track jobs you're seeking or manage jobs you're hiring for.</p>
          </div>
          <TabsList>
            <TabsTrigger value="seeking">Seeking ({jobs.length})</TabsTrigger>
            <TabsTrigger value="hiring">Hiring ({postedJobs.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* SEEKING TAB */}
        <TabsContent value="seeking" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap items-center">
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
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="pending_decision">Pending Decision</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Link to="/app/new-job">
              <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={<Briefcase />}
                title="No jobs here yet"
                description="Start by checking a job. We'll save everything for you to track and revisit."
                action={<Link to="/app/new-job"><Button><PlusCircle className="mr-2 h-4 w-4" />Check a Job</Button></Link>}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((job) => {
                const jobUrlId = extractJobUrlId(job.application_url || job.source_input || "");
                return (
                  <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">{job.title || "Untitled"}</p>
                        {jobUrlId && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">#{jobUrlId}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{job.company} · {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {job.fit_score && <span className="text-xs font-heading font-semibold text-muted-foreground">{job.fit_score}/10</span>}
                      {job.verdict && <VerdictBadge verdict={job.verdict} />}
                      <StatusPill status={job.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* HIRING TAB */}
        <TabsContent value="hiring" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Link to="/app/post-job">
              <Button size="sm"><Send className="mr-2 h-4 w-4" />Post a Job</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : postedJobs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={<Send />}
                title="No jobs posted yet"
                description="Post a job listing and let seekers find your opportunity."
                action={<Link to="/app/post-job"><Button><Send className="mr-2 h-4 w-4" />Post a Job</Button></Link>}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {postedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{job.title || "Untitled"}</p>
                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                      {job.company && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company}</span>}
                      {job.city && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}, {job.country}</span>}
                      <Badge variant={job.is_active ? "default" : "secondary"} className="text-xs">
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Posted {new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{job.is_active ? "Active" : "Inactive"}</span>
                      <Switch checked={job.is_active} onCheckedChange={() => toggleActive(job.id, job.is_active)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jobs;
