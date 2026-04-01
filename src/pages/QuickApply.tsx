import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VerdictBadge from "@/components/VerdictBadge";

const mockJob = {
  title: "Senior Frontend Engineer",
  company: "Acme Corp",
  mustHaves: ["5+ years React/TypeScript", "Design system experience", "German B2+", "EU work permit"],
  emphasisPoints: ["Led migration to modern React stack", "Built shared component library used by 4 teams"],
};

const defaultDrafts = {
  resume: `JANE DOE — Senior Frontend Engineer\n\nSummary:\n7 years of experience building scalable web applications with React and TypeScript. Led design system initiatives serving 4+ product teams.\n\nHighlights:\n• Led full migration from legacy jQuery to React 18 + TypeScript\n• Designed and maintained a shared component library (50+ components)\n• Reduced bundle size by 40% through code splitting and lazy loading\n• Mentored 3 junior engineers on frontend best practices`,
  coverNote: `Hi,\n\nI'm excited about the Senior Frontend Engineer role at Acme Corp. With 7 years of React/TypeScript experience and a track record of building design systems at scale, I believe I'm a strong fit.\n\nI led a company-wide migration to modern React and built a shared component library used across 4 product teams. I'm fluent in English and German (B2+), and I'm based in Berlin.\n\nI'd love to discuss how I can contribute to your team.\n\nBest,\nJane`,
  recruiterNote: `Hi [Recruiter],\n\nI came across the Senior Frontend Engineer role at Acme Corp and wanted to reach out. I have 7 years of React/TypeScript experience and recently led a design system initiative at my current company.\n\nWould love to connect if the role is still open.\n\nBest,\nJane`,
};

const QuickApply = () => {
  const [drafts, setDrafts] = useState(defaultDrafts);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Paste it wherever you need." });
  };

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
              <p className="font-heading text-base font-semibold text-foreground">{mockJob.title}</p>
              <p className="text-sm text-muted-foreground">{mockJob.company}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Must-Haves</p>
              <ul className="space-y-1.5">
                {mockJob.mustHaves.map((r) => (
                  <li key={r} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-verdict-go">✓</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your Emphasis Points</p>
              <ul className="space-y-1.5">
                {mockJob.emphasisPoints.map((p) => (
                  <li key={p} className="text-sm text-foreground">• {p}</li>
                ))}
              </ul>
            </div>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrafts((d) => ({ ...d, [key]: defaultDrafts[key] }))}>
                    <RefreshCw className="h-3.5 w-3.5" />
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
            <Button variant="outline">Save Draft</Button>
            <Button>
              <Check className="mr-2 h-4 w-4" />
              Approve Pack
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickApply;
