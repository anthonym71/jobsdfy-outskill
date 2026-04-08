import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Share2, ExternalLink, CheckCircle, Circle, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PLATFORM_OPTIONS = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "TikTok", "YouTube", "Threads", "Reddit", "Other"];

interface PlatformEntry { platform: string; url: string; }

const SocialPostsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postType, setPostType] = useState<"own" | "other">("own");
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<PlatformEntry[]>([{ platform: "LinkedIn", url: "" }]);
  const [followUpTask, setFollowUpTask] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [toBePosted, setToBePosted] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("social_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [user]);

  const addPlatform = () => setPlatforms(p => [...p, { platform: "LinkedIn", url: "" }]);
  const removePlatform = (i: number) => setPlatforms(p => p.filter((_, idx) => idx !== i));
  const updatePlatform = (i: number, key: keyof PlatformEntry, val: string) => setPlatforms(p => p.map((pl, idx) => idx === i ? { ...pl, [key]: val } : pl));

  const handleAdd = async () => {
    if (!content.trim() || !user) return;
    setAdding(true);
    const { error, data: newPost } = await supabase.from("social_posts").insert({
      user_id: user.id, post_type: postType, content,
      platforms: JSON.parse(JSON.stringify(platforms.filter(p => p.url.trim()))),
      follow_up_task: followUpTask, follow_up_done: false,
      to_be_posted: toBePosted, due_date: dueDate || null,
    } as any).select().single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      // Create follow-up task if specified
      if (followUpTask.trim() && newPost) {
        await supabase.from("tasks").insert({
          user_id: user.id,
          title: followUpTask,
          description: `Follow-up for social post: ${content.slice(0, 80)}...`,
          due_date: followUpDate || dueDate || null,
          source_type: "social_post",
          source_id: newPost.id,
        } as any);
      }
      toast({ title: "Post added" });
      setContent(""); setPlatforms([{ platform: "LinkedIn", url: "" }]); setFollowUpTask(""); setFollowUpDate(""); setToBePosted(false); setDueDate("");
      const { data } = await supabase.from("social_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setPosts(data || []);
    }
    setAdding(false);
  };

  const toggleFollowUp = async (id: string, done: boolean) => {
    await supabase.from("social_posts").update({ follow_up_done: !done }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, follow_up_done: !done } : p));
  };

  const deletePost = async (id: string) => {
    await supabase.from("social_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const ownPosts = posts.filter(p => p.post_type === "own");
  const otherPosts = posts.filter(p => p.post_type === "other");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Social Media</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your posts and others' posts to follow up on.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant={postType === "own" ? "default" : "outline"} onClick={() => setPostType("own")}>My Post</Button>
          <Button size="sm" variant={postType === "other" ? "default" : "outline"} onClick={() => setPostType("other")}>Other's Post</Button>
        </div>
        <div><Label className="text-xs">Content / Script *</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className="mt-1" /></div>
        
        <div className="space-y-2">
          <Label className="text-xs">Platforms & URLs</Label>
          {platforms.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm w-32" value={p.platform} onChange={e => updatePlatform(i, "platform", e.target.value)}>
                {PLATFORM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <Input value={p.url} onChange={e => updatePlatform(i, "url", e.target.value)} placeholder="https://..." className="flex-1" />
              {platforms.length > 1 && <Button size="icon" variant="ghost" onClick={() => removePlatform(i)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={addPlatform} className="text-xs"><Plus className="h-3 w-3 mr-1" />Add Platform</Button>
        </div>

        {/* To Be Posted + Due Date */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={toBePosted} onCheckedChange={(v) => setToBePosted(!!v)} />
            <span>To be posted ✅</span>
          </label>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-40" />
            <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => setDueDate(new Date().toISOString().split("T")[0])}>Today</Button>
          </div>
        </div>

        {/* Follow-up */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">Follow-up Action</Label><Input value={followUpTask} onChange={e => setFollowUpTask(e.target.value)} placeholder="e.g. Check engagement in 24h" className="mt-1" /></div>
          <div><Label className="text-xs">Follow-up Date</Label><Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="mt-1" /></div>
        </div>

        <Button size="sm" onClick={handleAdd} disabled={adding || !content.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Add Post
        </Button>
      </div>

      {ownPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">My Posts ({ownPosts.length})</h3>
          <div className="space-y-2">
            {ownPosts.map(p => <PostCard key={p.id} post={p} onDelete={deletePost} onToggleFollowUp={toggleFollowUp} />)}
          </div>
        </div>
      )}

      {otherPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Others' Posts to Follow Up ({otherPosts.length})</h3>
          <div className="space-y-2">
            {otherPosts.map(p => <PostCard key={p.id} post={p} onDelete={deletePost} onToggleFollowUp={toggleFollowUp} />)}
          </div>
        </div>
      )}

      {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No posts tracked yet.</p>}
    </div>
  );
};

const PostCard = ({ post, onDelete, onToggleFollowUp }: { post: any; onDelete: (id: string) => void; onToggleFollowUp: (id: string, done: boolean) => void }) => {
  const plats = (post.platforms as PlatformEntry[]) || [];
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between">
        <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{post.content?.slice(0, 200)}{post.content?.length > 200 ? "…" : ""}</p>
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => onDelete(post.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>
      {plats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {plats.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-accent rounded-full px-2 py-0.5 flex items-center gap-1 hover:bg-accent/80">
              <Share2 className="h-2.5 w-2.5" />{p.platform}<ExternalLink className="h-2 w-2" />
            </a>
          ))}
        </div>
      )}
      {post.follow_up_task && (
        <button onClick={() => onToggleFollowUp(post.id, post.follow_up_done)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          {post.follow_up_done ? <CheckCircle className="h-3.5 w-3.5 text-verdict-go" /> : <Circle className="h-3.5 w-3.5" />}
          <span className={post.follow_up_done ? "line-through" : ""}>{post.follow_up_task}</span>
        </button>
      )}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        {post.to_be_posted && <span className="text-primary font-medium">📌 To be posted</span>}
        {post.due_date && <span className="flex items-center gap-0.5"><CalendarDays className="h-2.5 w-2.5" />Due: {new Date(post.due_date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};

export default SocialPostsTab;
