import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill, { type JobStatus } from "@/components/StatusPill";
import BlockerCard from "@/components/BlockerCard";
import FitScoreCard from "@/components/FitScoreCard";
import { Loader2, ArrowRight, ExternalLink, Trash2, MoreVertical, Archive, Bookmark, RotateCcw, FileText, Search, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusTransitions: { value: JobStatus; label: string; icon: typeof Bookmark }[] = [
  { value: "saved", label: "Save Job", icon: Bookmark },
  { value: "reviewing", label: "Mark Reviewing", icon: RotateCcw },
  { value: "archived", label: "Archive", icon: Archive },
];

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [blockers, setBlockers] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    loadAll();
  }, [id, user]);

  const loadAll = async () => {
    const [jobRes, blockersRes, matchRes, assetsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", id!).single(),
      supabase.from("job_blockers").select("*").eq("job_id", id!).order("created_at"),
      supabase.from("job_matches").select("*").eq("job_id", id!).single(),
      supabase.from("application_assets").select("*").eq("job_id", id!).order("created_at"),
    ]);

    setJob(jobRes.data);
    setBlockers(blockersRes.data || []);
    setMatch(matchRes.data);
    setAssets(assetsRes.data || []);
    setLoading(false);
  };

  const updateStatus = async (status: JobStatus) => {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id!);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setJob((j: any) => ({ ...j, status }));
      toast({ title: `Status updated to ${status}` });
    }
  };

  const updateVerdict = async (verdict: "go" | "review" | "stop") => {
    const { error } = await supabase.from("jobs").update({ verdict }).eq("id", id!);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setJob((j: any) => ({ ...j, verdict }));
      toast({ title: `Verdict overridden to ${verdict.toUpperCase()}` });
    }
  };

  const deleteJob = async () => {
    if (!confirm("Delete this job and all related data? This cannot be undone.")) return;
    await Promise.all([
      supabase.from("application_assets").delete().eq("job_id", id!),
      supabase.from("job_blockers").delete().eq("job_id", id!),
      supabase.from("job_matches").delete().eq("job_id", id!),
    ]);
    await supabase.from("jobs").delete().eq("id", id!);
    toast({ title: "Job deleted" });
    navigate("/app");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Job not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return "Not specified";
    return `${job.salary_currency} ${job.salary_min?.toLocaleString() || "?"} – ${job.salary_max?.toLocaleString() || "?"}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">{job.title || "Untitled"}</h1>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {job.verdict && <VerdictBadge verdict={job.verdict} />}
          <StatusPill status={job.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusTransitions.map((t) => (
                <DropdownMenuItem key={t.value} onClick={() => updateStatus(t.value)}>
                  <t.icon className="mr-2 h-4 w-4" />{t.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {job.verdict && (
                <>
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>Override Verdict</DropdownMenuItem>
                  {(["go", "review", "stop"] as const).filter(v => v !== job.verdict).map(v => (
                    <DropdownMenuItem key={v} onClick={() => updateVerdict(v)}>
                      Override to {v.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="text-destructive" onClick={deleteJob}>
                <Trash2 className="mr-2 h-4 w-4" />Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-4 text-xs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dealbreakers">Blockers</TabsTrigger>
          <TabsTrigger value="fit">Fit</TabsTrigger>
          <TabsTrigger value="pack">Pack</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Title:</span> <span className="font-medium text-foreground ml-2">{job.title}</span></div>
              <div><span className="text-muted-foreground">Company:</span> <span className="font-medium text-foreground ml-2">{job.company}</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="font-medium text-foreground ml-2">{job.location}</span></div>
              <div><span className="text-muted-foreground">Salary:</span> <span className="font-medium text-foreground ml-2">{formatSalary()}</span></div>
              <div><span className="text-muted-foreground">Work Model:</span> <span className="font-medium text-foreground ml-2">{job.work_model || "Not specified"}</span></div>
              <div><span className="text-muted-foreground">Employment:</span> <span className="font-medium text-foreground ml-2">{job.employment_type || "Not specified"}</span></div>
              <div><span className="text-muted-foreground">Visa Policy:</span> <span className="font-medium text-foreground ml-2">{job.visa_policy || "Not specified"}</span></div>
              <div><span className="text-muted-foreground">Languages:</span> <span className="font-medium text-foreground ml-2">{job.language_requirements || "Not specified"}</span></div>
            </div>
            {job.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-line">{job.description}</p>
              </div>
            )}
            {job.requirements_summary && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Requirements</p>
                <p className="text-sm text-foreground whitespace-pre-line">{job.requirements_summary}</p>
              </div>
            )}
            {job.application_url && (
              <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />View Original Posting
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {!job.verdict && (
              <Button size="sm" onClick={() => navigate(`/app/dealbreakers/${id}`)}>
                Run Dealbreaker Check <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
            {job.verdict && !match && (
              <Button size="sm" onClick={() => navigate(`/app/decision/${id}`)}>
                Run Fit Analysis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
            {match && assets.length === 0 && (
              <Button size="sm" onClick={() => navigate(`/app/apply/${id}`)}>
                Generate Quick Apply <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dealbreakers" className="mt-5">
          {blockers.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {job.verdict ? "No blockers recorded." : "Run the dealbreaker check to see results."}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {blockers.map((b) => (
                <BlockerCard
                  key={b.id}
                  category={b.category}
                  status={b.severity === "confirmed" ? "confirmed" : b.severity === "likely" ? "unclear" : "ok"}
                  userValue={b.user_value}
                  jobValue={b.job_value}
                  note={b.description}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fit" className="mt-5">
          {!match ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Run the fit analysis to see results.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              <FitScoreCard
                score={Number(match.fit_score)}
                confidence={Number(match.fit_confidence) >= 7 ? "high" : Number(match.fit_confidence) >= 4 ? "medium" : "low"}
              />
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-verdict-go mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {(match.strengths || []).map((s: string, i: number) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-verdict-go">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-verdict-review mb-2">Gaps</h3>
                  <ul className="space-y-1">
                    {(match.gaps || []).map((g: string, i: number) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-verdict-review">!</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
                {match.recommendation && (
                  <div className="rounded-lg bg-accent p-4">
                    <p className="text-sm text-muted-foreground">{match.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pack" className="mt-5">
          {assets.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Generate a Quick Apply pack to see your tailored documents here.
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-sm font-semibold text-foreground capitalize">
                      {asset.asset_type.replace("_", " ")}
                    </h3>
                    {asset.approved && (
                      <span className="text-xs bg-verdict-go-bg text-verdict-go rounded-full px-2 py-0.5">Approved</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{asset.content}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobDetail;
