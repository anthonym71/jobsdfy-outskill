import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, BookOpen, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MediaUploader from "./MediaUploader";

interface Course {
  id?: string;
  title: string;
  provider: string;
  category: string;
  status: string;
  certificate_url: string;
  grade: string;
  achievement_level: string;
  notes: string;
  started_at: string;
  completed_at: string;
  recommended_by: string;
  is_recommended: boolean;
}

const emptyCourse = (): Course => ({
  title: "", provider: "", category: "general", status: "to_start",
  certificate_url: "", grade: "", achievement_level: "", notes: "",
  started_at: "", completed_at: "", recommended_by: "", is_recommended: false,
});

const STATUS_OPTIONS = [
  { value: "to_start", label: "To Start" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const ACHIEVEMENT_LEVELS = [
  { value: "", label: "Not specified" },
  { value: "pass", label: "Pass" },
  { value: "attended", label: "Attended" },
  { value: "grade", label: "Grade (enter below)" },
];

const CoursesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data?.length) setCourses(data as any);
        setLoading(false);
      });
  }, [user]);

  const addCourse = () => setCourses(prev => [emptyCourse(), ...prev]);

  const update = (i: number, key: keyof Course, value: any) => {
    setCourses(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  };

  const remove = async (i: number) => {
    const c = courses[i];
    if (c.id) await supabase.from("courses").delete().eq("id", c.id);
    setCourses(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Delete existing and re-insert
      await supabase.from("courses").delete().eq("user_id", user.id);
      if (courses.length > 0) {
        const rows = courses.map(c => ({
          user_id: user.id,
          title: c.title,
          provider: c.provider,
          category: c.category,
          status: c.status,
          certificate_url: c.certificate_url,
          grade: c.grade,
          achievement_level: c.achievement_level,
          notes: c.notes,
          started_at: c.started_at || null,
          completed_at: c.completed_at || null,
          recommended_by: c.recommended_by,
          is_recommended: c.is_recommended,
        }));
        const { error } = await supabase.from("courses").insert(rows);
        if (error) throw error;
      }
      toast({ title: "Courses saved!" });
      // Reload to get IDs
      const { data } = await supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setCourses(data as any);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const statusColor: Record<string, string> = {
    to_start: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">Courses & Training</h2>
        <Button variant="outline" size="sm" onClick={addCourse}><Plus className="h-4 w-4 mr-1" />Add Course</Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No courses yet. Add completed or planned courses.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={addCourse}><Plus className="h-4 w-4 mr-1" />Add Course</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c, i) => (
            <div key={c.id || `new-${i}`} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`text-xs ${statusColor[c.status] || ""}`}>
                  {STATUS_OPTIONS.find(s => s.value === c.status)?.label || c.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Course Title</label>
                  <Input className="mt-1" value={c.title} onChange={e => update(i, "title", e.target.value)} placeholder="e.g. Advanced React Patterns" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Provider</label>
                  <Input className="mt-1" value={c.provider} onChange={e => update(i, "provider", e.target.value)} placeholder="e.g. Coursera, Udemy" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={c.status} onValueChange={v => update(i, "status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Input className="mt-1" value={c.category} onChange={e => update(i, "category", e.target.value)} placeholder="e.g. Technology, Leadership" />
                </div>
              </div>

              {c.status === "completed" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Achievement Level</label>
                    <Select value={c.achievement_level} onValueChange={v => update(i, "achievement_level", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {ACHIEVEMENT_LEVELS.map(a => <SelectItem key={a.value || "none"} value={a.value || "none"}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {c.achievement_level === "grade" && (
                    <div>
                      <label className="text-xs text-muted-foreground">Grade</label>
                      <Input className="mt-1" value={c.grade} onChange={e => update(i, "grade", e.target.value)} placeholder="e.g. A+, 95%" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground">Completed Date</label>
                    <Input type="date" className="mt-1" value={c.completed_at} onChange={e => update(i, "completed_at", e.target.value)} />
                  </div>
                </div>
              )}

              {c.status === "completed" && (
                <div>
                  <label className="text-xs text-muted-foreground">Certificate</label>
                  {c.certificate_url ? (
                    <div className="flex items-center gap-2 mt-1">
                      <a href={c.certificate_url} target="_blank" rel="noopener" className="text-xs text-primary underline">View Certificate</a>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => update(i, "certificate_url", "")}>Remove</Button>
                    </div>
                  ) : (
                    <MediaUploader
                      bucket="certificates"
                      folder={`courses/${c.id || `new_${i}`}`}
                      onUpload={(url) => update(i, "certificate_url", url)}
                      accept=".pdf,.jpg,.png,.jpeg"
                      label="Upload Certificate"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea className="mt-1 text-sm" rows={2} value={c.notes} onChange={e => update(i, "notes", e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving…</> : "Save Courses"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CoursesTab;
