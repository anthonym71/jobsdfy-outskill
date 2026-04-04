import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CVUploadParserProps {
  onImportComplete: () => void;
}

const CVUploadParser = ({ onImportComplete }: CVUploadParserProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "parsing" | "conflicts" | "importing">("upload");
  const [parsedData, setParsedData] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any>(null);
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !session) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB", variant: "destructive" });
      return;
    }

    setStep("parsing");

    try {
      // Upload to cv-uploads bucket
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cv-uploads").upload(path, file);
      if (uploadError) throw uploadError;

      // Read file as text (for now, we'll extract text client-side for txt/docx)
      const text = await file.text();

      // Call parse-cv edge function
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cvText: text }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Parsing failed");

      setParsedData(data.data);

      // Now detect conflicts
      const conflictResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cv-conflicts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ parsedCV: data.data }),
      });

      const conflictData = await conflictResp.json();
      if (!conflictResp.ok) throw new Error(conflictData.error || "Conflict detection failed");

      setConflicts(conflictData.data);

      // Set default selections
      const defaults: Record<string, string> = {};
      conflictData.data.workHistoryConflicts?.forEach((c: any, i: number) => {
        defaults[`work_${i}`] = c.recommendation;
      });
      conflictData.data.educationConflicts?.forEach((c: any, i: number) => {
        defaults[`edu_${i}`] = c.recommendation;
      });
      conflictData.data.profileConflicts?.forEach((c: any, i: number) => {
        defaults[`profile_${i}`] = c.recommendation === "keep_existing" ? "skip" : "use_new";
      });
      setSelectedActions(defaults);

      setStep("conflicts");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("upload");
    }
  };

  const handleImport = async () => {
    if (!user || !parsedData) return;
    setStep("importing");

    try {
      // Import work history entries marked as "add"
      const workToAdd = conflicts?.workHistoryConflicts?.filter((_: any, i: number) =>
        selectedActions[`work_${i}`] === "add" || selectedActions[`work_${i}`] === "replace"
      ) || [];

      for (const conflict of workToAdd) {
        const parsed = parsedData.workHistory?.[conflict.parsedIndex];
        if (!parsed) continue;

        if (conflict.existingId && selectedActions[`work_${workToAdd.indexOf(conflict)}`] === "replace") {
          await supabase.from("work_history").delete().eq("id", conflict.existingId);
        }

        await supabase.from("work_history").insert({
          user_id: user.id,
          title: parsed.title || "",
          company: parsed.company || "",
          employment_type: parsed.employmentType || "Full-time",
          is_current: parsed.isCurrent || false,
          is_concurrent: false,
          start_month: parsed.startMonth || null,
          start_year: parsed.startYear || null,
          end_month: parsed.endMonth || null,
          end_year: parsed.endYear || null,
          description: parsed.description || "",
          achievements: parsed.achievements || "",
          skills: parsed.skills || [],
          sort_order: 99,
        });
      }

      // Import education
      const eduToAdd = conflicts?.educationConflicts?.filter((_: any, i: number) =>
        selectedActions[`edu_${i}`] === "add" || selectedActions[`edu_${i}`] === "replace"
      ) || [];

      for (const conflict of eduToAdd) {
        const parsed = parsedData.education?.[conflict.parsedIndex];
        if (!parsed) continue;

        await supabase.from("education").insert({
          user_id: user.id,
          institution: parsed.institution || "",
          degree: parsed.degree || null,
          field: parsed.field || null,
          start_year: parsed.startYear || null,
          end_year: parsed.endYear || null,
          description: parsed.description || null,
        });
      }

      // Import certificates
      const newCerts = conflicts?.newCertificates?.filter((c: any) => c.isNew) || [];
      for (const cert of newCerts) {
        const parsed = parsedData.certificates?.find((c: any) => c.name === cert.name);
        if (!parsed) continue;

        await supabase.from("certificates").insert({
          user_id: user.id,
          name: parsed.name,
          issuer: parsed.issuer || null,
          date_issued: parsed.dateIssued || null,
        });
      }

      // Update profile fields if selected
      const profileUpdates: any = {};
      conflicts?.profileConflicts?.forEach((c: any, i: number) => {
        if (selectedActions[`profile_${i}`] === "use_new") {
          const fieldMap: Record<string, string> = {
            "fullName": "full_name",
            "headline": "headline",
            "summary": "summary",
            "location": "location",
            "topSkills": "top_skills",
          };
          const dbField = fieldMap[c.field];
          if (dbField) profileUpdates[dbField] = c.newValue;
        }
      });

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("user_profiles").update(profileUpdates).eq("user_id", user.id);
      }

      toast({ title: "CV imported successfully!" });
      onImportComplete();
    } catch (err: any) {
      toast({ title: "Import error", description: err.message, variant: "destructive" });
    }

    setStep("upload");
  };

  if (step === "upload") {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Upload your CV</p>
        <p className="text-xs text-muted-foreground mb-4">Supports .txt, .docx, .pdf (text-based)</p>
        <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf,.doc" onChange={handleFileSelect} className="hidden" />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" />Choose File
        </Button>
      </div>
    );
  }

  if (step === "parsing") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Parsing your CV with AI…</p>
        <p className="text-xs text-muted-foreground mt-1">Extracting work history, education, and skills</p>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Importing data…</p>
      </div>
    );
  }

  // Conflicts view
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">CV Import Review</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{conflicts?.summary}</p>
      </div>

      {/* Profile conflicts */}
      {conflicts?.profileConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile Fields</h4>
          {conflicts.profileConflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg bg-accent/30 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">{c.field}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Current: </span><span className="text-foreground">{c.existingValue || "—"}</span></div>
                <div><span className="text-muted-foreground">CV: </span><span className="text-primary">{c.newValue || "—"}</span></div>
              </div>
              <div className="flex gap-2 mt-1">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name={`profile_${i}`} checked={selectedActions[`profile_${i}`] === "skip"} onChange={() => setSelectedActions(p => ({ ...p, [`profile_${i}`]: "skip" }))} />
                  Keep current
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name={`profile_${i}`} checked={selectedActions[`profile_${i}`] === "use_new"} onChange={() => setSelectedActions(p => ({ ...p, [`profile_${i}`]: "use_new" }))} />
                  Use CV value
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Work history conflicts */}
      {conflicts?.workHistoryConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work History</h4>
          {conflicts.workHistoryConflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg bg-accent/30 p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  {c.type === "new" && <CheckCircle className="h-3.5 w-3.5 text-verdict-go" />}
                  {c.type === "conflict" && <AlertTriangle className="h-3.5 w-3.5 text-verdict-review" />}
                  {c.type === "match" && <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium text-foreground">{c.parsedTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.parsedCompany}{c.differences?.length > 0 ? ` • ${c.differences.join(", ")}` : ""}</p>
              </div>
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                value={selectedActions[`work_${i}`] || "skip"}
                onChange={e => setSelectedActions(p => ({ ...p, [`work_${i}`]: e.target.value }))}
              >
                <option value="add">Add</option>
                <option value="replace">Replace</option>
                <option value="skip">Skip</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Education conflicts */}
      {conflicts?.educationConflicts?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Education</h4>
          {conflicts.educationConflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg bg-accent/30 p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">{c.parsedInstitution}</span>
                <span className="text-xs text-muted-foreground ml-2">{c.type === "new" ? "(New)" : c.type === "match" ? "(Exists)" : "(Conflict)"}</span>
              </div>
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                value={selectedActions[`edu_${i}`] || "skip"}
                onChange={e => setSelectedActions(p => ({ ...p, [`edu_${i}`]: e.target.value }))}
              >
                <option value="add">Add</option>
                <option value="replace">Replace</option>
                <option value="skip">Skip</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* New certificates */}
      {conflicts?.newCertificates?.filter((c: any) => c.isNew).length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Certificates</h4>
          {conflicts.newCertificates.filter((c: any) => c.isNew).map((c: any, i: number) => (
            <div key={i} className="text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-verdict-go" />
              {c.name}{c.issuer ? ` — ${c.issuer}` : ""}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setStep("upload")}>Cancel</Button>
        <Button size="sm" onClick={handleImport}>
          Import Selected
        </Button>
      </div>
    </div>
  );
};

export default CVUploadParser;
