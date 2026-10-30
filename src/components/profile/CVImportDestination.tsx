import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mergeCvContent, parsedCvContent, type CvMergeMode } from "@/lib/cvContent";
import CVUploadParser from "./CVUploadParser";

export default function CVImportDestination({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState<any[]>([]);
  const [target, setTarget] = useState("new");
  const [mode, setMode] = useState<CvMergeMode>("merge");
  const [name, setName] = useState("Uploaded CV");
  const [parsed, setParsed] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) supabase.from("cv_versions").select("*").eq("user_id", user.id).then(({ data }) => setVersions(data || [])); }, [user?.id]);
  const save = async () => {
    if (!user || !parsed) return;
    setSaving(true);
    try {
      const incoming = parsedCvContent(parsed);
      const chosen = versions.find(version => version.id === target);
      if (target !== "new" && !chosen) throw new Error("Choose a CV to update");
      const content = chosen ? mergeCvContent(chosen.content || {}, incoming, mode) : incoming;
      const response = chosen
        ? await supabase.from("cv_versions").update({ content }).eq("id", target).eq("user_id", user.id).select("id").single()
        : await supabase.from("cv_versions").insert({ user_id: user.id, version_name: name.trim() || "Uploaded CV", content }).select("id").single();
      if (response.error) throw response.error;
      toast({ title: "CV saved", description: chosen ? `Updated ${chosen.version_name}` : "Created your new CV" });
      setParsed(null); onSaved();
    } catch (error: any) { toast({ title: "Couldn't save CV", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  return <section className="space-y-4 border-t border-border pt-5">
    <h3 className="font-heading font-semibold text-foreground">Upload CV / details</h3>
    <Select value={target} onValueChange={setTarget}><SelectTrigger aria-label="Destination CV"><SelectValue /></SelectTrigger><SelectContent>
      <SelectItem value="new">Create a new CV</SelectItem>{versions.map(version => <SelectItem value={version.id} key={version.id}>{version.version_name}</SelectItem>)}
    </SelectContent></Select>
    {target === "new" ? <Input aria-label="New CV name" value={name} onChange={e => setName(e.target.value)} /> : <Select value={mode} onValueChange={value => setMode(value as CvMergeMode)}><SelectTrigger aria-label="Import mode"><SelectValue /></SelectTrigger><SelectContent>
      <SelectItem value="merge">Merge — keep existing wording, add new details</SelectItem>
      <SelectItem value="combine">Combine — include both sets of details</SelectItem>
      <SelectItem value="overwrite">Overwrite — replace this CV</SelectItem>
    </SelectContent></Select>}
    {!parsed ? <CVUploadParser onImportComplete={() => {}} onReviewComplete={setParsed} /> : <div className="flex items-center gap-3"><p className="text-sm text-muted-foreground">{parsed.fullName || "CV"} · {parsed.workHistory?.length || 0} roles</p><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save to selected CV"}</Button><Button variant="ghost" onClick={() => setParsed(null)}>Cancel</Button></div>}
  </section>;
}