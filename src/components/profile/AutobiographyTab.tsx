import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookOpen, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MODES = [
  { value: "full_autobiography", label: "Full Autobiography", desc: "A comprehensive book about your life journey" },
  { value: "story", label: "Specific Story", desc: "A story about a specific time, incident, or topic" },
  { value: "intro", label: "Speaker Intro / Bio", desc: "A short intro for events, Zoom calls, or guest speaking" },
];

const AutobiographyTab = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState("full_autobiography");
  const [topic, setTopic] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("professional");
  const [wordCount, setWordCount] = useState("500");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!session) return;
    setGenerating(true);
    setResult("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-autobiography`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode, topic, purpose, tone, wordCount: parseInt(wordCount) || 500, context }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setResult(data.content);
      toast({ title: "Generated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Autobiography / Bio</h2>
          <p className="text-sm text-muted-foreground">Premium feature — AI-generated stories from your knowledgebase.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <Label className="text-xs font-medium">What would you like to create?</Label>
          <div className="grid gap-2 sm:grid-cols-3 mt-2">
            {MODES.map(m => (
              <button key={m.value} onClick={() => setMode(m.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${mode === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {mode === "story" && (
          <div><Label className="text-xs">Topic / Time Period / Incident</Label><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. My first startup, 2015-2018" className="mt-1" /></div>
        )}

        {mode === "intro" && (
          <div><Label className="text-xs">Purpose</Label><Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Guest Speaker at TEDx on AI leadership" className="mt-1" /></div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Tone</Label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tone} onChange={e => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="inspirational">Inspirational</option>
              <option value="humorous">Humorous</option>
              <option value="emotional">Emotional</option>
            </select>
          </div>
          <div><Label className="text-xs">Word Count</Label><Input type="number" value={wordCount} onChange={e => setWordCount(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Additional Context</Label><Input value={context} onChange={e => setContext(e.target.value)} placeholder="Intended outcome..." className="mt-1" /></div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleGenerate} disabled={generating} className="gap-1.5">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
          <span className="text-xs text-muted-foreground">
            Estimated cost: <span className="font-semibold text-primary">{Math.max(1, Math.ceil((parseInt(wordCount) || 500) / 500))} credit{Math.max(1, Math.ceil((parseInt(wordCount) || 500) / 500)) > 1 ? "s" : ""}</span>
          </span>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Generated Content</h3>
          </div>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{result}</div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result).then(() => toast({ title: "Copied!" }))}>Copy</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutobiographyTab;
