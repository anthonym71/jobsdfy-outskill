import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CVImportDestination from "./CVImportDestination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CVVersionsTab = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [versionName, setVersionName] = useState("");
  const [viewingVersion, setViewingVersion] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadVersions();
  }, [user]);

  const loadVersions = async () => {
    const { data } = await supabase.from("cv_versions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setVersions(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!targetRole.trim() || !session) return;
    setCreating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/position-cv-version`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          targetIndustry: targetIndustry.trim() || undefined,
          versionName: versionName.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      toast({ title: "CV version created!" });
      setTargetRole("");
      setTargetIndustry("");
      setVersionName("");
      loadVersions();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteVersion = async (id: string) => {
    await supabase.from("cv_versions").delete().eq("id", id);
    setVersions(prev => prev.filter(v => v.id !== id));
    toast({ title: "Version deleted" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">CV Versions</h2>
        <p className="text-sm text-muted-foreground mt-1">Create role-positioned CVs for different types of applications.</p>
      </div>

      {/* Create new version */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Create New Version</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Target Role *</Label>
            <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. SaaS Sales Director" className="mt-1" />
          </div>
          <div>
            <Label>Industry (optional)</Label>
            <Input value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} placeholder="e.g. FinTech" className="mt-1" />
          </div>
          <div>
            <Label>Version Name</Label>
            <Input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Auto-generated if blank" className="mt-1" />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating || !targetRole.trim()} size="sm">
          {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating…</> : <><Plus className="h-4 w-4 mr-1" />Create Version</>}
        </Button>
      </div>

      {/* Existing versions */}
      <CVImportDestination onSaved={loadVersions} />
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No CV versions yet. Create one above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {versions.map(v => {
            const content = v.content as any;
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{v.version_name}</h3>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewingVersion(v)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteVersion(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {content?.coreSkills && (
                  <div className="flex flex-wrap gap-1">
                    {content.coreSkills.slice(0, 5).map((s: string, i: number) => (
                      <span key={i} className="text-[10px] bg-accent rounded-full px-2 py-0.5 text-foreground">{s}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingVersion?.version_name}</DialogTitle>
          </DialogHeader>
          {viewingVersion?.content && (() => {
            const c = viewingVersion.content as any;
            return (
              <div className="space-y-4 text-sm">
                {c.professionalSummary && (
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Professional Summary</h4>
                    <p className="text-muted-foreground">{c.professionalSummary}</p>
                  </div>
                )}
                {c.coreSkills?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Core Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {c.coreSkills.map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {c.experience?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Experience</h4>
                    {c.experience.map((exp: any, i: number) => (
                      <div key={i} className="mb-3">
                        <p className="font-medium text-foreground">{exp.title} at {exp.company}</p>
                        {exp.dateRange && <p className="text-xs text-muted-foreground">{exp.dateRange}</p>}
                        <ul className="mt-1 space-y-0.5">
                          {exp.bullets?.map((b: string, bi: number) => (
                            <li key={bi} className="text-muted-foreground">• {b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {c.positioningNotes && (
                  <div className="rounded-lg bg-accent/50 p-3">
                    <h4 className="font-medium text-foreground text-xs mb-1">Positioning Notes</h4>
                    <p className="text-xs text-muted-foreground">{c.positioningNotes}</p>
                  </div>
                )}
                {c.educationSection && <div><h4 className="font-medium text-foreground">Education</h4><p className="whitespace-pre-wrap text-muted-foreground">{typeof c.educationSection === "string" ? c.educationSection : JSON.stringify(c.educationSection)}</p></div>}
                {c.certificatesSection && <div><h4 className="font-medium text-foreground">Certificates</h4><p className="whitespace-pre-wrap text-muted-foreground">{typeof c.certificatesSection === "string" ? c.certificatesSection : JSON.stringify(c.certificatesSection)}</p></div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVVersionsTab;
