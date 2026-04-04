import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Sparkles, CheckCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import VoiceInterviewBot from "./VoiceInterviewBot";

const InterviewPracticeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, any>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scoringIndex, setScoringIndex] = useState<number | null>(null);

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
      if (data?.error) throw new Error(data.error);
      setQuestions(data?.data?.questions || []);
      setSessionId(data?.data?.sessionId || null);
      setAnswers({});
      setFeedback({});
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate questions", variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const handleScoreAnswer = async (index: number) => {
    if (!answers[index]?.trim() || !sessionId) return;
    setScoringIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke("interview-practice", {
        body: { sessionId, questionIndex: index, answer: answers[index] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFeedback(prev => ({ ...prev, [index]: data?.data }));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to score answer", variant: "destructive" });
    } finally { setScoringIndex(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Interview Practice</h2>
        <p className="text-sm text-muted-foreground">Practice interview questions with AI feedback using STAR methodology.</p>
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
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your answer…"
                  value={answers[i] || ""}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScoreAnswer(i)}
                  disabled={!answers[i]?.trim() || scoringIndex === i}
                >
                  {scoringIndex === i ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  Get Feedback
                </Button>
              </div>
              {feedback[i] && (
                <div className="rounded-lg bg-accent/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Score: {feedback[i].score}/10</p>
                  </div>
                  {feedback[i].strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">What was good</p>
                      <ul className="space-y-0.5">
                        {feedback[i].strengths.map((s: string, si: number) => (
                          <li key={si} className="text-sm text-foreground flex items-start gap-1.5">
                            <span className="text-primary shrink-0">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback[i].improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Could be stronger</p>
                      <ul className="space-y-0.5">
                        {feedback[i].improvements.map((s: string, si: number) => (
                          <li key={si} className="text-sm text-foreground flex items-start gap-1.5">
                            <span className="text-muted-foreground shrink-0">→</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback[i].suggestedAnswer && (
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">Suggested stronger answer</p>
                      <p className="text-sm text-foreground bg-background rounded-md p-3 border border-border">{feedback[i].suggestedAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewPracticeTab;
