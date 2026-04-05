import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import VoiceCVBuilderDialog from "./VoiceCVBuilder";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ReferencesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refs, setRefs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("references").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setRefs(data);
      setLoading(false);
    });
  }, [user]);

  const addRef = () => setRefs(prev => [...prev, { name: "", email: "", phone: "", consent_given: false, testimonial_text: "", document_url: "", video_url: "" }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("references").delete().eq("user_id", user!.id);
      if (refs.length > 0) {
        const { error } = await supabase.from("references").insert(refs.map(r => ({
          user_id: user!.id, name: r.name, email: r.email, phone: r.phone,
          consent_given: r.consent_given, testimonial_text: r.testimonial_text,
          document_url: r.document_url, video_url: r.video_url,
        })));
        if (error) throw error;
      }
      toast({ title: "References saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">References & Testimonials</h2>
        <Button size="sm" onClick={addRef}><Plus className="h-4 w-4 mr-1" />Add Reference</Button>
      </div>

      {refs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No references added yet.</p>}

      {refs.map((r, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-foreground">{r.name || `Reference ${i + 1}`}</h3>
            <Button size="icon" variant="ghost" onClick={() => setRefs(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Name</Label><Input value={r.name} onChange={e => setRefs(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={r.email || ""} onChange={e => setRefs(prev => prev.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={r.phone || ""} onChange={e => setRefs(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} className="mt-1" /></div>
          </div>
          <div><Label>Testimonial</Label><Textarea value={r.testimonial_text || ""} onChange={e => setRefs(prev => prev.map((x, idx) => idx === i ? { ...x, testimonial_text: e.target.value } : x))} className="mt-1" rows={2} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={r.consent_given} onCheckedChange={v => setRefs(prev => prev.map((x, idx) => idx === i ? { ...x, consent_given: !!v } : x))} />
            Consent to share their contact details
          </label>
        </div>
      ))}

      {refs.length > 0 && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save References"}
        </Button>
      )}
    </div>
  );
};

export default ReferencesTab;
