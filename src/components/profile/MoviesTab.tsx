import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Film, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MoviesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", genre: "", rating: "", comments: "", takeaway: "", watched_at: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("movies").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setMovies(data || []); setLoading(false); });
  }, [user]);

  const handleAdd = async () => {
    if (!form.title.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("movies").insert({
      user_id: user.id,
      title: form.title,
      genre: form.genre,
      rating: form.rating ? parseInt(form.rating) : null,
      comments: form.comments,
      takeaway: form.takeaway,
      watched_at: form.watched_at || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Movie added" });
      setForm({ title: "", genre: "", rating: "", comments: "", takeaway: "", watched_at: "" });
      const { data } = await supabase.from("movies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setMovies(data || []);
    }
    setAdding(false);
  };

  const deleteMovie = async (id: string) => {
    await supabase.from("movies").delete().eq("id", id);
    setMovies(prev => prev.filter(m => m.id !== id));
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
        ))}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Movies</h2>
        <p className="text-sm text-muted-foreground mt-1">Track movies you've watched, your rating, and key takeaways.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Add Movie</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Genre</Label><Input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="Drama, Action" className="mt-1" /></div>
          <div><Label className="text-xs">Rating (1-10)</Label><Input type="number" min="1" max="10" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="mt-1" /></div>
        </div>
        <div><Label className="text-xs">Date Watched</Label><Input type="date" value={form.watched_at} onChange={e => setForm(f => ({ ...f, watched_at: e.target.value }))} className="mt-1 max-w-xs" /></div>
        <div><Label className="text-xs">Comments</Label><Textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} placeholder="Your thoughts on this movie…" className="mt-1" rows={2} /></div>
        <div><Label className="text-xs">What I Got From It</Label><Textarea value={form.takeaway} onChange={e => setForm(f => ({ ...f, takeaway: e.target.value }))} placeholder="Key takeaway or lesson…" className="mt-1" rows={2} /></div>
        <Button size="sm" onClick={handleAdd} disabled={adding || !form.title.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Add Movie
        </Button>
      </div>

      {movies.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {movies.map(m => (
            <div key={m.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Film className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    {m.genre && <p className="text-xs text-muted-foreground">{m.genre}</p>}
                    {m.watched_at && <p className="text-[10px] text-muted-foreground">Watched: {m.watched_at}</p>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteMovie(m.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              {renderStars(m.rating)}
              {m.comments && <p className="text-xs text-muted-foreground"><span className="font-medium">Comments:</span> {m.comments}</p>}
              {m.takeaway && <p className="text-xs text-primary/80"><span className="font-medium">Takeaway:</span> {m.takeaway}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No movies yet. Add one above.</p>
      )}
    </div>
  );
};

export default MoviesTab;
