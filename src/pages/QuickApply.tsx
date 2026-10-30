import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, RefreshCw, ShieldCheck, Loader2, Clock, FileText, Mail, MessageSquare, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";

interface AppPack {
  resume: string;
  coverNote: string;
  recruiterNote: string;
  mustHaves: string[];
  emphasisPoints: string[];
}

interface PackVersion {
  version: number;
  resume: string;
  coverNote: string;
  recruiterNote: string;
  isDraft: boolean;
  submittedAt: string | null;
  createdAt: string;
}

interface TimelineEvent {
  year: number;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  growthIndicator?: string;
}

interface TimelineData {
  timelineEvents: TimelineEvent[];
  careerThemes: string[];
  growthPattern: string;
  totalYears?: number;
}

const QuickApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cvOptions, setCvOptions] = useState<{ id: string; version_name: string }[]>([]);
  const [selectedCv, setSelectedCv] = useState("profile");
  const { session } = useAuth();
  const { toast } = useToast();
  const { credits, spendCredits, loading: creditsLoading } = useCredits();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [pack, setPack] = useState<AppPack | null>(null);
  const [drafts, setDrafts] = useState({ resume: "", coverNote: "", recruiterNote: "" });
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [versions, setVersions] = useState<PackVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(0);

  useEffect(() => {
    if (!id || !session) return;
    if (creditsLoading) return; // Wait for credits to load
    loadJobAndPacks();
  }, [id, session, creditsLoading]);

  useEffect(() => {
    if (!session) return;
    supabase.from("cv_versions").select("id, version_name").eq("user_id", session.user.id).order("created_at", { ascending: false })
      .then(({ data }) => setCvOptions(data || []));
  }, [session?.user.id]);

  const loadJobAndPacks = async () => {
    setLoading(true);
    try {
      const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).single();
      setJob(jobData);

      const { data: assets } = await supabase
        .from("application_assets")
        .select("*")
        .eq("job_id", id!)
        .order("version", { ascending: true });

      if (assets && assets.length > 0) {
        // Group by version
        const versionMap = new Map<number, PackVersion>();
        for (const a of assets) {
          const v = (a as any).version || 1;
          if (!versionMap.has(v)) {
            versionMap.set(v, {
              version: v,
              resume: "",
              coverNote: "",
              recruiterNote: "",
              isDraft: (a as any).is_draft ?? true,
              submittedAt: (a as any).submitted_at || null,
              createdAt: a.created_at,
            });
          }
          const entry = versionMap.get(v)!;
          if (a.asset_type === "resume") entry.resume = a.content || "";
          if (a.asset_type === "cover_note") entry.coverNote = a.content || "";
          if (a.asset_type === "recruiter_note") entry.recruiterNote = a.content || "";
        }

        const allVersions = Array.from(versionMap.values()).sort((a, b) => a.version - b.version);
        setVersions(allVersions);

        // Show the latest version
        const latest = allVersions[allVersions.length - 1];
        setActiveVersion(latest.version);
        setDrafts({ resume: latest.resume, coverNote: latest.coverNote, recruiterNote: latest.recruiterNote });
        setPack({ resume: latest.resume, coverNote: latest.coverNote, recruiterNote: latest.recruiterNote, mustHaves: [], emphasisPoints: [] });
        setLoading(false);
        return;
      }

      // Let the user choose a CV before spending credits on the first pack.
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "Error", description: "Could not load application pack.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateNewPack = async (version: number) => {
    if (!session || !id) return;
    if (!credits || credits.balance < 3) {
      toast({ title: "Insufficient credits", description: "You need 3 credits to generate an application pack.", variant: "destructive" });
      return;
    }
    const spent = await spendCredits(3, "generate_application_pack");
    if (!spent) return;

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-application`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ jobId: id, version, cvVersionId: selectedCv === "profile" ? null : selectedCv }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      toast({ title: "Generation failed", description: data.error || "Something went wrong.", variant: "destructive" });
      return;
    }

    const newVersion: PackVersion = {
      version,
      resume: data.data.resume,
      coverNote: data.data.coverNote,
      recruiterNote: data.data.recruiterNote,
      isDraft: true,
      submittedAt: null,
      createdAt: new Date().toISOString(),
    };

    setVersions(prev => [...prev, newVersion]);
    setActiveVersion(version);
    setPack(data.data);
    setDrafts({ resume: data.data.resume, coverNote: data.data.coverNote, recruiterNote: data.data.recruiterNote });
  };

  const regenerate = async () => {
    setLoading(true);
    try {
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;
      await generateNewPack(nextVersion);
    } catch (err) {
      console.error("Regenerate error:", err);
      toast({ title: "Error", description: "Could not regenerate pack.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const switchVersion = (v: PackVersion) => {
    setActiveVersion(v.version);
    setDrafts({ resume: v.resume, coverNote: v.coverNote, recruiterNote: v.recruiterNote });
    setPack({ resume: v.resume, coverNote: v.coverNote, recruiterNote: v.recruiterNote, mustHaves: [], emphasisPoints: [] });
  };

  const deleteVersion = async (version: number) => {
    const v = versions.find(vv => vv.version === version);
    if (!v || !v.isDraft) {
      toast({ title: "Cannot delete", description: "Submitted packs cannot be deleted.", variant: "destructive" });
      return;
    }
    // Use type assertion to work around generated types not knowing about version column yet
    const { error } = await supabase.from("application_assets").delete().eq("job_id", id!);
    if (!error) {
      // Re-insert all versions except the deleted one
      const remaining = versions.filter(vv => vv.version !== version);
      for (const rv of remaining) {
        await supabase.from("application_assets").insert([
          { job_id: id!, user_id: session!.user.id, asset_type: "resume", content: rv.resume },
          { job_id: id!, user_id: session!.user.id, asset_type: "cover_note", content: rv.coverNote },
          { job_id: id!, user_id: session!.user.id, asset_type: "recruiter_note", content: rv.recruiterNote },
        ]);
      }
      setVersions(remaining);
      if (remaining.length > 0) {
        switchVersion(remaining[remaining.length - 1]);
      } else {
        setPack(null);
      }
    }
    toast({ title: "Draft deleted" });
  };

  const handleGenerateTimeline = async () => {
    if (!session) return;
    setGeneratingTimeline(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setTimeline(data.data);
      setShowTimeline(true);
      toast({ title: "Timeline generated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingTimeline(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Paste it wherever you need." });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete only the current version's assets then re-insert
      // Since types.ts doesn't know about 'version' column yet, we delete all and re-insert
      await supabase.from("application_assets").delete().eq("job_id", id!);
      const allAssets: any[] = [];
      for (const v of versions) {
        const data = v.version === activeVersion
          ? { resume: drafts.resume, coverNote: drafts.coverNote, recruiterNote: drafts.recruiterNote }
          : { resume: v.resume, coverNote: v.coverNote, recruiterNote: v.recruiterNote };
        allAssets.push(
          { job_id: id!, user_id: session!.user.id, asset_type: "resume", content: data.resume, version: v.version, is_draft: v.isDraft },
          { job_id: id!, user_id: session!.user.id, asset_type: "cover_note", content: data.coverNote, version: v.version, is_draft: v.isDraft },
          { job_id: id!, user_id: session!.user.id, asset_type: "recruiter_note", content: data.recruiterNote, version: v.version, is_draft: v.isDraft },
        );
      }
      const { error } = await supabase.from("application_assets").insert(allAssets);
      if (error) throw error;

      // Update local version state
      setVersions(prev => prev.map(v =>
        v.version === activeVersion
          ? { ...v, resume: drafts.resume, coverNote: drafts.coverNote, recruiterNote: drafts.recruiterNote }
          : v
      ));
      toast({ title: "Drafts saved" });
    } catch (err: any) {
      toast({ title: "Save error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    await handleSave();
    // Mark this version as submitted
    await (supabase
      .from("application_assets")
      .update({ approved: true, is_draft: false, submitted_at: new Date().toISOString() } as any)
      .eq("job_id", id!) as any);
    await supabase.from("jobs").update({ status: "applied" }).eq("id", id!);

    setVersions(prev => prev.map(v =>
      v.version === activeVersion ? { ...v, isDraft: false, submittedAt: new Date().toISOString() } : v
    ));

    toast({ title: "Pack approved!", description: "Status updated to Applied." });
    navigate("/app");
  };

  const growthColor = (g?: string) => {
    switch (g) {
      case "promotion": return "text-verdict-go";
      case "leadership": return "text-primary";
      case "pivot": return "text-amber-500";
      default: return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating your application pack…</p>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Could not generate application pack.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">Application Pack</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-verdict-go" />
          Nothing goes out without your approval.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Job highlights + Versions + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">{job?.title || "Job"}</p>
              <p className="text-sm text-muted-foreground">{job?.company}</p>
            </div>
            {pack.mustHaves?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Must-Haves</p>
                <ul className="space-y-1.5">
                  {pack.mustHaves.map((r) => (
                    <li key={r} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-verdict-go">✓</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pack.emphasisPoints?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your Emphasis Points</p>
                <ul className="space-y-1.5">
                  {pack.emphasisPoints.map((p) => (
                    <li key={p} className="text-sm text-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pack Versions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {searchParams.get("tailor") === "1" && <p className="text-sm text-verdict-review">This job was not a strong fit. Choose a CV and create a version tailored more closely to the role.</p>}
            <label htmlFor="cv-choice" className="font-heading text-sm font-semibold text-foreground">CV to use</label>
            <select id="cv-choice" value={selectedCv} onChange={e => setSelectedCv(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="profile">My main profile</option>
              {cvOptions.map(cv => <option key={cv.id} value={cv.id}>{cv.version_name}</option>)}
            </select>
            <Button size="sm" variant="outline" className="w-full" onClick={regenerate} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />Create tailored version with this CV (3 credits)
            </Button>
          </div>

          {versions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">Pack Versions</h3>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.version}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                      v.version === activeVersion
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => switchVersion(v)}
                  >
                    <div>
                      <span className="font-medium text-foreground">Version {v.version}</span>
                      <span className={`ml-2 text-xs ${v.isDraft ? "text-amber-500" : "text-verdict-go"}`}>
                        {v.isDraft ? "Draft" : "Submitted"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {v.isDraft && versions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); deleteVersion(v.version); }}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Career Timeline
              </h3>
              {timeline && (
                <Button variant="ghost" size="sm" onClick={() => setShowTimeline(!showTimeline)} className="h-7 w-7 p-0">
                  {showTimeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {!timeline ? (
              <Button variant="outline" size="sm" onClick={handleGenerateTimeline} disabled={generatingTimeline} className="w-full">
                {generatingTimeline ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                Generate Timeline
              </Button>
            ) : showTimeline && (
              <div className="space-y-3">
                {timeline.careerThemes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {timeline.careerThemes.map((t, i) => (
                      <span key={i} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{timeline.growthPattern}</p>
                <div className="space-y-2 border-l-2 border-border pl-4">
                  {timeline.timelineEvents?.map((evt, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                      <p className="text-xs text-muted-foreground">{evt.year}</p>
                      <p className="text-sm font-medium text-foreground">{evt.title}</p>
                      {evt.subtitle && <p className="text-xs text-muted-foreground">{evt.subtitle}</p>}
                      {evt.growthIndicator && (
                        <span className={`text-[10px] font-medium ${growthColor(evt.growthIndicator)}`}>
                          {evt.growthIndicator}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editable drafts */}
        <div className="lg:col-span-3 space-y-5">
          {([
            { key: "resume" as const, label: "Tailored Resume Draft", icon: FileText },
            { key: "coverNote" as const, label: "Cover Note", icon: Mail },
            { key: "recruiterNote" as const, label: "Recruiter Message", icon: MessageSquare },
          ]).map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(drafts[key], label)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Textarea
                rows={key === "resume" ? 10 : 6}
                value={drafts[key]}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                className="text-sm"
              />
            </div>
          ))}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={regenerate}>
              <RefreshCw className="mr-1.5 h-4 w-4" />Regenerate (3 credits)
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Draft"}
            </Button>
            <Button onClick={handleApprove}>
              <Check className="mr-2 h-4 w-4" />Approve Pack
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickApply;