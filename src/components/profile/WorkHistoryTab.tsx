import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import VoiceCVBuilderDialog from "./VoiceCVBuilder";
import VoiceLabel from "./VoiceLabel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CVUploadParser from "./CVUploadParser";
import MediaUploader from "./MediaUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Fractional", "Internship", "Volunteer"];
const LOCATION_TYPES = ["Onsite", "Remote", "Hybrid"];

const emptyEntry = (): WorkEntry => ({
  title: "", company: "", employment_type: "Full-time", is_current: false, is_concurrent: false,
  start_month: null, start_year: null, end_month: null, end_year: null,
  location: "", location_type: "onsite", description: "", awards: "", achievements: "", performance: "", skills: [],
});

const WorkHistoryTab = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newSkill, setNewSkill] = useState<Record<number, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [starPreview, setStarPreview] = useState<{ index: number; data: any } | null>(null);

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

  const handleEnhanceSTAR = async (i: number) => {
    if (!session) return;
    const entry = entries[i];
    setEnhancingIndex(i);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-star-bullets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title: entry.title, company: entry.company,
          description: entry.description, achievements: entry.achievements,
          awards: entry.awards, performance: entry.performance,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setStarPreview({ index: i, data: data.data });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnhancingIndex(null);
    }
  };

  const applySTAR = () => {
    if (!starPreview) return;
    const { index, data } = starPreview;
    updateEntry(index, "description", data.enhancedDescription);
    if (data.enhancedAchievements) updateEntry(index, "achievements", data.enhancedAchievements);
    setStarPreview(null);
    toast({ title: "STAR bullets applied!" });
  };

  const handleVoiceDataExtracted = (data: any) => {
    if (!data) return;
    const jobs = Array.isArray(data) ? data : [data];
    const newEntries: WorkEntry[] = jobs.map((j: any) => ({
      title: j.title || j.job_title || "",
      company: j.company || "",
      employment_type: j.employment_type || "Full-time",
      is_current: j.is_current || false,
      is_concurrent: j.is_concurrent || false,
      start_month: j.start_month || null,
      start_year: j.start_year || null,
      end_month: j.end_month || null,
      end_year: j.end_year || null,
      location: j.location || "",
      location_type: j.location_type || "onsite",
      description: j.description || "",
      awards: j.awards || "",
      achievements: j.achievements || "",
      performance: j.performance || "",
      skills: j.skills || [],
    }));
    setEntries(prev => [...prev, ...newEntries]);
    toast({ title: `${newEntries.length} job(s) added from voice input` });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
          <p className="text-sm text-muted-foreground">Add your work experience or upload a CV to auto-populate.</p>
        </div>
        <div className="flex gap-2">
          <VoiceCVBuilderDialog category="work" categoryLabel="Work History" onDataExtracted={handleVoiceDataExtracted} />
          <Button size="sm" variant="outline" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? "Hide Upload" : "Upload CV"}
          </Button>
          <Button size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-1" />Add Job
          </Button>
        </div>
      </div>

      {showUpload && (
        <CVUploadParser onImportComplete={() => { setShowUpload(false); loadEntries(); }} />
      )}

      {entries.length === 0 && !showUpload && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No work history yet. Click "Add Job" or "Upload CV" to get started.</p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {entry.title || entry.company ? `${entry.title}${entry.company ? ` at ${entry.company}` : ""}` : `Position ${i + 1}`}
            </h3>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => handleEnhanceSTAR(i)} disabled={enhancingIndex === i} className="text-xs">
                {enhancingIndex === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                STAR Enhance
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeEntry(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "title", v)}>Job Title</VoiceLabel>
              <Input value={entry.title} onChange={e => updateEntry(i, "title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "company", v)}>Company</VoiceLabel>
              <Input value={entry.company} onChange={e => updateEntry(i, "company", e.target.value)} className="mt-1" />
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "employment_type", v)} options={EMPLOYMENT_TYPES}>Employment Type</VoiceLabel>
              <Select value={entry.employment_type} onValueChange={v => updateEntry(i, "employment_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "location", v)}>Location</VoiceLabel>
              <Input value={entry.location} onChange={e => updateEntry(i, "location", e.target.value)} className="mt-1" />
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "location_type", v.toLowerCase())} options={LOCATION_TYPES}>Location Type</VoiceLabel>
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
              <VoiceLabel onVoiceResult={v => { const m = MONTHS.findIndex(m => m.toLowerCase().startsWith(v.toLowerCase().slice(0,3))); if (m >= 0) updateEntry(i, "start_month", m + 1); }} options={MONTHS}>Start Month</VoiceLabel>
              <Select value={String(entry.start_month || "")} onValueChange={v => updateEntry(i, "start_month", Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, mi) => <SelectItem key={mi} value={String(mi + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => { const y = parseInt(v); if (y && YEARS.includes(y)) updateEntry(i, "start_year", y); }} options={YEARS.slice(0, 10).map(String)}>Start Year</VoiceLabel>
              <Select value={String(entry.start_year || "")} onValueChange={v => updateEntry(i, "start_year", Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => { const m = MONTHS.findIndex(m => m.toLowerCase().startsWith(v.toLowerCase().slice(0,3))); if (m >= 0) updateEntry(i, "end_month", m + 1); }} options={MONTHS}>End Month</VoiceLabel>
              <Select value={String(entry.end_month || "")} onValueChange={v => updateEntry(i, "end_month", Number(v))} disabled={entry.is_current}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, mi) => <SelectItem key={mi} value={String(mi + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => { const y = parseInt(v); if (y && YEARS.includes(y)) updateEntry(i, "end_year", y); }} options={YEARS.slice(0, 10).map(String)}>End Year</VoiceLabel>
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
              Concurrent role
            </label>
          </div>

          <div>
            <VoiceLabel onVoiceResult={v => updateEntry(i, "description", (entry.description ? entry.description + " " : "") + v)}>Description</VoiceLabel>
            <Textarea value={entry.description} onChange={e => updateEntry(i, "description", e.target.value)} className="mt-1" rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "awards", v)}>Awards</VoiceLabel>
              <Input value={entry.awards} onChange={e => updateEntry(i, "awards", e.target.value)} className="mt-1" />
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "achievements", v)}>Achievements</VoiceLabel>
              <Input value={entry.achievements} onChange={e => updateEntry(i, "achievements", e.target.value)} className="mt-1" />
            </div>
            <div>
              <VoiceLabel onVoiceResult={v => updateEntry(i, "performance", v)}>Performance</VoiceLabel>
              <Input value={entry.performance} onChange={e => updateEntry(i, "performance", e.target.value)} className="mt-1" />
            </div>
          </div>

          <MediaUploader bucket="work-media" folder={entry.id || `entry_${i}`} label="Upload Evidence" maxFiles={3} accept="image/*,.pdf,.doc,.docx" />

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

      <Dialog open={!!starPreview} onOpenChange={() => setStarPreview(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>STAR Enhanced Preview</DialogTitle>
          </DialogHeader>
          {starPreview?.data && (
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-1">Enhanced Description</h4>
                <p className="text-muted-foreground whitespace-pre-line">{starPreview.data.enhancedDescription}</p>
              </div>
              {starPreview.data.bullets?.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">STAR Bullets</h4>
                  <ul className="space-y-1">
                    {starPreview.data.bullets.map((b: string, i: number) => (
                      <li key={i} className="text-muted-foreground">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-lg bg-accent/50 p-3">
                <p className="text-xs text-muted-foreground">{starPreview.data.improvementNotes}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setStarPreview(null)}>Cancel</Button>
                <Button size="sm" onClick={applySTAR}>Apply Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkHistoryTab;
