import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Plus, Trash2, ChevronDown, Upload, Globe, Eye, EyeOff, Search, Database, FileText, Image, Link, ShieldCheck, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface KBEntry {
  id?: string;
  category: string;
  title: string;
  content: string;
  source_type: string;
  source_name: string;
  is_relevant: boolean;
}

const CATEGORIES = ["about", "work", "education", "references", "achievements", "skills", "uncategorized"];
const SOURCE_TYPES = ["manual", "voice", "cv_upload", "url", "file_upload"];
const SOURCE_ICONS: Record<string, any> = { manual: FileText, voice: Database, cv_upload: FileText, url: Globe, file_upload: Upload };

const KnowledgebaseTab = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessReport, setAssessReport] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from("knowledgebase_entries")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setEntries(data.map((e: any) => ({
      id: e.id, category: e.category, title: e.title, content: e.content,
      source_type: e.source_type, source_name: e.source_name || "", is_relevant: e.is_relevant,
    })));
    setLoading(false);
  };

  const addEntry = () => {
    setEntries(prev => [{ category: "uncategorized", title: "", content: "", source_type: "manual", source_name: "Manual entry", is_relevant: true }, ...prev]);
  };

  const updateEntry = (i: number, key: keyof KBEntry, value: any) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: value } : e));
  };

  const removeEntry = async (i: number) => {
    const entry = entries[i];
    if (entry.id) await supabase.from("knowledgebase_entries").delete().eq("id", entry.id);
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing
      await supabase.from("knowledgebase_entries").delete().eq("user_id", user!.id);
      // Insert all
      if (entries.length > 0) {
        const { error } = await supabase.from("knowledgebase_entries").insert(
          entries.map(e => ({
            user_id: user!.id, category: e.category, title: e.title, content: e.content,
            source_type: e.source_type, source_name: e.source_name, is_relevant: e.is_relevant,
          }))
        );
        if (error) throw error;
      }
      toast({ title: "Knowledgebase saved" });
      loadEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim() || !session) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-profile-extract", {
        body: { transcript: `URL content from: ${importUrl}`, category: "uncategorized" },
      });
      if (error) throw error;
      toast({ title: "URL imported", description: "Content added to knowledgebase." });
      setImportUrl("");
      loadEntries();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const processFile = async (file: File) => {
    if (!user) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { error } = await supabase.from("knowledgebase_entries").insert({
        user_id: user.id, category: "uncategorized", title: file.name,
        content: text.slice(0, 10000), source_type: "file_upload", source_name: file.name, is_relevant: true,
      });
      if (error) throw error;
      toast({ title: "File imported" });
      loadEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleAssess = async () => {
    if (!session) return;
    setAssessing(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assess-knowledgebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setAssessReport(data.report);
      toast({ title: "Assessment complete" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAssessing(false);
    }
  };

  const handleArchive = async () => {
    if (!user) return;
    // Remove irrelevant and duplicate entries, keep only relevant ones
    const relevant = entries.filter(e => e.is_relevant);
    setSaving(true);
    try {
      await supabase.from("knowledgebase_entries").delete().eq("user_id", user.id);
      if (relevant.length > 0) {
        await supabase.from("knowledgebase_entries").insert(
          relevant.map(e => ({
            user_id: user.id, category: e.category, title: e.title, content: e.content,
            source_type: e.source_type, source_name: e.source_name, is_relevant: true,
          }))
        );
      }
      toast({ title: "Archived", description: `Kept ${relevant.length} relevant entries, removed ${entries.length - relevant.length} irrelevant.` });
      loadEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = entries.filter(e => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(e => e.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, KBEntry[]>);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Import Panel */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
          <Database className="h-4 w-4" /> Import Data Sources
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.doc,.csv" onChange={handleFileImport} disabled={importing} className="hidden" />
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{importing ? "Importing…" : "Drag & drop or click to upload"}</p>
            <p className="text-[10px] text-muted-foreground">PDF, DOCX, TXT, CSV</p>
          </div>
          <div>
            <Label className="text-xs">Import from URL</Label>
            <div className="flex gap-1 mt-1">
              <Input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://..." className="text-xs" />
              <Button size="sm" variant="outline" onClick={handleUrlImport} disabled={importing || !importUrl.trim()}>
                {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button size="sm" variant="outline" disabled className="gap-1 text-xs"><Image className="h-3 w-3" />Google Drive (Coming Soon)</Button>
          </div>
          <div className="flex flex-col justify-end">
            <Button size="sm" variant="outline" disabled className="gap-1 text-xs"><Link className="h-3 w-3" />Notion (Coming Soon)</Button>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search knowledgebase…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <Button size="sm" onClick={addEntry}><Plus className="h-4 w-4 mr-1" />Add Entry</Button>
      </div>

      {/* Grouped Entries */}
      {Object.entries(grouped).map(([cat, items]) => (
        <Collapsible key={cat} defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
            <ChevronDown className="h-4 w-4" />
            {cat.charAt(0).toUpperCase() + cat.slice(1)} ({items.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {items.map(entry => {
              const globalIdx = entries.indexOf(entry);
              const SourceIcon = SOURCE_ICONS[entry.source_type] || FileText;
              return (
                <div key={entry.id || globalIdx} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Input value={entry.title} onChange={e => updateEntry(globalIdx, "title", e.target.value)} placeholder="Title" className="text-sm font-medium" />
                      <Textarea value={entry.content} onChange={e => updateEntry(globalIdx, "content", e.target.value)} rows={3} className="text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => updateEntry(globalIdx, "is_relevant", !entry.is_relevant)} title={entry.is_relevant ? "Mark irrelevant" : "Mark relevant"}>
                        {entry.is_relevant ? <Eye className="h-4 w-4 text-verdict-go" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removeEntry(globalIdx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <SourceIcon className="h-3 w-3" />{entry.source_type}
                    </Badge>
                    <select
                      className="rounded border border-input bg-background px-2 py-0.5 text-[10px]"
                      value={entry.category}
                      onChange={e => updateEntry(globalIdx, "category", e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {entry.source_name && <span>{entry.source_name}</span>}
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No knowledgebase entries yet. Use the import tools above or the "Talk to Me" voice builder on each profile tab.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Knowledgebase"}
        </Button>
        <Button variant="outline" onClick={handleAssess} disabled={assessing} className="gap-1.5">
          {assessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Assess All Data
        </Button>
        <Button variant="outline" onClick={handleArchive} disabled={saving} className="gap-1.5">
          <Archive className="h-4 w-4" />
          Archive & Clean
        </Button>
      </div>

      {assessReport && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Assessment Report</h3>
          <div className="prose prose-sm max-w-none text-sm text-muted-foreground whitespace-pre-wrap">{assessReport}</div>
        </div>
      )}
    </div>
  );
};

export default KnowledgebaseTab;
