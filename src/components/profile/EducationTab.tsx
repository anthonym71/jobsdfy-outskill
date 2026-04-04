import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MediaUploader from "./MediaUploader";

const EducationTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("certificates").select("*").eq("user_id", user.id).order("date_issued", { ascending: false }),
    ]).then(([eduRes, certRes]) => {
      if (eduRes.data) setEntries(eduRes.data);
      if (certRes.data) setCerts(certRes.data);
      setLoading(false);
    });
  }, [user]);

  const addEdu = () => setEntries(prev => [...prev, { institution: "", degree: "", field: "", start_year: null, end_year: null, description: "" }]);
  const addCert = () => setCerts(prev => [...prev, { name: "", issuer: "", date_issued: "", file_url: "" }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("education").delete().eq("user_id", user!.id);
      if (entries.length > 0) {
        const { error } = await supabase.from("education").insert(entries.map(e => ({ ...e, user_id: user!.id, id: undefined })));
        if (error) throw error;
      }
      await supabase.from("certificates").delete().eq("user_id", user!.id);
      if (certs.length > 0) {
        const { error } = await supabase.from("certificates").insert(certs.map(c => ({ ...c, user_id: user!.id, id: undefined })));
        if (error) throw error;
      }
      toast({ title: "Education & certificates saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">Education</h2>
        <Button size="sm" onClick={addEdu}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      {entries.map((e, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex justify-between"><h3 className="text-sm font-medium text-foreground">{e.institution || `Entry ${i + 1}`}</h3><Button size="icon" variant="ghost" onClick={() => setEntries(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Institution</Label><Input value={e.institution} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, institution: ev.target.value } : x))} className="mt-1" /></div>
            <div><Label>Degree</Label><Input value={e.degree || ""} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, degree: ev.target.value } : x))} className="mt-1" /></div>
            <div><Label>Field of Study</Label><Input value={e.field || ""} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, field: ev.target.value } : x))} className="mt-1" /></div>
            <div className="flex gap-2">
              <div className="flex-1"><Label>Start Year</Label><Input type="number" value={e.start_year || ""} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, start_year: Number(ev.target.value) || null } : x))} className="mt-1" /></div>
              <div className="flex-1"><Label>End Year</Label><Input type="number" value={e.end_year || ""} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, end_year: Number(ev.target.value) || null } : x))} className="mt-1" /></div>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={e.description || ""} onChange={ev => setEntries(prev => prev.map((x, idx) => idx === i ? { ...x, description: ev.target.value } : x))} className="mt-1" rows={2} /></div>
        </div>
      ))}

      <div className="flex items-center justify-between mt-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Certificates & Qualifications</h2>
        <Button size="sm" onClick={addCert}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      {certs.map((c, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex justify-between"><h3 className="text-sm font-medium text-foreground">{c.name || `Certificate ${i + 1}`}</h3><Button size="icon" variant="ghost" onClick={() => setCerts(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Name</Label><Input value={c.name} onChange={ev => setCerts(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className="mt-1" /></div>
            <div><Label>Issuer</Label><Input value={c.issuer || ""} onChange={ev => setCerts(prev => prev.map((x, idx) => idx === i ? { ...x, issuer: ev.target.value } : x))} className="mt-1" /></div>
            <div><Label>Date Issued</Label><Input type="date" value={c.date_issued || ""} onChange={ev => setCerts(prev => prev.map((x, idx) => idx === i ? { ...x, date_issued: ev.target.value } : x))} className="mt-1" /></div>
          </div>
          <MediaUploader bucket="certificates" folder={c.id || `cert_${i}`} label="Upload Certificate" maxFiles={1} accept=".pdf,.jpg,.jpeg,.png" />
        </div>
      ))}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Education & Certificates"}
      </Button>
    </div>
  );
};

export default EducationTab;
