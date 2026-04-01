import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import VerdictBadge from "@/components/VerdictBadge";
import StatusPill from "@/components/StatusPill";
import BlockerCard from "@/components/BlockerCard";
import FitScoreCard from "@/components/FitScoreCard";
import { Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{job.title || "Untitled"}</h1>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
        </div>
        <div className="flex items-center gap-2">
          {job.verdict && <VerdictBadge verdict={job.verdict} />}
          <StatusPill status={job.status} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dealbreakers">Dealbreakers</TabsTrigger>
          <TabsTrigger value="fit">Fit</TabsTrigger>
          <TabsTrigger value="pack">Application Pack</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
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
          <div className="flex gap-3 mt-4">
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

        <TabsContent value="dealbreakers" className="mt-6">
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

        <TabsContent value="fit" className="mt-6">
          {!match ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Run the fit analysis to see results.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <FitScoreCard
                score={Number(match.fit_score)}
                confidence={Number(match.fit_confidence) >= 7 ? "high" : Number(match.fit_confidence) >= 4 ? "medium" : "low"}
              />
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
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

        <TabsContent value="pack" className="mt-6">
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
