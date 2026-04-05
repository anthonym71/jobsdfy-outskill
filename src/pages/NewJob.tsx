import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();

  const [autoExtractPending, setAutoExtractPending] = useState(false);
  const [isExtensionImport, setIsExtensionImport] = useState(false);

  // Auto-fill from Chrome extension
  useEffect(() => {
    const source = searchParams.get("source");
    const extText = searchParams.get("text");
    const shareUrl = searchParams.get("url");
    const shareTitle = searchParams.get("title");

    if (source === "extension" && extText) {
      setText(extText);
      setIsExtensionImport(true);
      setTab("text");
      setAutoExtractPending(true);
      navigate("/app/new-job", { replace: true });
    } else if (shareUrl || (extText && !source)) {
      // PWA share target or bookmarklet — got a URL
      if (shareUrl) {
        setUrl(shareUrl);
        setTab("url");
      } else if (extText) {
        setText(extText);
        setTab("text");
      }
      setIsExtensionImport(true);
      setAutoExtractPending(true);
      navigate("/app/new-job", { replace: true });
    }
  }, [searchParams, navigate]);

  // Auto-trigger extraction after extension text is set
  useEffect(() => {
    if (autoExtractPending && text.trim()) {
      setAutoExtractPending(false);
      handleExtract();
    }
  }, [autoExtractPending, text]);

  const parseSalary = (value: unknown) => {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const saveJobRecord = async (
    values: Record<string, any>,
    options?: {
      sourceType?: "url" | "text" | "screenshot" | "voice";
      sourceInput?: string;
    }
  ) => {
    if (!user) throw new Error("You must be signed in to save a job.");

    const sourceType = options?.sourceType ?? (tab as "url" | "text" | "screenshot" | "voice");
    const sourceInput = options?.sourceInput ?? (sourceType === "url" ? url : text);

    const { data: job, error } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: values.title || "",
      company: values.company || "",
      location: values.location || "",
      salary_min: parseSalary(values.salaryMin),
      salary_max: parseSalary(values.salaryMax),
      salary_currency: values.salaryCurrency || "USD",
      work_model: values.workModel || "",
      employment_type: values.employmentType || "",
      visa_policy: values.visaPolicy || "",
      language_requirements: values.languageRequirements || "",
      recruiter_name: values.recruiterName || "",
      description: values.description || "",
      requirements_summary: values.requirementsSummary || "",
      application_url: values.applicationUrl || "",
      source_type: sourceType,
      source_input: sourceInput,
    }).select().single();

    if (error) throw error;
    return job;
  };

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

      const extractedData = data.data;
      setExtracted(extractedData);

      if (isExtensionImport) {
        setSaving(true);
        setIsExtensionImport(false);

        try {
          const job = await saveJobRecord(extractedData, {
            sourceType: "text",
            sourceInput: input,
          });

          toast({
            title: "Job imported",
            description: "Saved to Jobs and opening the dealbreaker check.",
          });

          navigate(`/app/dealbreakers/${job.id}`);
          return;
        } catch (err: any) {
          console.error("Auto-save error:", err);
          toast({
            title: "Job extracted but not saved",
            description: err.message || "Please review the extraction and save it manually.",
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      }
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

      const job = await saveJobRecord({
        ...extracted,
        ...edited,
      });

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

        {/* Chrome Extension Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <Chrome className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Chrome Extension Available</p>
            <p className="text-muted-foreground mt-0.5">
              Install our extension to send jobs from LinkedIn (or any site) with one click.{" "}
              <button onClick={() => {
                fetch("/ai-job-os-extension.zip").then(r => r.blob()).then(b => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(b);
                  a.download = "ai-job-os-extension.zip";
                  a.click();
                  URL.revokeObjectURL(a.href);
                });
              }} className="text-primary underline underline-offset-2">Download Extension</button>
            </p>
          </div>
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
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">LinkedIn, Indeed & some sites block scraping.</span>{" "}
                  If a URL doesn't work, use the <button onClick={() => setTab("text")} className="text-primary underline underline-offset-2">Smart Paste</button> tab instead — just Ctrl+A, Ctrl+C the page and paste it here.
                </p>
              </div>
              <div><Label>Job URL</Label><Input placeholder="https://company.com/careers/role-id" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            </TabsContent>
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
                <ClipboardPaste className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Works with any site including LinkedIn.</span>{" "}
                  Go to the job page → Select All (Ctrl+A) → Copy (Ctrl+C) → Paste below. Our AI will extract only the job details.
                </p>
              </div>
              <div><Label>Job Description</Label><Textarea placeholder="Paste everything from the job page here — headers, footers, and all. AI will find the job details automatically…" rows={10} value={text} onChange={(e) => setText(e.target.value)} /></div>
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
