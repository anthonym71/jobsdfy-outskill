import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, FileText, Image, Mic, ArrowRight, Sparkles, AlertTriangle, ClipboardPaste, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const NewJob = () => {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExtract = async () => {
    const input = tab === "url" ? url.trim() : text.trim();
    if (!input) {
      toast({ title: "Missing input", description: "Please provide a job URL or description text.", variant: "destructive" });
      return;
    }

    setExtracting(true);
    try {
      const payload = tab === "url" ? { url: input } : { text: input };
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json();

      if (!resp.ok || data?.success === false) {
        toast({
          title: data?.unsupported ? "Unsupported URL" : "Extraction failed",
          description: data.error || "Something went wrong.",
          variant: data?.unsupported ? "default" : "destructive",
        });
        return;
      }

      setExtracted(data.data);
    } catch (err) {
      console.error("Extraction error:", err);
      toast({ title: "Network error", description: "Could not reach the extraction service.", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const handleContinue = async () => {
    if (!user || !extracted) return;
    setSaving(true);

    try {
      // Collect edited values from the form
      const formEl = document.getElementById("extraction-form") as HTMLFormElement;
      const formData = new FormData(formEl);
      const edited: Record<string, string> = {};
      formData.forEach((val, key) => { edited[key] = val as string; });

      const { data: job, error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: edited.title || extracted.title || "",
        company: edited.company || extracted.company || "",
        location: edited.location || extracted.location || "",
        salary_min: parseInt(edited.salaryMin || extracted.salaryMin) || 0,
        salary_max: parseInt(edited.salaryMax || extracted.salaryMax) || 0,
        salary_currency: edited.salaryCurrency || extracted.salaryCurrency || "USD",
        work_model: edited.workModel || extracted.workModel || "",
        employment_type: edited.employmentType || extracted.employmentType || "",
        visa_policy: edited.visaPolicy || extracted.visaPolicy || "",
        language_requirements: edited.languageRequirements || extracted.languageRequirements || "",
        recruiter_name: edited.recruiterName || extracted.recruiterName || "",
        description: edited.description || extracted.description || "",
        requirements_summary: edited.requirementsSummary || extracted.requirementsSummary || "",
        application_url: edited.applicationUrl || extracted.applicationUrl || "",
        source_type: tab as any,
        source_input: tab === "url" ? url : text,
      }).select().single();

      if (error) throw error;

      navigate(`/app/dealbreakers/${job.id}`);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Error saving job", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Check a Job</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste a link, text, screenshot, or voice note. We'll extract the details.</p>
      </div>

      {!extracted ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="url" className="text-xs gap-1.5"><Link2 className="h-3.5 w-3.5" />URL</TabsTrigger>
              <TabsTrigger value="text" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" />Text</TabsTrigger>
              <TabsTrigger value="screenshot" className="text-xs gap-1.5"><Image className="h-3.5 w-3.5" />Screenshot</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs gap-1.5"><Mic className="h-3.5 w-3.5" />Voice</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div><Label>Job URL</Label><Input placeholder="https://company.com/careers/role-id" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            </TabsContent>
            <TabsContent value="text" className="space-y-4 mt-4">
              <div><Label>Job Description</Label><Textarea placeholder="Paste the full job description here…" rows={8} value={text} onChange={(e) => setText(e.target.value)} /></div>
            </TabsContent>
            <TabsContent value="screenshot" className="mt-4">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <Image className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Drop a screenshot here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                <Button variant="outline" size="sm" className="mt-4">Choose File</Button>
              </div>
            </TabsContent>
            <TabsContent value="voice" className="mt-4">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <Mic className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Upload a voice note</p>
                <p className="text-xs text-muted-foreground mt-1">Describe the job and we'll extract the details</p>
                <Button variant="outline" size="sm" className="mt-4">Choose File</Button>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleExtract} disabled={extracting} className="w-full">
            {extracting ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Extracting job details…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extract Job
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <form id="extraction-form" className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Extraction Preview</h2>
              <span className="text-xs text-muted-foreground bg-accent rounded-full px-2.5 py-1">AI extracted</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(extracted).map(([key, value]) => (
                <div key={key} className={key === "description" || key === "requirementsSummary" ? "sm:col-span-2" : ""}>
                  <Label className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  {(key === "description" || key === "requirementsSummary") ? (
                    <Textarea name={key} className="mt-1" rows={3} defaultValue={value as string} />
                  ) : (
                    <Input name={key} className="mt-1" defaultValue={value as string} />
                  )}
                </div>
              ))}
            </div>
          </form>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setExtracted(null)}>Start Over</Button>
            <Button onClick={handleContinue} disabled={saving}>
              {saving ? "Saving…" : "Continue to Dealbreaker Check"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewJob;
