import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Quote, Lightbulb, ImageIcon, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ENTRY_TYPES = [
  { value: "quote", label: "Quote", icon: Quote },
  { value: "learning", label: "Learning", icon: Lightbulb },
  { value: "meme", label: "Meme/Image", icon: ImageIcon },
];

const MemoryDumpTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ entry_type: "quote", title: "", content: "", source: "", tags: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("memory_dump").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false); });
  }, [user]);

  const handleAdd = async () => {
    if (!form.content.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("memory_dump").insert({
      user_id: user.id, entry_type: form.entry_type, title: form.title, content: form.content,
      source: form.source, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Entry added" });
      setForm({ entry_type: "quote", title: "", content: "", source: "", tags: "" });
      const { data } = await supabase.from("memory_dump").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setEntries(data || []);
    }
    setAdding(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("memory_dump").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const filtered = entries.filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Memory Dump</h2>
        <p className="text-sm text-muted-foreground mt-1">Store quotes, memes, learnings, and insights.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Type</Label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.entry_type} onChange={e => setForm(f => ({ ...f, entry_type: e.target.value }))}>
              {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Source</Label><Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Who said it / where from" className="mt-1" /></div>
        </div>
        <div><Label className="text-xs">Content *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={2} className="mt-1" /></div>
        <div><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="motivation, leadership" className="mt-1" /></div>
        <Button size="sm" onClick={handleAdd} disabled={adding || !form.content.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Add Entry
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search memories…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No entries yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(e => {
            const TypeInfo = ENTRY_TYPES.find(t => t.value === e.entry_type);
            const Icon = TypeInfo?.icon || Quote;
            return (
              <div key={e.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground capitalize">{TypeInfo?.label}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteEntry(e.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
                {e.title && <p className="text-sm font-medium text-foreground">{e.title}</p>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{e.content}</p>
                {e.source && <p className="text-[10px] text-muted-foreground italic">— {e.source}</p>}
                {e.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">{e.tags.map((t: string) => <span key={t} className="text-[10px] bg-accent rounded-full px-2 py-0.5">{t}</span>)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemoryDumpTab;
