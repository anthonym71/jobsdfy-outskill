import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, FileText, Image, Mic, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewJob = () => {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExtract = async () => {
    setExtracting(true);
    // Placeholder: simulate extraction
    await new Promise((r) => setTimeout(r, 1500));
    setExtracted({
      title: "Senior Frontend Engineer",
      company: "Acme Corp",
      location: "Berlin, Germany",
      salaryMin: "70000",
      salaryMax: "95000",
      salaryCurrency: "EUR",
      workModel: "Hybrid",
      employmentType: "Full-time",
      visaPolicy: "EU work permit required",
      languageRequirements: "English (fluent), German (B2+)",
      recruiterName: "",
      description: "We're looking for a Senior Frontend Engineer to lead our design system…",
      requirementsSummary: "5+ years React/TypeScript, design systems, accessibility",
      applicationUrl: "https://acme.com/careers/123",
    });
    setExtracting(false);
  };

  const handleContinue = () => {
    // In production: save to DB, then navigate to dealbreaker check
    const mockJobId = "mock-1";
    navigate(`/app/dealbreakers/${mockJobId}`);
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
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Extraction Preview</h2>
              <span className="text-xs text-muted-foreground bg-accent rounded-full px-2.5 py-1">AI extracted</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(extracted).map(([key, value]) => (
                <div key={key} className={key === "description" || key === "requirementsSummary" ? "sm:col-span-2" : ""}>
                  <Label className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  {(key === "description" || key === "requirementsSummary") ? (
                    <Textarea className="mt-1" rows={3} defaultValue={value as string} />
                  ) : (
                    <Input className="mt-1" defaultValue={value as string} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setExtracted(null)}>Start Over</Button>
            <Button onClick={handleContinue}>
              Continue to Dealbreaker Check
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewJob;
