import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AppPack {
  resume: string;
  coverNote: string;
  recruiterNote: string;
  mustHaves: string[];
  emphasisPoints: string[];
}

const QuickApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [pack, setPack] = useState<AppPack | null>(null);
  const [drafts, setDrafts] = useState({ resume: "", coverNote: "", recruiterNote: "" });

  useEffect(() => {
    if (!id || !session) return;
    loadJobAndGenerate();
  }, [id, session]);

  const loadJobAndGenerate = async () => {
    setLoading(true);
    try {
      // Load job info
      const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).single();
      setJob(jobData);

      // Check for existing assets
      const { data: assets } = await supabase.from("application_assets").select("*").eq("job_id", id!);
      if (assets && assets.length >= 3) {
        const resume = assets.find((a) => a.asset_type === "resume")?.content || "";
        const coverNote = assets.find((a) => a.asset_type === "cover_note")?.content || "";
        const recruiterNote = assets.find((a) => a.asset_type === "recruiter_note")?.content || "";
        setDrafts({ resume, coverNote, recruiterNote });
        setPack({ resume, coverNote, recruiterNote, mustHaves: [], emphasisPoints: [] });
        setLoading(false);
        return;
      }

      // Generate new pack
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-application`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({ jobId: id }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: "Generation failed", description: data.error || "Something went wrong.", variant: "destructive" });
        return;
      }

      setPack(data.data);
      setDrafts({
        resume: data.data.resume,
        coverNote: data.data.coverNote,
        recruiterNote: data.data.recruiterNote,
      });
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "Error", description: "Could not generate application pack.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setLoading(true);
    // Delete existing assets to force regeneration
    await supabase.from("application_assets").delete().eq("job_id", id!);
    await loadJobAndGenerate();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Paste it wherever you need." });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete old and insert updated
      await supabase.from("application_assets").delete().eq("job_id", id!);
      const assets = [
        { job_id: id!, user_id: session!.user.id, asset_type: "resume", content: drafts.resume },
        { job_id: id!, user_id: session!.user.id, asset_type: "cover_note", content: drafts.coverNote },
        { job_id: id!, user_id: session!.user.id, asset_type: "recruiter_note", content: drafts.recruiterNote },
      ];
      const { error } = await supabase.from("application_assets").insert(assets);
      if (error) throw error;
      toast({ title: "Drafts saved" });
    } catch (err: any) {
      toast({ title: "Save error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    await handleSave();
    await supabase.from("jobs").update({ status: "applied" }).eq("id", id!);
    await supabase.from("application_assets").update({ approved: true }).eq("job_id", id!);
    toast({ title: "Pack approved!", description: "Status updated to Applied." });
    navigate("/app");
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
        <h1 className="font-heading text-2xl font-bold text-foreground">Quick Apply Pack</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-verdict-go" />
          Nothing goes out without your approval.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Job highlights */}
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
        </div>

        {/* Right: Editable drafts */}
        <div className="lg:col-span-3 space-y-5">
          {([
            { key: "resume" as const, label: "Tailored Resume Draft" },
            { key: "coverNote" as const, label: "Cover Note" },
            { key: "recruiterNote" as const, label: "Recruiter Message" },
          ]).map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">{label}</h3>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(drafts[key], label)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
              <RefreshCw className="mr-1.5 h-4 w-4" />Regenerate
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
