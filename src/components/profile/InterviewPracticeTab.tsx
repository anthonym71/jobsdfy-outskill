import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const InterviewPracticeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("id, title, company").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setJobs(data);
      setLoading(false);
    });
  }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-practice", {
        body: { jobId: selectedJobId || null },
      });
      if (error) throw error;
      setQuestions(data?.questions || ["Tell me about yourself.", "Why are you interested in this role?", "What are your strengths?", "Describe a challenge you overcame.", "Where do you see yourself in 5 years?"]);
      setAnswers({});
      setFeedback({});
    } catch {
      // Fallback questions if edge function not ready
      setQuestions(["Tell me about yourself.", "Why are you interested in this role?", "What are your strengths?", "Describe a challenge you overcame.", "Where do you see yourself in 5 years?"]);
      setAnswers({});
      setFeedback({});
    } finally { setGenerating(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Interview Practice</h2>
        <p className="text-sm text-muted-foreground">Practice interview questions with AI feedback. V2 will include voice AI.</p>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground">Practice for a specific job?</label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="General practice" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Practice</SelectItem>
              {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Generate Questions
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground">{q}</p>
              </div>
              <Textarea
                placeholder="Type your answer…"
                value={answers[i] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                rows={3}
              />
              {feedback[i] && (
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs font-medium text-primary mb-1">AI Feedback</p>
                  <p className="text-sm text-foreground">{feedback[i]}</p>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">AI scoring & feedback per answer coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default InterviewPracticeTab;
