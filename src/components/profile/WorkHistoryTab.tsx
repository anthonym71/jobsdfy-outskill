import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface WorkEntry {
  id?: string;
  title: string;
  company: string;
  employment_type: string;
  is_current: boolean;
  is_concurrent: boolean;
  start_month: number | null;
  start_year: number | null;
  end_month: number | null;
  end_year: number | null;
  location: string;
  location_type: string;
  description: string;
  awards: string;
  achievements: string;
  performance: string;
  skills: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Volunteer"];

const emptyEntry = (): WorkEntry => ({
  title: "", company: "", employment_type: "Full-time", is_current: false, is_concurrent: false,
  start_month: null, start_year: null, end_month: null, end_year: null,
  location: "", location_type: "onsite", description: "", awards: "", achievements: "", performance: "", skills: [],
});

const WorkHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newSkill, setNewSkill] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    const { data } = await supabase.from("work_history").select("*").eq("user_id", user!.id).order("sort_order");
    if (data) {
      setEntries(data.map(d => ({
        id: d.id, title: d.title, company: d.company, employment_type: d.employment_type,
        is_current: d.is_current, is_concurrent: d.is_concurrent,
        start_month: d.start_month, start_year: d.start_year,
        end_month: d.end_month, end_year: d.end_year,
        location: d.location || "", location_type: d.location_type || "onsite",
        description: d.description || "", awards: d.awards || "",
        achievements: d.achievements || "", performance: d.performance || "",
        skills: d.skills || [],
      })));
    }
    setLoading(false);
  };

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);

  const updateEntry = (i: number, key: keyof WorkEntry, value: any) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: value } : e));
  };

  const removeEntry = async (i: number) => {
    const entry = entries[i];
    if (entry.id) await supabase.from("work_history").delete().eq("id", entry.id);
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  const addSkill = (i: number) => {
    const skill = (newSkill[i] || "").trim();
    if (!skill) return;
    const entry = entries[i];
    if (entry.skills.length >= 5) { toast({ title: "Max 5 skills per role" }); return; }
    updateEntry(i, "skills", [...entry.skills, skill]);
    setNewSkill(prev => ({ ...prev, [i]: "" }));
  };

  const removeSkill = (entryIdx: number, skillIdx: number) => {
    const entry = entries[entryIdx];
    updateEntry(entryIdx, "skills", entry.skills.filter((_, si) => si !== skillIdx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing entries and re-insert
      await supabase.from("work_history").delete().eq("user_id", user!.id);
      if (entries.length > 0) {
        const { error } = await supabase.from("work_history").insert(
          entries.map((e, i) => ({
            user_id: user!.id,
            title: e.title, company: e.company, employment_type: e.employment_type,
            is_current: e.is_current, is_concurrent: e.is_concurrent,
            start_month: e.start_month, start_year: e.start_year,
            end_month: e.end_month, end_year: e.end_year,
            location: e.location, location_type: e.location_type,
            description: e.description, awards: e.awards,
            achievements: e.achievements, performance: e.performance,
            skills: e.skills, sort_order: i,
          }))
        );
        if (error) throw error;
      }
      toast({ title: "Work history saved" });
      loadEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Work History</h2>
          <p className="text-sm text-muted-foreground">Add your work experience. Upload a CV to auto-populate (coming soon).</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled>
            <Upload className="h-4 w-4 mr-1" />Upload CV
          </Button>
          <Button size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-1" />Add Job
          </Button>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No work history yet. Click "Add Job" to get started.</p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {entry.title || entry.company ? `${entry.title}${entry.company ? ` at ${entry.company}` : ""}` : `Position ${i + 1}`}
            </h3>
            <Button size="icon" variant="ghost" onClick={() => removeEntry(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Job Title</Label><Input value={entry.title} onChange={e => updateEntry(i, "title", e.target.value)} className="mt-1" /></div>
            <div><Label>Company</Label><Input value={entry.company} onChange={e => updateEntry(i, "company", e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Employment Type</Label>
              <Select value={entry.employment_type} onValueChange={v => updateEntry(i, "employment_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Location</Label><Input value={entry.location} onChange={e => updateEntry(i, "location", e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Location Type</Label>
              <Select value={entry.location_type} onValueChange={v => updateEntry(i, "location_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label>Start Month</Label>
              <Select value={String(entry.start_month || "")} onValueChange={v => updateEntry(i, "start_month", Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, mi) => <SelectItem key={mi} value={String(mi + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Year</Label>
              <Select value={String(entry.start_year || "")} onValueChange={v => updateEntry(i, "start_year", Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Month</Label>
              <Select value={String(entry.end_month || "")} onValueChange={v => updateEntry(i, "end_month", Number(v))} disabled={entry.is_current}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, mi) => <SelectItem key={mi} value={String(mi + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Year</Label>
              <Select value={String(entry.end_year || "")} onValueChange={v => updateEntry(i, "end_year", Number(v))} disabled={entry.is_current}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={entry.is_current} onCheckedChange={v => updateEntry(i, "is_current", !!v)} />
              Currently working here
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={entry.is_concurrent} onCheckedChange={v => updateEntry(i, "is_concurrent", !!v)} />
              Concurrent role (e.g. volunteering alongside)
            </label>
          </div>

          <div><Label>Description</Label><Textarea value={entry.description} onChange={e => updateEntry(i, "description", e.target.value)} className="mt-1" rows={3} /></div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Awards</Label><Input value={entry.awards} onChange={e => updateEntry(i, "awards", e.target.value)} className="mt-1" /></div>
            <div><Label>Achievements</Label><Input value={entry.achievements} onChange={e => updateEntry(i, "achievements", e.target.value)} className="mt-1" /></div>
            <div><Label>Performance</Label><Input value={entry.performance} onChange={e => updateEntry(i, "performance", e.target.value)} className="mt-1" /></div>
          </div>

          {/* Skills */}
          <div>
            <Label>Skills (max 5 per role)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.skills.map((s, si) => (
                <span key={si} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-foreground">
                  {s}
                  <button onClick={() => removeSkill(i, si)} className="text-muted-foreground hover:text-destructive">&times;</button>
                </span>
              ))}
            </div>
            {entry.skills.length < 5 && (
              <div className="flex gap-2 mt-2">
                <Input value={newSkill[i] || ""} onChange={e => setNewSkill(prev => ({ ...prev, [i]: e.target.value }))} placeholder="Add skill" className="max-w-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill(i))} />
                <Button size="sm" variant="outline" onClick={() => addSkill(i)}>Add</Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {entries.length > 0 && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Work History"}
        </Button>
      )}
    </div>
  );
};

export default WorkHistoryTab;
