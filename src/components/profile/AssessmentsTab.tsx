import { useEffect, useState } from "react";
import { Loader2, Brain, Heart, Flame, Users, Target, Sparkles, Shield, Eye, Lightbulb, Compass, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const ASSESSMENTS = [
  {
    key: "drive",
    name: "DRIVE Assessment",
    description: "Emotional buying and building behaviour profiling — measures Director, Relator, Influencer, Validator, Executive.",
    icon: Flame,
    color: "text-orange-500",
  },
  {
    key: "mbti",
    name: "Myers-Briggs (MBTI)",
    description: "16 personality types based on preferences for Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving.",
    icon: Users,
    color: "text-purple-500",
  },
  {
    key: "disc",
    name: "DISC Profile",
    description: "Behavioural model measuring Dominance, Influence, Steadiness, and Conscientiousness in work style.",
    icon: Target,
    color: "text-blue-500",
  },
  {
    key: "iq",
    name: "IQ / Cognitive Ability",
    description: "General intelligence quotient measuring logical reasoning, pattern recognition, and problem-solving ability.",
    icon: Brain,
    color: "text-emerald-500",
  },
  {
    key: "big_five",
    name: "Big Five (OCEAN)",
    description: "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism — the gold standard personality model.",
    icon: BarChart3,
    color: "text-cyan-500",
  },
  {
    key: "personality_archetype",
    name: "Core Personality Archetypes",
    description: "Jungian-based archetypes: Hero, Creator, Sage, Explorer, Caregiver, Ruler, etc.",
    icon: Shield,
    color: "text-amber-600",
  },
  {
    key: "six_needs",
    name: "6 Human Needs",
    description: "Tony Robbins' framework: Certainty, Variety, Significance, Connection, Growth, Contribution.",
    icon: Heart,
    color: "text-red-500",
  },
  {
    key: "eq",
    name: "Emotional Intelligence (EQ)",
    description: "Self-awareness, self-regulation, motivation, empathy, and social skills assessment.",
    icon: Eye,
    color: "text-pink-500",
  },
  {
    key: "strengths_finder",
    name: "StrengthsFinder / CliftonStrengths",
    description: "Identifies your top talent themes from 34 possible strengths like Achiever, Learner, Strategic, etc.",
    icon: Sparkles,
    color: "text-yellow-500",
  },
  {
    key: "enneagram",
    name: "Enneagram",
    description: "Nine interconnected personality types describing core motivations, fears, and desires.",
    icon: Compass,
    color: "text-indigo-500",
  },
  {
    key: "values",
    name: "Values Assessment",
    description: "Identifies your top personal and professional values that drive career satisfaction.",
    icon: Lightbulb,
    color: "text-teal-500",
  },
  {
    key: "leadership_style",
    name: "Leadership Style",
    description: "Identifies your dominant leadership approach: Visionary, Coaching, Democratic, Pacesetting, Commanding, Affiliative.",
    icon: Users,
    color: "text-violet-500",
  },
];

const AssessmentsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("test_results").select("*").eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        if (data) setResults(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const getResult = (key: string) => results.find(r => r.test_type === key);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Assessments & Psychometrics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Take assessments to understand your strengths, personality, and work style.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ASSESSMENTS.map(a => {
          const result = getResult(a.key);
          const Icon = a.icon;
          return (
            <div key={a.key} className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${a.color}`} />
                  <h3 className="text-sm font-medium text-foreground">{a.name}</h3>
                </div>
                {result ? (
                  <Badge className="text-[10px] bg-verdict-go/20 text-verdict-go border-0">Completed</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Not taken</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
              {result && (
                <div className="rounded-lg bg-accent/30 p-2">
                  <p className="text-xs text-foreground">
                    Score: {result.score ?? "N/A"} · {new Date(result.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {!result && (
                <p className="text-[10px] text-muted-foreground italic">Coming soon</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentsTab;
