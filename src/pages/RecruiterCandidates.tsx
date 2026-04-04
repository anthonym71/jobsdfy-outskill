import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateApplication {
  job_id: string;
  user_id: string;
  job_title: string;
  job_company: string;
  resume: string;
  cover_note: string;
  approved: boolean;
}

const RecruiterCandidates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadRecruiterPosts();
  }, [user]);

  const loadRecruiterPosts = async () => {
    const { data } = await supabase
      .from("recruiter_job_posts")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-2xl font-bold text-foreground">Candidate Pipeline</h1>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active job posts yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Post a job first to start receiving candidates.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.href = "/app/post-job"}>
            Post a Job
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.company} · {post.city}, {post.country}</p>
                </div>
                <span className="text-xs bg-accent text-foreground rounded-full px-2 py-0.5">{post.employment_type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Candidates who check this job through JobsDFY will appear here automatically once the matching system is connected.
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">
          🚧 Full candidate matching & AI shortlist summaries coming soon. Recruiters will see structured candidate profiles with fit scores.
        </p>
      </div>
    </div>
  );
};

export default RecruiterCandidates;
