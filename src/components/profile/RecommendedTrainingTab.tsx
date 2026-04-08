import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, GraduationCap, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const RecommendedTrainingTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", provider: "", category: "general", reason: "", url: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("recommended_training").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [user]);

  const handleAdd = async () => {
    if (!form.title.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("recommended_training").insert({ user_id: user.id, ...form });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Training added" });
      setForm({ title: "", provider: "", category: "general", reason: "", url: "" });
      const { data } = await supabase.from("recommended_training").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setItems(data || []);
    }
    setAdding(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("recommended_training").delete().eq("id", id);
    setItems(prev => prev.filter(t => t.id !== id));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Recommended Training</h2>
        <p className="text-sm text-muted-foreground mt-1">AI-recommended courses and training based on your profile and career gaps.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Add Training</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Provider</Label><Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Coursera, Udemy" className="mt-1" /></div>
          <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1" /></div>
        </div>
        <div><Label className="text-xs">Why Recommended</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Fills gap in..." className="mt-1" /></div>
        <div><Label className="text-xs">URL</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
        <Button size="sm" onClick={handleAdd} disabled={adding || !form.title.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Add Training
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(t => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    {t.provider && <p className="text-xs text-muted-foreground">{t.provider}</p>}
                    {t.category && <span className="text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5">{t.category}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {t.url && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                      <a href={t.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteItem(t.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
              {t.reason && <p className="text-xs text-primary/80"><span className="font-medium">Why:</span> {t.reason}</p>}
              <p className="text-[10px] text-muted-foreground">Recommended by: {t.recommended_by}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No recommended training yet.</p>
      )}
    </div>
  );
};

export default RecommendedTrainingTab;
