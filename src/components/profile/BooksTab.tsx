import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, BookOpen, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STATUS_OPTIONS = [
  { value: "to_read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
];

const BooksTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", status: "to_read", category: "", notes: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setBooks(data || []); setLoading(false); });
  }, [user]);

  const handleAdd = async () => {
    if (!form.title.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("books").insert({ user_id: user.id, ...form });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Book added" });
      setForm({ title: "", author: "", status: "to_read", category: "", notes: "" });
      const { data } = await supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setBooks(data || []);
    }
    setAdding(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("books").update({ status, completed_at: status === "completed" ? new Date().toISOString().split("T")[0] : null }).eq("id", id);
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status, completed_at: status === "completed" ? new Date().toISOString().split("T")[0] : null } : b));
  };

  const deleteBook = async (id: string) => {
    await supabase.from("books").delete().eq("id", id);
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const grouped = { to_read: books.filter(b => b.status === "to_read"), reading: books.filter(b => b.status === "reading"), completed: books.filter(b => b.status === "completed") };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Books</h2>
        <p className="text-sm text-muted-foreground mt-1">Track books you've read and want to read.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Add Book</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Author</Label><Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Business, Self-help" className="mt-1" /></div>
          <div>
            <Label className="text-xs">Status</Label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={adding || !form.title.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Add Book
        </Button>
      </div>

      {Object.entries(grouped).map(([status, items]) => items.length > 0 && (
        <div key={status}>
          <h3 className="text-sm font-semibold text-foreground mb-2 capitalize">{STATUS_OPTIONS.find(o => o.value === status)?.label} ({items.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map(b => (
              <div key={b.id} className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.title}</p>
                    {b.author && <p className="text-xs text-muted-foreground">{b.author}</p>}
                    {b.category && <p className="text-[10px] text-muted-foreground">{b.category}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <select className="text-[10px] rounded border border-input bg-background px-1 py-0.5" value={b.status} onChange={e => updateStatus(b.id, e.target.value)}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteBook(b.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {books.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No books yet. Add one above.</p>}
    </div>
  );
};

export default BooksTab;
